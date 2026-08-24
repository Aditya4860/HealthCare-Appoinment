import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const createDoctorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  specialisation: z.string().min(1, "Specialisation is required"),
  slotDuration: z.number().int().positive(),
  workingHours: z.object({
    start: z.string(),
    end: z.string(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, "ADMIN");
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = createDoctorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      password,
      specialisation,
      slotDuration,
      workingHours,
    } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "DOCTOR",
        doctorProfile: {
          create: {
            specialisation,
            slotDuration,
            workingHours: JSON.stringify(workingHours),
          },
        },
      },
      include: {
        doctorProfile: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/doctors]", error);
    return NextResponse.json(
      { error: "Failed to create doctor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, "ADMIN");
    if (auth instanceof NextResponse) return auth;

    const doctors = await prisma.user.findMany({
      where: { role: "DOCTOR" },
      include: {
        doctorProfile: {
          include: {
            leaves: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error("[GET /api/admin/doctors]", error);
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}
