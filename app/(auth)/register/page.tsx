"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Loader2,
  Stethoscope,
  CalendarCheck,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

// ── Password strength ─────────────────────────────────────────────────────────
type Strength = "weak" | "fair" | "strong";

function getStrength(pwd: string): { level: Strength; score: number } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { level: "weak", score };
  if (score <= 2) return { level: "fair", score };
  return { level: "strong", score };
}

const STRENGTH_COLORS: Record<Strength, string> = {
  weak: "bg-danger",
  fair: "bg-warn",
  strong: "bg-accent",
};

const STRENGTH_LABELS: Record<Strength, string> = {
  weak: "Weak",
  fair: "Fair",
  strong: "Strong",
};

const STRENGTH_TEXT: Record<Strength, string> = {
  weak: "text-danger",
  fair: "text-warn",
  strong: "text-accent",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { level, score } = password ? getStrength(password) : { level: "weak" as Strength, score: 0 };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      router.push(data.redirect ?? "/patient/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-brand flex-col p-10 relative overflow-hidden">
        <div className="absolute -top-28 -right-28 w-[26rem] h-[26rem] rounded-full bg-white/5" />
        <div className="absolute -bottom-36 -left-20 w-80 h-80 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10">
          <span className="font-display text-2xl font-bold text-white tracking-tight">
            MediBook
          </span>
        </div>

        {/* Stat cards */}
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="space-y-3.5 w-[280px]">
            {[
              {
                icon: <Stethoscope size={16} />,
                bg: "bg-brand-light",
                color: "text-brand",
                text: (
                  <>
                    <span className="text-brand font-semibold">127 Doctors</span>
                    {" · 4 Specialisations"}
                  </>
                ),
                offset: 0,
              },
              {
                icon: <CalendarCheck size={16} />,
                bg: "bg-accent/15",
                color: "text-accent",
                text: "12 Appointments today",
                offset: 28,
              },
              {
                icon: <Sparkles size={16} />,
                bg: "bg-warn/15",
                color: "text-warn",
                text: "AI-powered pre-visit summaries",
                offset: 14,
              },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl px-5 py-4 shadow-xl shadow-brand/25 flex items-center gap-3"
                style={{ marginLeft: `${card.offset}px` }}
              >
                <div
                  className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
                >
                  <span className={card.color}>{card.icon}</span>
                </div>
                <p className="text-[13px] font-medium text-slate-700 leading-snug">
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/70 text-sm">
          Healthcare appointments, simplified.
        </p>
      </div>

      {/* ── Right panel — form ─────────────────────────────────────────────── */}
      <div className="w-full lg:w-[48%] flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">
          <p className="lg:hidden font-display text-xl font-bold text-brand mb-8">
            MediBook
          </p>

          <Link href="/" className="text-sm font-inter text-slate-500 hover:text-brand flex items-center gap-1.5 mb-8 transition-colors inline-flex">
            <ArrowLeft size={16} /> Back to main page
          </Link>

          <h1 className="font-display text-2xl text-brand mb-1">
            Create your account
          </h1>
          <p className="text-sm text-slate-500 mb-8">
            Join thousands of patients managing their health.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name */}
            <div>
              <label
                htmlFor="register-name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Full name
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                required
                disabled={isLoading}
                className="input-base w-full disabled:opacity-60"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="register-email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email address
              </label>
              <input
                id="register-email"
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

            {/* Password + strength */}
            <div>
              <label
                htmlFor="register-password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  disabled={isLoading}
                  className="input-base w-full pr-11 disabled:opacity-60"
                />
                <button
                  type="button"
                  id="register-toggle-password"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500
                             hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          bar <= score
                            ? STRENGTH_COLORS[level]
                            : "bg-slate-100"
                        }`}
                      />
                    ))}
                  </div>
                  <p
                    className={`text-xs font-medium ${STRENGTH_TEXT[level]}`}
                  >
                    {STRENGTH_LABELS[level]} password
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full h-11 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="bg-danger/8 border border-danger/20 text-danger text-sm
                           px-4 py-3 rounded-xl leading-relaxed"
              >
                {error}
              </div>
            )}
          </form>

          {/* Note about doctors */}
          <p className="text-xs text-slate-500 text-center mt-4 bg-surface rounded-xl px-4 py-3">
            🩺 Doctors are added by admin only.
          </p>

          <p className="text-sm text-slate-500 text-center mt-4">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-brand font-medium hover:underline underline-offset-2"
            >
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
