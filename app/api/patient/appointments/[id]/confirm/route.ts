import { NextRequest, NextResponse } from "next/server";
import { confirmSlot } from "@/lib/booking";
import { requireRole } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authRes = await requireRole(request, "PATIENT");
  if (authRes) return authRes;

  const { symptoms } = await request.json();
  if (!symptoms) {
    return NextResponse.json({ error: "Symptoms are required" }, { status: 400 });
  }

  try {
    const appointment = await confirmSlot(params.id, symptoms);
    return NextResponse.json({ appointment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
