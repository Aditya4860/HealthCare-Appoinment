import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const updateDoctorSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  email: z.string().email("Invalid email").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
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

    // Find the doctor user and profile
    const doctorUser = await prisma.user.findUnique({
      where: { id },
      include: { doctorProfile: true }
    });

    if (!doctorUser || !doctorUser.doctorProfile) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    const { name, email, password, specialisation, slotDuration, workingHours } = parsed.data;

    // Optional user updates
    const userUpdates: any = {};
    if (name !== undefined) userUpdates.name = name;
    if (email !== undefined) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
      userUpdates.email = email;
    }
    if (password) {
      // Must import bcrypt here or at top of file, let's assume I need to import it.
      // Wait, let's just make sure bcrypt is imported at the top of the file!
      const bcrypt = require("bcryptjs");
      userUpdates.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(userUpdates).length > 0) {
      await prisma.user.update({
        where: { id },
        data: userUpdates
      });
    }

    const dataToUpdate: Record<string, string | number> = {};
    if (specialisation !== undefined) {
      dataToUpdate.specialisation = specialisation;
    }
    if (slotDuration !== undefined) {
      dataToUpdate.slotDuration = slotDuration;
    }
    if (workingHours !== undefined) {
      dataToUpdate.workingHours = JSON.stringify(workingHours);
    }

    const updated = await prisma.doctorProfile.update({
      where: { userId: id },
      data: dataToUpdate,
      include: { user: true }
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
