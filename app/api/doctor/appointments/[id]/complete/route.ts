import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPostVisitSummary } from "@/lib/ai";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authRes = await requireRole(request, "DOCTOR");
  if (authRes instanceof Response) return authRes;

  const { notes, prescription } = await request.json();
  if (!notes) {
    return NextResponse.json({ error: "Notes are required" }, { status: 400 });
  }

  try {
    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        status: "COMPLETED",
        notes,
        // @ts-ignore
        prescription,
      }
    });

    // Trigger Post-visit AI in background without blocking response
    getPostVisitSummary(notes, prescription || "").then(async (aiResult) => {
      if (aiResult.summary) {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            // @ts-ignore
            patientSummary: aiResult.summary,
            // @ts-ignore
            medications: JSON.stringify(aiResult.medicationSchedule || []),
          }
        });

        // Create reminders
        if (aiResult.medicationSchedule && aiResult.medicationSchedule.length > 0) {
          const nextReminderAt = new Date(Date.now() + 60 * 60 * 1000); // +1 hour
          // @ts-ignore - fresh schema might not be loaded in ts server yet
          await prisma.medicationReminder.createMany({
            data: aiResult.medicationSchedule.map((m: any) => ({
              patientId: appointment.patientId,
              appointmentId: appointment.id,
              medicine: m.medicine,
              dose: m.dose,
              frequency: m.frequency,
              nextReminderAt
            }))
          });
        }
      }
    }).catch(e => console.error("Async Post-visit AI error:", e));

    return NextResponse.json({ appointment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
