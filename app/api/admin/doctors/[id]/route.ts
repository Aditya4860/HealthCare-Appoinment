import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const updateDoctorSchema = z.object({
  specialisation: z.string().min(1).optional(),
  slotDuration: z.number().int().positive().optional(),
  workingHours: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, "ADMIN");
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = updateDoctorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { id } = params; // Doctor's User ID

    // Find the doctor profile
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: id },
    });

    if (!doctorProfile) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 }
      );
    }

    const dataToUpdate: Record<string, string | number> = {};
    if (parsed.data.specialisation !== undefined) {
      dataToUpdate.specialisation = parsed.data.specialisation;
    }
    if (parsed.data.slotDuration !== undefined) {
      dataToUpdate.slotDuration = parsed.data.slotDuration;
    }
    if (parsed.data.workingHours !== undefined) {
      dataToUpdate.workingHours = JSON.stringify(parsed.data.workingHours);
    }

    const updated = await prisma.doctorProfile.update({
      where: { userId: id },
      data: dataToUpdate,
    });

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error("[PATCH /api/admin/doctors/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update doctor" },
      { status: 500 }
    );
  }
}
