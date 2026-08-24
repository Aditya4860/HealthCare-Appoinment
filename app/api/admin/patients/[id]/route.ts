import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authRes = await requireRole(request, "ADMIN");
    if (authRes instanceof Response) return authRes;

    const patient = await prisma.user.findFirst({
      where: { id: params.id, role: "PATIENT" },
      include: {
        appointments: {
          include: {
            doctor: { select: { name: true, doctorProfile: { select: { specialisation: true } } } }
          },
          orderBy: { scheduledAt: "desc" }
        },
        reminders: {
          include: {
            appointment: { select: { doctor: { select: { name: true } } } }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

    // Map reminders to a consistent 'medications' field matching the frontend expectations
    const { password, ...safePatient } = patient;
    const mappedPatient = {
      ...safePatient,
      medications: patient.reminders,
      reminders: undefined
    };

    return NextResponse.json({ patient: mappedPatient });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authRes = await requireRole(request, "ADMIN");
    if (authRes instanceof Response) return authRes;

    const body = await request.json();

    // Email validation if changing
    if (body.email) {
      const existing = await prisma.user.findFirst({
        where: { email: body.email, id: { not: params.id } }
      });
      if (existing) {
        return NextResponse.json({ error: "Email is already taken by another user" }, { status: 400 });
      }
    }

    if (body.newPassword && body.newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (body.name !== undefined && body.name.trim() === "") {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.dateOfBirth) updateData.dateOfBirth = new Date(body.dateOfBirth);
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.bloodGroup !== undefined) updateData.bloodGroup = body.bloodGroup;
    if (body.allergies !== undefined) updateData.allergies = body.allergies;
    if (body.emergencyName !== undefined) updateData.emergencyName = body.emergencyName;
    if (body.emergencyPhone !== undefined) updateData.emergencyPhone = body.emergencyPhone;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.newPassword) {
      updateData.password = await bcrypt.hash(body.newPassword, 12);
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { 
        id: true, name: true, email: true, phone: true, 
        gender: true, bloodGroup: true, updatedAt: true 
      }
    });

    return NextResponse.json({ patient: updated, message: "Profile updated successfully" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authRes = await requireRole(request, "ADMIN");
    if (authRes instanceof Response) return authRes;

    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: "Patient account deactivated" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
