import { NextRequest, NextResponse } from "next/server";
import { confirmSlot } from "@/lib/booking";
import { requireRole } from "@/lib/auth";
import { getPreVisitSummary } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { queueEmail } from "@/lib/email";
import { createEvent } from "@/lib/calendar";
import { formatIST } from "@/lib/timezone";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authRes = await requireRole(request, "PATIENT");
  if (authRes instanceof Response) return authRes;

  const { symptoms } = await request.json();
  if (!symptoms) {
    return NextResponse.json({ error: "Symptoms are required" }, { status: 400 });
  }

  try {
    const appointment = await confirmSlot(params.id, symptoms);

    // Fetch full details for emails
    const fullAppt = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      include: { patient: true, doctor: true }
    });

    if (fullAppt) {
      const dateStr = formatIST(fullAppt.scheduledAt, "EEEE, MMM d");
      const timeStr = formatIST(fullAppt.scheduledAt, "hh:mm a 'IST'");

      // Queue patient email
      await queueEmail(
        prisma,
        fullAppt.patientId,
        "booking_confirmation",
        "Appointment Confirmed",
        `Your appointment with Dr. ${fullAppt.doctor.name} on ${dateStr} at ${timeStr} is confirmed.`
      );

      // Queue doctor email
      await queueEmail(
        prisma,
        fullAppt.doctorId,
        "booking_confirmation",
        "New Appointment Booked",
        `New appointment: ${fullAppt.patient.name} on ${dateStr} at ${timeStr}. Urgency: ${fullAppt.urgencyLevel || "Pending"}`
      );

      // Async create Calendar events
      (async () => {
        const patientEventId = await createEvent(fullAppt.patientId, fullAppt);
        const doctorEventId = await createEvent(fullAppt.doctorId, fullAppt);
        
        if (patientEventId || doctorEventId) {
          await prisma.appointment.update({
            where: { id: fullAppt.id },
            data: {
              ...(patientEventId ? { calEventPatient: patientEventId } : {}),
              ...(doctorEventId ? { calEventDoctor: doctorEventId } : {})
            }
          });
        }
      })().catch(e => console.error("Async calendar error:", e));
    }

    // Trigger AI summary in background without blocking response
    getPreVisitSummary(symptoms).then(async (aiResult) => {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          urgencyLevel: aiResult.urgency,
          chiefConcern: aiResult.chiefConcern,
          aiQuestions: JSON.stringify(aiResult.suggestedQuestions)
        }
      });
    }).catch(e => console.error("Async Pre-visit AI error:", e));

    return NextResponse.json({ appointment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
