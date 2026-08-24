"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export type UserRole = "ADMIN" | "DOCTOR" | "PATIENT";

interface NavbarProps {
  userName: string;
  role: UserRole;
  onLogout: () => void;
}

const ROLE_PILL: Record<UserRole, string> = {
  PATIENT: "bg-accent/20 text-accent",
  DOCTOR:  "bg-warn/20  text-warn",
  ADMIN:   "bg-brand-light text-brand",
};

const ROLE_LABEL: Record<UserRole, string> = {
  PATIENT: "Patient",
  DOCTOR:  "Doctor",
  ADMIN:   "Admin",
};

/**
 * Shared authenticated navbar — sticky, brand blue, 64px tall.
 * Collapses to a hamburger on mobile.
 */
export function Navbar({ userName, role, onLogout }: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="h-16 bg-brand sticky top-0 z-50 shadow-md">
      <div className="content-wrapper h-full flex items-center justify-between">
        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <Link
          href="/"
          className="font-display text-xl font-bold text-white tracking-tight hover:opacity-90 transition-opacity"
        >
          MediBook
        </Link>

        {/* ── Desktop right ────────────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-4">
          <span className="text-white text-sm font-medium">{userName}</span>

          <span
            className={`${ROLE_PILL[role]} text-xs font-semibold px-3 py-1 rounded-full`}
          >
            {ROLE_LABEL[role]}
          </span>

          <button
            id="navbar-logout-btn"
            onClick={onLogout}
            className="border border-white/40 text-white text-sm font-medium rounded-xl px-5 py-2
                       hover:bg-white/10 transition-colors duration-150"
          >
            Logout
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

      {/* ── Mobile dropdown ──────────────────────────────────────────────── */}
      {open && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-brand border-t border-white/10 z-40">
          <div className="content-wrapper py-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-white text-sm font-medium">{userName}</span>
              <span
                className={`${ROLE_PILL[role]} text-xs font-semibold px-3 py-1 rounded-full`}
              >
                {ROLE_LABEL[role]}
              </span>
            </div>

            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="border border-white/40 text-white text-sm font-medium rounded-xl px-5 py-2.5
                         hover:bg-white/10 transition-colors duration-150 text-left w-full"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
