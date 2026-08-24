import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pending = await prisma.notification.findMany({
      where: { 
        status: "PENDING", 
        retryCount: { lt: 3 }, 
        nextRetryAt: { lte: new Date() } 
      },
      include: { user: true },
      take: 50
    });

    for (const notif of pending) {
      try {
        await sendEmail(notif.user.email, notif.subject, notif.body);
        await prisma.notification.update({ 
          where: { id: notif.id }, 
          data: { status: "SENT" } 
        });
      } catch (err) {
        console.error("Email send failed for notif", notif.id, err);
        const retryCount = notif.retryCount + 1;
        await prisma.notification.update({
          where: { id: notif.id },
          data: {
            retryCount,
            status: retryCount >= 3 ? "FAILED" : "PENDING",
            nextRetryAt: new Date(Date.now() + Math.pow(2, retryCount) * 2 * 60 * 1000)
          }
        });
      }
    }

    return NextResponse.json({ success: true, processed: pending.length });
  } catch (error: any) {
    console.error("Cron send-notifications error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
