/**
 * middleware.ts — Edge-runtime route protection.
 *
 * Protects /patient/*, /doctor/*, /admin/* and their /api/* equivalents.
 * Uses inline JWT verification (jose) — no Node.js APIs, fully edge-safe.
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET ||
      "change-me-before-production-at-least-32-chars"
  );

/** Maps a route prefix to the role that owns it. */
const ROLE_FOR_PREFIX: Record<string, string> = {
  "/patient": "PATIENT",
  "/doctor": "DOCTOR",
  "/admin": "ADMIN",
  "/api/patient": "PATIENT",
  "/api/doctor": "DOCTOR",
  "/api/admin": "ADMIN",
};

const DASHBOARD_FOR_ROLE: Record<string, string> = {
  PATIENT: "/patient/dashboard",
  DOCTOR: "/doctor/dashboard",
  ADMIN: "/admin/dashboard",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const role = payload.role as string;

    // Find the required role for this path prefix
    const requiredRole = Object.entries(ROLE_FOR_PREFIX).find(([prefix]) =>
      pathname.startsWith(prefix)
    )?.[1];

    // ADMIN can access all protected routes
    if (requiredRole && role !== requiredRole && role !== "ADMIN") {
      const fallback = DASHBOARD_FOR_ROLE[role] ?? "/login";
      return NextResponse.redirect(new URL(fallback, request.url));
    }

    return NextResponse.next();
  } catch {
    // Token invalid / expired
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("token", "", { maxAge: 0, path: "/" });
    return response;
  }
}

export const config = {
  matcher: [
    "/patient/:path*",
    "/doctor/:path*",
    "/admin/:path*",
    "/api/patient/:path*",
    "/api/doctor/:path*",
    "/api/admin/:path*",
  ],
};
