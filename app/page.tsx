import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import Link from 'next/link'
import { Check, CheckCircle2, Pill, Sparkles, Stethoscope, Settings, User } from 'lucide-react'

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
    <div className="min-h-screen bg-surface selection:bg-brand/20">
      {/* SECTION 1 — Hero */}
      <section className="min-h-screen flex items-center relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-brand-light/50 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row items-center gap-12 py-20">
          
          {/* Left side (55%) */}
          <div className="w-full md:w-[55%] z-10">
            <div className="bg-brand/10 text-brand text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-6 font-inter border border-brand/20">
              <span>🏥</span> AI-Powered Healthcare Platform
            </div>
            
            <h1 className="font-sora text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
              Your Health,<br/>
              <span className="text-brand relative">
                Managed Smarter
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-brand/20 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
              </span>
            </h1>
            
            <p className="font-inter text-xl text-slate-600 mt-6 max-w-lg leading-relaxed">
              Book appointments, get AI-powered pre-visit summaries, and stay on top of your medications — all in one seamless platform.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="bg-brand text-white px-8 py-3.5 rounded-xl font-medium font-inter hover:bg-brand/90 transition-all text-center shadow-lg shadow-brand/20 hover:shadow-brand/30 hover:-translate-y-0.5">
                Create Patient Account
              </Link>
              <Link href="/login" className="border-2 border-brand/20 text-brand px-8 py-3.5 rounded-xl font-medium font-inter hover:bg-brand-light hover:border-brand/40 transition-all text-center">
                Sign in
              </Link>
            </div>
            
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500 font-inter font-medium">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="text-accent" size={18} /> No double-booking</span>
              <span className="flex items-center gap-1.5"><Sparkles className="text-warn" size={18} /> AI summaries</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="text-accent" size={18} /> Instant confirmations</span>
            </div>
          </div>
          
          {/* Right side (45%) */}
          <div className="w-full md:w-[45%] hidden md:flex items-center justify-center relative h-[500px]">
            
            {/* Card 1: AI Summary */}
            <div className="absolute top-0 left-0 bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-5 w-64 border border-slate-100 z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both hover:-translate-y-2 transition-transform hover:z-30">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-brand/10 p-2 rounded-lg text-brand"><Sparkles size={18} /></div>
                <span className="font-sora font-bold text-sm text-slate-800">AI Pre-visit Summary</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 font-inter uppercase tracking-wide mb-2">Urgency: Medium</p>
              <div className="bg-warn/10 text-warn-700 text-xs px-2.5 py-1.5 rounded-md font-medium font-inter inline-block mb-3 border border-warn/20">
                Chief concern: Knee pain
              </div>
              <p className="text-xs text-slate-500 font-inter italic">3 questions ready for your doctor</p>
            </div>

            {/* Card 2: Appointment Confirmed */}
            <div className="absolute top-1/2 right-0 translate-x-4 -translate-y-1/2 bg-brand text-white rounded-2xl shadow-2xl shadow-brand/30 p-6 w-72 z-20 animate-in fade-in zoom-in duration-700 delay-300 fill-mode-both hover:scale-105 transition-transform hover:z-30 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-white/20 p-1.5 rounded-full"><Check size={16} /></div>
                <span className="font-sora font-bold text-[15px]">Appointment Confirmed</span>
              </div>
              <p className="font-inter font-medium text-lg mb-1">Dr. Jane Smith</p>
              <p className="text-brand-light text-sm font-inter mb-4">Cardiology</p>
              <div className="bg-black/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="font-inter font-semibold text-sm">Tomorrow, 10:00 AM</p>
              </div>
              <p className="text-xs text-brand-light/70 font-inter mt-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span> Calendar event created
              </p>
            </div>

            {/* Card 3: Medication */}
            <div className="absolute bottom-0 left-8 bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-5 w-64 border border-slate-100 z-10 animate-in fade-in slide-in-from-top-4 duration-700 delay-500 fill-mode-both hover:-translate-y-2 transition-transform hover:z-30">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-accent/10 p-2 rounded-lg text-accent"><Pill size={18} /></div>
                <span className="font-sora font-bold text-sm text-slate-800">Medication Reminder</span>
              </div>
              <p className="font-inter font-semibold text-slate-800 text-base mb-1">Amoxicillin 500mg</p>
              <p className="text-xs text-slate-500 font-inter mb-4">Time to take your dose</p>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-accent h-full rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 2 — How it Works */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-sora text-3xl md:text-4xl font-bold text-brand mb-4">How MediBook Works</h2>
            <p className="font-inter text-lg text-slate-500">Three portals, one seamless experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Patient Column */}
            <div className="bg-surface rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-6">
                <User size={28} />
              </div>
              <h3 className="font-sora text-xl font-semibold text-slate-800 mb-4">For Patients</h3>
              <ul className="space-y-3 text-sm text-slate-600 font-inter mb-8">
                <li className="flex gap-2"><span className="text-accent">•</span> Search doctors by specialisation</li>
                <li className="flex gap-2"><span className="text-accent">•</span> Book slots with no double-booking</li>
                <li className="flex gap-2"><span className="text-accent">•</span> Get AI pre-visit summaries</li>
                <li className="flex gap-2"><span className="text-accent">•</span> Receive medication reminders</li>
              </ul>
              <Link href="/register" className="text-accent font-medium text-sm font-inter inline-flex items-center hover:underline group">
                Create Account <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>

            {/* Doctor Column */}
            <div className="bg-white rounded-3xl p-8 border-2 border-brand shadow-xl relative transform md:-translate-y-4">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                Clinicians
              </div>
              <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-6">
                <Stethoscope size={28} />
              </div>
              <h3 className="font-sora text-xl font-semibold text-slate-800 mb-4">For Doctors</h3>
              <ul className="space-y-3 text-sm text-slate-600 font-inter mb-8">
                <li className="flex gap-2"><span className="text-brand">•</span> See AI pre-visit patient summaries</li>
                <li className="flex gap-2"><span className="text-brand">•</span> View urgency levels before visits</li>
                <li className="flex gap-2"><span className="text-brand">•</span> Submit clinical notes easily</li>
                <li className="flex gap-2"><span className="text-brand">•</span> Generate patient-friendly summaries</li>
              </ul>
              <Link href="/login?role=doctor" className="text-brand font-medium text-sm font-inter inline-flex items-center hover:underline group">
                Doctor Login <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>

            {/* Admin Column */}
            <div className="bg-surface rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-warn/10 text-warn-700 flex items-center justify-center mb-6">
                <Settings size={28} />
              </div>
              <h3 className="font-sora text-xl font-semibold text-slate-800 mb-4">For Admins</h3>
              <ul className="space-y-3 text-sm text-slate-600 font-inter mb-8">
                <li className="flex gap-2"><span className="text-warn-700">•</span> Create and manage doctor profiles</li>
                <li className="flex gap-2"><span className="text-warn-700">•</span> Set working hours and slot durations</li>
                <li className="flex gap-2"><span className="text-warn-700">•</span> Manage doctor leave days</li>
                <li className="flex gap-2"><span className="text-warn-700">•</span> Auto-notify affected patients</li>
              </ul>
              <Link href="/login?role=admin" className="text-warn-700 font-medium text-sm font-inter inline-flex items-center hover:underline group">
                Admin Login <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Footer */}
      <footer className="bg-brand py-8 border-t border-brand/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-sora text-white text-xl font-bold tracking-tight">MediBook</div>
          <div className="text-white/60 text-sm font-inter">Healthcare appointments, simplified.</div>
          <div className="text-white/40 text-xs font-inter">&copy; {new Date().getFullYear()} MediBook</div>
        </div>
      </footer>
    </div>
  )
}
