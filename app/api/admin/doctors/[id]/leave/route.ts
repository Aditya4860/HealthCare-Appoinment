import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const leaveSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, "ADMIN");
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = leaveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid date format" },
        { status: 400 }
      );
    }

    const { date } = parsed.data;
    const userId = params.id; // Doctor's User ID

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!doctorProfile) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    // Convert string to Date
    const leaveDate = new Date(`${date}T00:00:00.000Z`);
    const startOfDay = new Date(leaveDate);
    const endOfDay = new Date(leaveDate);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const result = await prisma.$transaction(async (tx: { doctorLeave: { findFirst: (arg0: { where: { doctorProfileId: any; date: Date; }; }) => any; create: (arg0: { data: { doctorProfileId: any; date: Date; }; }) => any; }; appointment: { findMany: (arg0: { where: { doctorId: string; status: string; scheduledAt: { gte: Date; lt: Date; }; }; }) => any; update: (arg0: { where: { id: any; }; data: { status: string; }; }) => any; }; notification: { create: (arg0: { data: { userId: any; type: string; subject: string; body: string; }; }) => any; }; }) => {
      // 1. Upsert DoctorLeave
      // Note: SQLite doesn't have create/update like upsert when using composite unique, 
      // but we can just find and create since we don't need to update anything.
      let leave = await tx.doctorLeave.findFirst({
        where: { doctorProfileId: doctorProfile.id, date: leaveDate },
      });

      if (!leave) {
        leave = await tx.doctorLeave.create({
          data: {
            doctorProfileId: doctorProfile.id,
            date: leaveDate,
          },
        });
      }

      // 2. Find all CONFIRMED appointments for this date
      const appointments = await tx.appointment.findMany({
        where: {
          doctorId: userId,
          status: "CONFIRMED",
          scheduledAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });

      // 3 & 4. Update to CANCELLED and create Notifications
      for (const appt of appointments) {
        await tx.appointment.update({
          where: { id: appt.id },
          data: { status: "CANCELLED" },
        });

        await tx.notification.create({
          data: {
            userId: appt.patientId,
            type: "cancellation",
            subject: "Appointment Cancelled",
            body: `Your appointment on ${date} was cancelled due to doctor leave.`,
          },
        });
      }

      return appointments.length;
    });

    return NextResponse.json({
      leaveAdded: true,
      appointmentsCancelled: result,
    });
  } catch (error) {
    console.error("[POST /api/admin/doctors/[id]/leave]", error);
    return NextResponse.json(
      { error: "Failed to process leave" },
      { status: 500 }
    );
  }
}
