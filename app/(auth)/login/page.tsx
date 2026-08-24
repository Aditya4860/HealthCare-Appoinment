"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, Eye, EyeOff, User, Stethoscope, Settings, ChevronRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role')
  const expiredParam = searchParams.get('expired')

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | 'admin' | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDemoFilled, setIsDemoFilled] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  useEffect(() => {
    if (expiredParam === 'true') {
      toast.error('Your session expired. Please sign in again.')
    }
    if (roleParam && ['patient', 'doctor', 'admin'].includes(roleParam.toLowerCase())) {
      handleSelectRole(roleParam.toLowerCase() as any)
    }
  }, [roleParam, expiredParam])

  const handleSelectRole = (role: 'patient' | 'doctor' | 'admin') => {
    setSelectedRole(role)
    setStep(2)
    setEmail('')
    setPassword('')
    setIsDemoFilled(false)
    setShowDemo(false)
  }

  const handleFillDemo = (role: 'patient' | 'doctor' | 'admin') => {
    if (role === 'patient') { setEmail('patient@test.com'); setPassword('Patient123!') }
    else if (role === 'doctor') { setEmail('doctor@test.com'); setPassword('Doctor123!') }
    else { setEmail('admin@test.com'); setPassword('Admin123!') }
    setIsDemoFilled(true)
    setShowDemo(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Login failed')
      } else {
        toast.success('Login successful!')
        if (data.user.role === 'ADMIN') window.location.href = '/admin/dashboard'
        else if (data.user.role === 'DOCTOR') window.location.href = '/doctor/dashboard'
        else window.location.href = '/patient/dashboard'
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const ROLE_ICON: Record<string, React.ReactNode> = {
    patient: <User size={22} />,
    doctor: <Stethoscope size={22} />,
    admin: <Settings size={22} />,
  }
  const ROLE_ICON_BG: Record<string, string> = {
    patient: 'bg-teal-50 text-teal-600',
    doctor: 'bg-[#EDE9FF] text-[#7C6FCD]',
    admin: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-[#1B3A6B] to-[#7C6FCD] flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
        {/* Medical cross SVG decoration */}
        <svg className="absolute right-16 top-1/2 -translate-y-1/2 opacity-5 w-72 h-72" viewBox="0 0 100 100" fill="white">
          <rect x="35" y="5" width="30" height="90" rx="8" />
          <rect x="5" y="35" width="90" height="30" rx="8" />
        </svg>

        <div className="relative z-10">
          <Link href="/" className="font-bold text-2xl text-white tracking-tight">MediBook</Link>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Healthcare,<br />Simplified.
          </h2>
          <p className="text-white/60 text-base leading-relaxed max-w-xs">
            Intelligent appointment management with AI-powered summaries for patients, doctors, and administrators.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {['No double-bookings ever', 'AI pre-visit analysis', 'Medication reminders'].map((t) => (
            <div key={t} className="flex items-center gap-3 text-sm text-white/70">
              <div className="w-1.5 h-1.5 rounded-full bg-[#7C6FCD]" />
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F8FAFC]">
        <div className="w-full max-w-md">

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1B3A6B] transition-colors mb-8">
                <ArrowLeft size={16} /> Back to main page
              </Link>

              <h2 className="text-2xl font-bold text-[#0F172A] mb-1">Sign in as...</h2>
              <p className="text-slate-500 text-sm mb-8">Choose your role to continue</p>

              <div className="space-y-3">
                {([
                  { role: 'patient' as const, label: 'Patient', desc: 'Book and manage appointments' },
                  { role: 'doctor' as const, label: 'Doctor', desc: 'View schedule and patient summaries' },
                  { role: 'admin' as const, label: 'Administrator', desc: 'Manage doctors and clinic settings' },
                ]).map(({ role, label, desc }) => (
                  <button
                    key={role}
                    onClick={() => handleSelectRole(role)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-[#7C6FCD] hover:bg-[#EDE9FF]/20 transition-all text-left group shadow-sm"
                  >
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${ROLE_ICON_BG[role]}`}>
                      {ROLE_ICON[role]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#0F172A]">{label}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-[#7C6FCD] transition-colors" />
                  </button>
                ))}
              </div>

              <p className="mt-8 text-center text-sm text-slate-500">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-[#7C6FCD] font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          )}

          {step === 2 && selectedRole && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1B3A6B] transition-colors mb-8"
              >
                <ArrowLeft size={16} /> Choose different role
              </button>

              <div className="mb-8">
                <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-3 ${ROLE_ICON_BG[selectedRole]}`}>
                  {ROLE_ICON[selectedRole]}
                  <span className="capitalize">{selectedRole}</span>
                </div>
                <h2 className="text-3xl font-bold text-[#0F172A]">Welcome back</h2>
              </div>

              {/* Demo accounts toggle */}
              <div className="mb-6">
                <button
                  onClick={() => setShowDemo((v) => !v)}
                  className="text-xs text-[#7C6FCD] font-medium hover:underline"
                >
                  {showDemo ? '▲ Hide' : '▼ Show'} demo credentials
                </button>
                {showDemo && (
                  <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm">
                    <p className="text-xs text-slate-500 font-medium mb-3">Quick fill — click to autofill</p>
                    {(['patient', 'doctor', 'admin'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => handleFillDemo(r)}
                        className="w-full text-left text-xs px-3 py-2 rounded-lg border border-slate-100 hover:bg-[#EDE9FF]/30 hover:border-[#7C6FCD]/30 transition-colors font-medium capitalize text-slate-600"
                      >
                        Fill as {r} demo
                      </button>
                    ))}
                  </div>
                )}
                {isDemoFilled && (
                  <p className="text-xs text-[#7C6FCD] mt-2">✓ Demo credentials filled — click Sign in</p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white border-slate-200 rounded-xl h-11 focus:border-[#7C6FCD] focus:ring-[#7C6FCD]/20"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white border-slate-200 rounded-xl h-11 pr-11 focus:border-[#7C6FCD] focus:ring-[#7C6FCD]/20"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1B3A6B] hover:bg-[#2A5298] text-white h-12 rounded-xl text-base font-medium mt-2 transition-all"
                >
                  {isLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Sign in'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
