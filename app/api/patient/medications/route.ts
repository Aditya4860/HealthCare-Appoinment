import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await verifyToken(token);
  if (!session || session.role !== "PATIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const medications = await prisma.medicationReminder.findMany({
    where: {
      patientId: session.userId,
    },
    include: {
      appointment: {
        include: { doctor: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ medications });
}
