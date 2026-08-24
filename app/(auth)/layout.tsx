/**
 * (auth) group layout — Server Component.
 *
 * Redirects already-authenticated users to their dashboard,
 * so visiting /login or /register while logged-in sends you straight home.
 */

import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";

const REDIRECT_MAP: Record<string, string> = {
  PATIENT: "/patient/dashboard",
  DOCTOR: "/doctor/dashboard",
  ADMIN: "/admin/dashboard",
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    const session = await verifyToken(token);
    if (session) {
      redirect(REDIRECT_MAP[session.role] ?? "/patient/dashboard");
    }
  }

  return <>{children}</>;
}
