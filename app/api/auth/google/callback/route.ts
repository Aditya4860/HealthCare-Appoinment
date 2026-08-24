import { NextRequest, NextResponse } from "next/server";
import { storeTokens } from "@/lib/calendar";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // This is the userId

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  try {
    await storeTokens(state, code);
    
    // Redirect back to correct dashboard
    const user = await prisma.user.findUnique({ where: { id: state } });
    if (user?.role === "DOCTOR") {
      return NextResponse.redirect(new URL("/doctor/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/patient/dashboard", request.url));
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    return NextResponse.json({ error: "Failed to authenticate with Google Calendar" }, { status: 500 });
  }
}
