import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/calendar";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const token = cookies().get("token")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", request.url));

  const session = await verifyToken(token);
  if (!session) return NextResponse.redirect(new URL("/login", request.url));

  const authUrl = getAuthUrl(session.userId);
  return NextResponse.redirect(authUrl);
}
