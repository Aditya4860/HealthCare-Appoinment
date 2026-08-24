import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

  const deleted = await prisma.appointment.deleteMany({
    where: {
      status: "HOLD",
      createdAt: { lt: fifteenMinsAgo }
    }
  });

  return NextResponse.json({ success: true, count: deleted.count });
}
