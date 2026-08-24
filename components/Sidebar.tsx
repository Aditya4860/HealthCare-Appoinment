"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  LogOut,
  PlusCircle,
  Pill,
  Stethoscope,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

export type SidebarRole = "DOCTOR" | "PATIENT" | "ADMIN";

interface SidebarProps {
  role: SidebarRole;
  userName: string;
}

const ROLE_LABEL: Record<SidebarRole, string> = {
  DOCTOR: "Doctor",
  PATIENT: "Patient",
  ADMIN: "Admin",
};

const ROLE_BADGE_STYLE: Record<SidebarRole, string> = {
  DOCTOR: "bg-amber-400/20 text-amber-200",
  PATIENT: "bg-teal-400/20 text-teal-200",
  ADMIN: "bg-purple-400/20 text-purple-200",
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const DOCTOR_NAV: NavItem[] = [
  { label: "Dashboard", href: "/doctor/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Patients", href: "/doctor/appointments", icon: <Users size={18} /> },
];

const PATIENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/patient/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Book Appointment", href: "/patient/book", icon: <PlusCircle size={18} /> },
  { label: "My Appointments", href: "/patient/appointments", icon: <Calendar size={18} /> },
  { label: "Medications", href: "/patient/medications", icon: <Pill size={18} /> },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Doctors", href: "/admin/doctors", icon: <Stethoscope size={18} /> },
  { label: "Patients", href: "/admin/patients", icon: <Users size={18} /> },
  { label: "Appointments", href: "/admin/appointments", icon: <Calendar size={18} /> },
];

const NAV_MAP: Record<SidebarRole, NavItem[]> = {
  DOCTOR: DOCTOR_NAV,
  PATIENT: PATIENT_NAV,
  ADMIN: ADMIN_NAV,
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const navItems = NAV_MAP[role];

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/" className="font-bold text-xl text-white tracking-tight">
          MediBook
        </Link>
        <p className="text-xs text-slate-400 mt-0.5">Healthcare Platform</p>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {getInitials(userName || "U")}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{userName}</p>
            <span
              className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${ROLE_BADGE_STYLE[role]}`}
            >
              {ROLE_LABEL[role]}
            </span>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
              {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-all disabled:opacity-50"
        >
          <LogOut size={18} />
          {signingOut ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 h-full w-60 bg-[#1B3A6B] flex-col z-40 shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#1B3A6B] z-40 flex items-center justify-between px-4 shadow-md">
        <Link href="/" className="font-bold text-lg text-white tracking-tight">
          MediBook
        </Link>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 h-full bg-[#1B3A6B] shadow-2xl flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
