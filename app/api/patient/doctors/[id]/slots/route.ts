import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/booking";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authRes = await requireRole(request, "PATIENT");
  if (authRes instanceof Response) return authRes;

  const date = request.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(params.id, date);
    
    // Check if on leave
    const profile = await prisma.doctorProfile.findFirst({
      where: { userId: params.id }
    });
    
    let onLeave = false;
    if (profile) {
      const targetDate = new Date(`${date}T00:00:00.000Z`);
      const leave = await prisma.doctorLeave.findFirst({
        where: { doctorProfileId: profile.id, date: targetDate }
      });
      if (leave) onLeave = true;
    }

    return NextResponse.json({ slots, onLeave });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
