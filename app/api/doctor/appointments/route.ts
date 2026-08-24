import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session || session.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appointments = await prisma.appointment.findMany({
    where: { doctorId: session.userId },
    include: {
      patient: {
        include: { patientProfile: true }
      }
    },
    orderBy: { scheduledAt: "asc" }
  });

  return NextResponse.json({ appointments });
}
