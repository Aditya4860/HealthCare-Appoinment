"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Loader2,
  Stethoscope,
  CalendarCheck,
  Sparkles,
} from "lucide-react";

// ── Illustration stat card ────────────────────────────────────────────────────
function StatCard({
  icon,
  iconBg,
  iconColor,
  text,
  offset = 0,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  text: React.ReactNode;
  offset?: number;
}) {
  return (
    <div
      className="bg-white rounded-2xl px-5 py-4 shadow-xl shadow-brand/25 flex items-center gap-3"
      style={{ marginLeft: `${offset}px` }}
    >
      <div
        className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <p className="text-[13px] font-medium text-slate-700 leading-snug">
        {text}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid email or password");
        return;
      }

      // Use window.location.href (full reload) so middleware re-reads the new
      // cookie before serving the protected dashboard page.
      const role = data.user?.role;
      if (role === "ADMIN") {
        window.location.href = "/admin/dashboard";
      } else if (role === "DOCTOR") {
        window.location.href = "/doctor/dashboard";
      } else {
        window.location.href = "/patient/dashboard";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel (desktop only) ──────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-brand flex-col p-10 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-28 -right-28 w-[26rem] h-[26rem] rounded-full bg-white/5" />
        <div className="absolute -bottom-36 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />

        {/* Logo */}
        <div className="relative z-10">
          <span className="font-display text-2xl font-bold text-white tracking-tight">
            MediBook
          </span>
        </div>

        {/* Stat cards illustration */}
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="space-y-3.5 w-[280px]">
            <StatCard
              icon={<Stethoscope size={16} />}
              iconBg="bg-brand-light"
              iconColor="text-brand"
              text={
                <>
                  <span className="text-brand font-semibold">127 Doctors</span>
                  {" · 4 Specialisations"}
                </>
              }
              offset={0}
            />
            <StatCard
              icon={<CalendarCheck size={16} />}
              iconBg="bg-accent/15"
              iconColor="text-accent"
              text="12 Appointments today"
              offset={28}
            />
            <StatCard
              icon={<Sparkles size={16} />}
              iconBg="bg-warn/15"
              iconColor="text-warn"
              text="AI-powered pre-visit summaries"
              offset={14}
            />
          </div>
        </div>

        {/* Tagline */}
        <p className="relative z-10 text-white/70 text-sm">
          Healthcare appointments, simplified.
        </p>
      </div>

      {/* ── Right panel — form ─────────────────────────────────────────────── */}
      <div className="w-full lg:w-[48%] flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <p className="lg:hidden font-display text-xl font-bold text-brand mb-8">
            MediBook
          </p>

          <h1 className="font-display text-2xl text-brand mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-muted mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
                className="input-base w-full disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="input-base w-full pr-11 disabled:opacity-60"
                />
                <button
                  type="button"
                  id="login-toggle-password"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted
                             hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full h-11 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>

            {/* Error banner */}
            {error && (
              <div
                role="alert"
                className="bg-danger/8 border border-danger/20 text-danger text-sm
                           px-4 py-3 rounded-xl leading-relaxed mt-2"
              >
                {error}
              </div>
            )}
            
            {/* Demo accounts */}
            <div>
              <p className="text-xs text-muted text-center mt-4 mb-2">Demo accounts</p>
              <div className="flex flex-col gap-1">
                {[
                  { label: 'Admin', email: 'admin@test.com', password: 'Admin123!' },
                  { label: 'Doctor', email: 'doctor@test.com', password: 'Doctor123!' },
                  { label: 'Patient', email: 'patient@test.com', password: 'Patient123!' },
                ].map((account) => (
                  <button
                    key={account.label}
                    type="button"
                    onClick={() => { setEmail(account.email); setPassword(account.password) }}
                    className="text-xs text-brand hover:underline text-left px-2 py-1 
                               rounded hover:bg-brand-light transition-colors"
                  >
                    <span className="font-medium">{account.label}:</span> {account.email}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted text-center mt-2">Click any account to auto-fill</p>
            </div>
          </form>

          <p className="text-sm text-muted text-center mt-7">
            New patient?{" "}
            <Link
              href="/register"
              className="text-brand font-medium hover:underline underline-offset-2"
            >
              Create an account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
