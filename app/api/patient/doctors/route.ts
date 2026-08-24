import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authRes = await requireRole(request, "PATIENT");
  if (authRes instanceof Response) return authRes; // Unauthorized

  const searchParams = request.nextUrl.searchParams;
  const spec = searchParams.get("specialisation");

  const doctors = await prisma.user.findMany({
    where: {
      role: "DOCTOR",
      doctorProfile: spec && spec !== "All" ? { specialisation: spec } : undefined
    },
    include: {
      doctorProfile: {
        include: { leaves: true }
      }
    }
  });

  return NextResponse.json({ doctors });
}
