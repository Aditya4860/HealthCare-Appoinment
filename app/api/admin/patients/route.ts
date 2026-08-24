import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authRes = await requireRole(request, "ADMIN");
    if (authRes instanceof Response) return authRes;

    const patients = await prisma.user.findMany({
      where: { role: "PATIENT" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        allergies: true,
        emergencyName: true,
        emergencyPhone: true,
        address: true,
        createdAt: true,
        isActive: true,
        appointments: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            doctor: {
              select: {
                name: true
              }
            }
          },
          orderBy: { scheduledAt: "desc" }
        },
        reminders: {
          where: { nextReminderAt: { gte: new Date() }, active: true },
          select: { id: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const shaped = patients.map(p => ({
      ...p,
      appointmentCount: p.appointments.length,
      lastAppointment: p.appointments[0] ?? null,
      activeMedications: p.reminders.length,
      appointments: undefined,
      reminders: undefined,
    }));

    return NextResponse.json({ patients: shaped });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
