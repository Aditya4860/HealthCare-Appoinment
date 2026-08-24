import { NextRequest, NextResponse } from "next/server";
import { confirmSlot } from "@/lib/booking";
import { requireRole } from "@/lib/auth";
import { getPreVisitSummary } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authRes = await requireRole(request, "PATIENT");
  if (authRes instanceof Response) return authRes;

  const { symptoms } = await request.json();
  if (!symptoms) {
    return NextResponse.json({ error: "Symptoms are required" }, { status: 400 });
  }

  try {
    const appointment = await confirmSlot(params.id, symptoms);

    // Trigger AI summary in background without blocking response
    getPreVisitSummary(symptoms).then(async (aiResult) => {
      if (aiResult.urgencyLevel) {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            urgencyLevel: aiResult.urgencyLevel,
            chiefConcern: aiResult.chiefComplaint,
            aiQuestions: JSON.stringify(aiResult.suggestedQuestions)
          }
        });
      }
    }).catch(e => console.error("Async Pre-visit AI error:", e));

    return NextResponse.json({ appointment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
