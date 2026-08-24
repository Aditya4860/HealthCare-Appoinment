"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

export type UserRole = "ADMIN" | "DOCTOR" | "PATIENT";

interface NavbarProps {
  userName: string;
  role: UserRole;
}

const ROLE_PILL: Record<UserRole, string> = {
  PATIENT: "bg-teal-500/20 text-white",
  DOCTOR:  "bg-amber-500/20 text-white",
  ADMIN:   "bg-white/20 text-white",
};

const ROLE_LABEL: Record<UserRole, string> = {
  PATIENT: "Patient",
  DOCTOR:  "Doctor",
  ADMIN:   "Admin",
};

/**
 * Shared navbar for all authenticated pages.
 * h-16, sticky, bg-brand, with user name, role pill, divider, and Sign out.
 */
export function Navbar({ userName, role }: NavbarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  
  const [displayName, setDisplayName] = useState(userName);
  const [displayRole, setDisplayRole] = useState(role);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setDisplayName(data.user.name || data.user.email);
            setDisplayRole(data.user.role as UserRole);
          }
        }
      } catch (e) {
        console.error("Failed to fetch user", e);
      }
    }
    fetchUser();
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }

  return (
    <nav className="h-16 bg-brand sticky top-0 z-50 shadow-md">
      <div className="content-wrapper h-full flex items-center justify-between">
        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <Link
          href="/"
          className="font-display text-xl font-bold text-white tracking-tight
                     hover:opacity-90 transition-opacity"
        >
          MediBook
        </Link>

        {/* ── Desktop right ─────────────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-3">
          {/* User name */}
          <span className="text-white/90 text-sm font-medium">{displayName}</span>

          {/* Role badge */}
          <span
            className={`${ROLE_PILL[displayRole]} text-xs font-semibold px-2 py-0.5 rounded-full`}
          >
            {ROLE_LABEL[displayRole]}
          </span>

          {/* Divider */}
          <div className="w-px h-5 bg-white/20 mx-1" aria-hidden />

          {/* Sign out */}
          <button
            id="navbar-signout-btn"
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-white/70 hover:text-white text-sm transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>

        {/* ── Mobile hamburger ─────────────────────────────────────────── */}
        <button
          id="navbar-mobile-menu-btn"
          className="md:hidden text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Mobile dropdown ─────────────────────────────────────────────── */}
      {open && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-brand border-t border-white/10 z-40">
          <div className="content-wrapper py-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-white/90 text-sm font-medium">
                {displayName}
              </span>
              <span
                className={`${ROLE_PILL[displayRole]} text-xs font-semibold px-2 py-0.5 rounded-full`}
              >
                {ROLE_LABEL[displayRole]}
              </span>
            </div>

            <button
              onClick={() => {
                setOpen(false);
                handleSignOut();
              }}
              disabled={signingOut}
              className="text-white/70 hover:text-white text-sm text-left
                         transition-colors disabled:opacity-50"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
