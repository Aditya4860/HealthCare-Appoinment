import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; date: string } }
) {
  try {
    const auth = await requireRole(request, "ADMIN");
    if (auth instanceof NextResponse) return auth;

    const { id, date } = params; // id is doctor's User ID

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: id },
    });

    if (!doctorProfile) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    const leaveDate = new Date(`${date}T00:00:00.000Z`);

    // Delete the leave
    await prisma.doctorLeave.deleteMany({
      where: {
        doctorProfileId: doctorProfile.id,
        date: leaveDate,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/doctors/[id]/leave/[date]]", error);
    return NextResponse.json(
      { error: "Failed to delete leave" },
      { status: 500 }
    );
  }
}
