import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queueEmail } from "@/lib/email";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { sent: 0, skipped: 0, errors: [] as string[] };

  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const activeReminders = await prisma.medicationReminder.findMany({
      where: { active: true },
      include: { appointment: { include: { patient: true } } }
    });

    const now = new Date();

    for (const r of activeReminders) {
      try {
        // Skip if outside start/end date
        if (r.startDate && now < r.startDate) {
          results.skipped++;
          continue;
        }
        if (r.endDate && now > r.endDate) {
          // Deactivate it if passed end date
          await prisma.medicationReminder.update({ where: { id: r.id }, data: { active: false } });
          results.skipped++;
          continue;
        }

        // Check if already sent today
        if (r.lastSentAt && r.lastSentAt >= todayStart) {
          results.skipped++;
          continue;
        }

        // Check if it's time for the next reminder
        if (now < r.nextReminderAt) {
          results.skipped++;
          continue;
        }

        // Send email
        await queueEmail(
          prisma, 
          r.appointment.patientId, 
          "reminder",
          `Medication Reminder: ${r.medicine}`,
          `Please take ${r.medicine} - ${r.frequency}.`
        );
        
        console.log(`[${now.toISOString()}] Reminder sent to ${r.appointment.patient.email} for ${r.medicine}`);
        
        // Update DB
        await prisma.medicationReminder.update({
          where: { id: r.id },
          data: { 
            lastSentAt: now,
            nextReminderAt: new Date(now.getTime() + 8 * 60 * 60 * 1000) // Next slot (e.g. +8h)
          }
        });
        
        results.sent++;
      } catch (err: any) {
        console.error(`Failed to process reminder ${r.id}:`, err);
        results.errors.push(`Failed for reminder ${r.id}: ${err.message}`);
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Cron medication-reminders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
