import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authRes = await requireRole(request, "ADMIN");
    if (authRes instanceof Response) return authRes;

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    let where: any = {};
    if (filter === "today") {
      where.scheduledAt = { gte: startOfDay, lt: endOfDay };
    } else if (filter === "week") {
      where.scheduledAt = { gte: startOfWeek };
    } else if (filter === "completed") {
      where.status = "COMPLETED";
    } else if (filter === "cancelled") {
      where.status = "CANCELLED";
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: { id: true, name: true, email: true, phone: true }
        },
        doctor: { 
          select: { id: true, name: true, email: true },
          // @ts-ignore
          include: { doctorProfile: true } 
        },
      },
      orderBy: { scheduledAt: "desc" },
    });

    return NextResponse.json({ appointments });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
