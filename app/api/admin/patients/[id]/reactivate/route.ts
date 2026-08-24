import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authRes = await requireRole(request, "ADMIN");
    if (authRes instanceof Response) return authRes;

    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: true }
    });

    return NextResponse.json({ message: "Patient account reactivated" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
