import { NextRequest, NextResponse } from "next/server";
import { cancelAppointment } from "@/lib/booking";
import { requireRole } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authRes = await requireRole(request, "PATIENT");
  if (authRes) return authRes;

  try {
    const appointment = await cancelAppointment(params.id);
    return NextResponse.json({ appointment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
