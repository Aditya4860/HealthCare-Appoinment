import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authRes = await requireRole(request, "DOCTOR");
  if (authRes) return authRes;

  const { notes, prescription } = await request.json();
  if (!notes) {
    return NextResponse.json({ error: "Notes are required" }, { status: 400 });
  }

  // Parse prescription into JSON medication list (mock AI logic)
  const medications = prescription 
    ? prescription.split('\n').filter((l: string) => l.trim().length > 0).map((line: string) => {
        return {
          medicine: line.split(' ')[0] || line,
          dose: line.includes('mg') ? line.match(/(\d+mg)/)?.[0] || "-" : "-",
          frequency: line.includes('daily') || line.includes('needed') || line.includes('twice') ? line.split(' ').slice(1).join(' ') : "-"
        };
      })
    : [];

  const patientSummary = `This is a generated post-visit summary based on the doctor's notes.\n\nKey Findings:\n- ${notes}\n\nPlease follow the prescribed medication schedule carefully.`;

  try {
    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        status: "COMPLETED",
        notes,
        // @ts-ignore
        prescription,
        // @ts-ignore
        medications: JSON.stringify(medications),
        patientSummary,
      }
    });

    return NextResponse.json({ appointment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
