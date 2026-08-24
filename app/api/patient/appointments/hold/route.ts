import { NextRequest, NextResponse } from "next/server";
import { holdSlot } from "@/lib/booking";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || session.role !== "PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { doctorId, date, time } = await request.json();
    if (!doctorId || !date || !time) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const appointment = await holdSlot(session.userId, doctorId, date, time);
    return NextResponse.json({ appointment });
  } catch (err: any) {
    if (
      err.message === "Slot is already taken" ||
      err.message === "Doctor is unavailable on this date" ||
      err.message === "This slot is outside the doctor's working hours" ||
      err.message === "Cannot book slots in the past"
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
