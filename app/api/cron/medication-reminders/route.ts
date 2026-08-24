import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queueEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const due = await prisma.medicationReminder.findMany({
      where: { 
        active: true, 
        nextReminderAt: { lte: new Date() } 
      },
      include: { appointment: { include: { patient: true } } }
    });

    for (const r of due) {
      await queueEmail(
        prisma, 
        r.appointment.patientId, 
        "reminder",
        `Medication Reminder: ${r.medicine}`,
        `Please take ${r.medicine} - ${r.frequency}.`
      );
      
      // Schedule next reminder based on frequency (simple: add 8 hours)
      await prisma.medicationReminder.update({
        where: { id: r.id },
        data: { nextReminderAt: new Date(Date.now() + 8 * 60 * 60 * 1000) }
      });
    }

    return NextResponse.json({ success: true, processed: due.length });
  } catch (error: any) {
    console.error("Cron medication-reminders error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
