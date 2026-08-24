import { NextRequest, NextResponse } from "next/server";
import { cancelAppointment } from "@/lib/booking";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queueEmail } from "@/lib/email";
import { deleteEvent } from "@/lib/calendar";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authRes = await requireRole(request, "PATIENT");
  if (authRes instanceof Response) return authRes;

  try {
    const appointment = await cancelAppointment(params.id);

    const fullAppt = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: { patient: true }
    });

    if (fullAppt) {
      const dateStr = fullAppt.scheduledAt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const timeStr = fullAppt.scheduledAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

      await queueEmail(
        prisma,
        fullAppt.doctorId,
        "cancellation",
        "Appointment Cancelled",
        `Your appointment with ${fullAppt.patient.name} on ${dateStr} at ${timeStr} has been cancelled.`
      );

      // Async delete Calendar events
      if (fullAppt.calEventPatient) deleteEvent(fullAppt.patientId, fullAppt.calEventPatient).catch(console.error);
      if (fullAppt.calEventDoctor) deleteEvent(fullAppt.doctorId, fullAppt.calEventDoctor).catch(console.error);
    }

    return NextResponse.json({ appointment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
