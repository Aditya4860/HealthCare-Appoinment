/**
 * lib/auth.ts — JWT + session utilities
 *
 * Edge-safe: uses only jose (no Node.js-specific APIs).
 * getServerSession() uses next/headers cookies() for Server Components.
 * getSession(request) uses NextRequest.cookies for API routes / middleware.
 */

import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

// ── Secret ────────────────────────────────────────────────────────────────────
import { env } from "@/lib/env";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(
    env.JWT_SECRET ||
      "change-me-before-production-at-least-32-chars"
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

// ── Core JWT functions ────────────────────────────────────────────────────────

/** Signs a JWT with HS256, 7-day expiry. */
export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

/** Returns the decoded payload, or null if the token is invalid / expired. */
export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

// ── Session helpers ───────────────────────────────────────────────────────────

/**
 * Read session from a NextRequest (API routes, middleware).
 * Does NOT use next/headers — safe on the Edge.
 */
export async function getSession(
  request: NextRequest
): Promise<SessionPayload | null> {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Read session in a Server Component via next/headers cookies().
 * Must only be called from the Node.js runtime (not edge middleware).
 */
export async function getServerSession(): Promise<SessionPayload | null> {
  try {
    // Dynamic import keeps this module edge-compatible when not calling this fn
    const { cookies } = await import("next/headers");
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

export function setTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export function clearTokenCookie(response: NextResponse): void {
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

// ── Role guard ────────────────────────────────────────────────────────────────

/**
 * Returns the session payload if one of the allowed roles matches.
 * Returns NextResponse 401 (no session) or 403 (wrong role) otherwise.
 */
export async function requireRole(
  request: NextRequest,
  ...allowedRoles: string[]
): Promise<SessionPayload | NextResponse> {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}
