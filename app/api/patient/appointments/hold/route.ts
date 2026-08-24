import { NextRequest, NextResponse } from "next/server";
import { holdSlot } from "@/lib/booking";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session || session.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { doctorId, date, time } = await request.json();
  if (!doctorId || !date || !time) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const appointment = await holdSlot(session.userId, doctorId, date, time);
    return NextResponse.json({ appointment });
  } catch (err: any) {
    // Return 409 Conflict if slot is taken
    if (err.message === "Slot is already taken") {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
