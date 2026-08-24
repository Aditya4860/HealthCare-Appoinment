import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import Link from 'next/link'
import { Check, Sparkles, Stethoscope, Settings, User, ArrowRight, Shield, Clock, Bell } from 'lucide-react'

export default async function RootPage() {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value

  if (token) {
    const payload = await verifyToken(token)
    if (payload) {
      const role = (payload as any).role
      if (role === 'ADMIN') redirect('/admin/dashboard')
      if (role === 'DOCTOR') redirect('/doctor/dashboard')
      redirect('/patient/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-[#7C6FCD]/20">

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="font-bold text-xl text-[#1B3A6B] tracking-tight">MediBook</span>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-[#1B3A6B] transition-colors">Features</a>
            <a href="#portals" className="hover:text-[#1B3A6B] transition-colors">Portals</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[#1B3A6B] hover:text-[#2A5298] transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/register" className="bg-[#1B3A6B] hover:bg-[#2A5298] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shadow-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="min-h-screen bg-gradient-to-br from-[#1B3A6B] to-[#2A5298] flex items-center relative overflow-hidden pt-16">
        {/* Decorative circles */}
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-[-150px] left-[-80px] w-[400px] h-[400px] rounded-full bg-[#7C6FCD]/20 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col lg:flex-row items-center gap-16 py-20">

          {/* Left copy */}
          <div className="w-full lg:w-[55%] z-10">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full mb-8">
              <Sparkles size={14} className="text-[#7C6FCD]" />
              AI-Powered Healthcare
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
              Your Health,<br />
              <span className="text-[#7C6FCD]">Managed Smarter</span>
            </h1>

            <p className="text-slate-300 text-lg mt-6 max-w-lg leading-relaxed">
              Book appointments, receive AI pre-visit summaries, and stay on top of your medications — all in one seamless platform.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="bg-white text-[#1B3A6B] font-semibold px-8 py-3.5 rounded-xl hover:bg-slate-100 transition-all text-center shadow-lg hover:-translate-y-0.5">
                Create Patient Account
              </Link>
              <Link href="/login" className="border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 hover:border-white/50 transition-all text-center">
                Sign In →
              </Link>
            </div>

            {/* Trust pills */}
            <div className="mt-10 flex flex-wrap gap-6 text-slate-400 text-sm">
              <span className="flex items-center gap-2"><Check size={16} className="text-[#7C6FCD]" /> No double-booking</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-[#7C6FCD]" /> AI summaries</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-[#7C6FCD]" /> Instant confirmations</span>
            </div>
          </div>

          {/* Right floating cards */}
          <div className="w-full lg:w-[45%] hidden lg:flex items-center justify-center relative h-[480px]">

            {/* Card 1: AI Summary */}
            <div className="absolute top-4 left-0 bg-white rounded-2xl shadow-2xl shadow-black/20 p-5 w-64 z-10 hover:-translate-y-2 transition-transform duration-300 border border-white/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-[#EDE9FF] p-2 rounded-lg text-[#7C6FCD]"><Sparkles size={16} /></div>
                <span className="font-semibold text-sm text-slate-800">AI Pre-visit Summary</span>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Urgency: Medium</p>
              <div className="bg-amber-50 text-amber-700 text-xs px-3 py-2 rounded-lg font-medium border border-amber-100 mb-3">
                Chief concern: Knee pain
              </div>
              <p className="text-xs text-slate-400 italic">3 questions ready for your doctor</p>
            </div>

            {/* Card 2: Confirmed — center */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 bg-gradient-to-br from-[#1B3A6B] to-[#2A5298] text-white rounded-2xl shadow-2xl shadow-[#1B3A6B]/40 p-6 w-72 z-20 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-white/20 p-1.5 rounded-full"><Check size={14} /></div>
                <span className="font-bold text-[15px]">Appointment Confirmed</span>
              </div>
              <p className="font-semibold text-lg mb-0.5">Dr. Jane Smith</p>
              <p className="text-[#7C6FCD] text-sm mb-4">Cardiology</p>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="font-semibold text-sm">Tomorrow, 10:00 AM</p>
              </div>
              <p className="text-xs text-white/50 mt-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#7C6FCD] animate-pulse inline-block" />
                Calendar event created
              </p>
            </div>

            {/* Card 3: Medication */}
            <div className="absolute bottom-4 left-8 bg-white rounded-2xl shadow-2xl shadow-black/20 p-5 w-64 z-10 hover:-translate-y-2 transition-transform duration-300 border border-white/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-[#EDE9FF] p-2 rounded-lg text-[#7C6FCD]">
                  <Bell size={16} />
                </div>
                <span className="font-semibold text-sm text-slate-800">Medication Reminder</span>
              </div>
              <p className="font-semibold text-slate-800 text-base mb-1">Amoxicillin 500mg</p>
              <p className="text-xs text-slate-400 mb-3">Time to take your dose</p>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-[#7C6FCD] h-full rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#EDE9FF] text-[#7C6FCD] text-xs font-semibold px-4 py-2 rounded-full mb-4">
              <Sparkles size={12} /> Platform Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight mb-4">Everything You Need</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Built for modern healthcare teams and patients alike</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Clock size={24} />,
                color: "bg-[#EDE9FF] text-[#7C6FCD]",
                title: "Smart Scheduling",
                desc: "Zero double-bookings. Doctors set their hours and slot durations; patients pick what's free.",
              },
              {
                icon: <Sparkles size={24} />,
                color: "bg-[#EDE9FF] text-[#7C6FCD]",
                title: "AI-Powered Summaries",
                desc: "Pre-visit AI analysis of symptoms generates urgency scores and suggested questions for your doctor.",
              },
              {
                icon: <Bell size={24} />,
                color: "bg-[#EDE9FF] text-[#7C6FCD]",
                title: "Medication Reminders",
                desc: "After each visit, AI extracts prescriptions into structured reminders so you never miss a dose.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-[#F8FAFC] rounded-2xl p-8 border border-slate-100 hover:shadow-lg hover:border-[#7C6FCD]/20 transition-all group">
                <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg text-[#0F172A] mb-3">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PORTALS ─────────────────────────────────────────────────────────── */}
      <section id="portals" className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight mb-4">Three Portals, One Platform</h2>
            <p className="text-slate-500 text-lg">Tailored dashboards for every role</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Patient */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:shadow-xl hover:border-[#7C6FCD]/30 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <User size={28} />
              </div>
              <h3 className="font-bold text-xl text-[#0F172A] mb-4">For Patients</h3>
              <ul className="space-y-3 text-sm text-slate-500 mb-8">
                {["Search by specialisation", "Real-time slot booking", "AI pre-visit summaries", "Medication reminders"].map((i) => (
                  <li key={i} className="flex gap-2 items-start"><span className="text-teal-500 mt-0.5">•</span>{i}</li>
                ))}
              </ul>
              <Link href="/register" className="inline-flex items-center gap-1 text-teal-600 font-medium text-sm hover:gap-2 transition-all">
                Create Account <ArrowRight size={14} />
              </Link>
            </div>

            {/* Doctor — elevated */}
            <div className="bg-[#1B3A6B] rounded-3xl p-8 shadow-2xl shadow-[#1B3A6B]/30 relative transform md:-translate-y-4 group">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#7C6FCD] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                Clinicians
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-6">
                <Stethoscope size={28} />
              </div>
              <h3 className="font-bold text-xl text-white mb-4">For Doctors</h3>
              <ul className="space-y-3 text-sm text-slate-300 mb-8">
                {["AI patient summaries", "Urgency levels pre-visit", "Clinical notes & prescriptions", "Google Calendar sync"].map((i) => (
                  <li key={i} className="flex gap-2 items-start"><span className="text-[#7C6FCD] mt-0.5">•</span>{i}</li>
                ))}
              </ul>
              <Link href="/login?role=doctor" className="inline-flex items-center gap-1 text-[#7C6FCD] font-medium text-sm hover:gap-2 transition-all">
                Doctor Login <ArrowRight size={14} />
              </Link>
            </div>

            {/* Admin */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:shadow-xl hover:border-[#7C6FCD]/30 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Settings size={28} />
              </div>
              <h3 className="font-bold text-xl text-[#0F172A] mb-4">For Admins</h3>
              <ul className="space-y-3 text-sm text-slate-500 mb-8">
                {["Manage doctor profiles", "Set working hours & slots", "Schedule leave days", "Patient & appointment oversight"].map((i) => (
                  <li key={i} className="flex gap-2 items-start"><span className="text-amber-500 mt-0.5">•</span>{i}</li>
                ))}
              </ul>
              <Link href="/login?role=admin" className="inline-flex items-center gap-1 text-amber-600 font-medium text-sm hover:gap-2 transition-all">
                Admin Login <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-[#1B3A6B] py-10 border-t border-[#2A5298]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-bold text-white text-xl tracking-tight">MediBook</div>
          <div className="text-white/50 text-sm">Healthcare appointments, simplified.</div>
          <div className="text-white/30 text-xs">© {new Date().getFullYear()} MediBook</div>
        </div>
      </footer>
    </div>
  )
}
