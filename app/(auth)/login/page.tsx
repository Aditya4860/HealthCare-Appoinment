"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff, User, Stethoscope, Settings, ChevronRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role')

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | 'admin' | null>(null)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDemoFilled, setIsDemoFilled] = useState(false)

  // Initialize from URL param if present
  useEffect(() => {
    if (roleParam && ['patient', 'doctor', 'admin'].includes(roleParam.toLowerCase())) {
      handleSelectRole(roleParam.toLowerCase() as any)
    }
  }, [roleParam])

  const handleSelectRole = (role: 'patient' | 'doctor' | 'admin') => {
    setSelectedRole(role)
    setStep(2)
    
    // Auto-fill demo credentials
    if (role === 'patient') {
      setEmail('patient@test.com')
      setPassword('Patient123!')
    } else if (role === 'doctor') {
      setEmail('doctor@test.com')
      setPassword('Doctor123!')
    } else if (role === 'admin') {
      setEmail('admin@test.com')
      setPassword('Admin123!')
    }
    setIsDemoFilled(true)
  }

  const handleClearDemo = () => {
    setEmail('')
    setPassword('')
    setIsDemoFilled(false)
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
        // Use window.location.href to trigger a full page load so middleware cookies sync properly
        if (data.user.role === 'ADMIN') {
          window.location.href = '/admin/dashboard'
        } else if (data.user.role === 'DOCTOR') {
          window.location.href = '/doctor/dashboard'
        } else {
          window.location.href = '/patient/dashboard'
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel: Branding */}
      <div className="hidden lg:flex w-1/2 bg-brand text-white flex-col justify-center px-20">
        <h1 className="font-sora text-5xl font-bold mb-6">MediBook</h1>
        <p className="font-inter text-xl text-brand-light leading-relaxed">
          The all-in-one platform for modern healthcare management.
        </p>
      </div>

      {/* Right Panel: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-md">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="font-sora text-2xl font-bold text-brand mb-2">Sign in as...</h2>
              <p className="font-inter text-sm text-slate-500 mb-8">Choose your role to continue</p>
              
              <div className="space-y-3">
                <button onClick={() => handleSelectRole('patient')} className="w-full flex items-center p-4 rounded-xl border-2 border-slate-200 hover:border-brand hover:bg-brand-light cursor-pointer transition-all text-left group bg-white">
                  <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                    <User size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-inter font-semibold text-slate-800">Patient</p>
                    <p className="font-inter text-sm text-slate-500">Book and manage appointments</p>
                  </div>
                  <ChevronRight className="text-slate-400 group-hover:text-brand transition-colors" />
                </button>

                <button onClick={() => handleSelectRole('doctor')} className="w-full flex items-center p-4 rounded-xl border-2 border-slate-200 hover:border-brand hover:bg-brand-light cursor-pointer transition-all text-left group bg-white">
                  <div className="w-12 h-12 rounded-full bg-warn/10 text-warn-700 flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                    <Stethoscope size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-inter font-semibold text-slate-800">Doctor</p>
                    <p className="font-inter text-sm text-slate-500">View schedule and patient summaries</p>
                  </div>
                  <ChevronRight className="text-slate-400 group-hover:text-brand transition-colors" />
                </button>

                <button onClick={() => handleSelectRole('admin')} className="w-full flex items-center p-4 rounded-xl border-2 border-slate-200 hover:border-brand hover:bg-brand-light cursor-pointer transition-all text-left group bg-white">
                  <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                    <Settings size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-inter font-semibold text-slate-800">Administrator</p>
                    <p className="font-inter text-sm text-slate-500">Manage doctors and clinic settings</p>
                  </div>
                  <ChevronRight className="text-slate-400 group-hover:text-brand transition-colors" />
                </button>
              </div>
              
              <div className="mt-8 text-center text-sm font-inter">
                Don't have an account?{' '}
                <Link href="/register" className="text-brand font-medium hover:underline">
                  Sign up
                </Link>
              </div>
            </div>
          )}

          {step === 2 && selectedRole && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button onClick={() => setStep(1)} className="text-sm font-inter text-slate-500 hover:text-brand flex items-center gap-1.5 mb-8 transition-colors">
                <ArrowLeft size={16} /> Choose different role
              </button>
              
              <div className="mb-8">
                <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-3 uppercase tracking-wider
                  ${selectedRole === 'patient' ? 'bg-accent/10 text-accent' : 
                    selectedRole === 'doctor' ? 'bg-warn/10 text-warn-700' : 
                    'bg-brand/10 text-brand'}`}>
                  {selectedRole === 'patient' && <User size={14} />}
                  {selectedRole === 'doctor' && <Stethoscope size={14} />}
                  {selectedRole === 'admin' && <Settings size={14} />}
                  {selectedRole}
                </div>
                
                <h2 className="font-sora text-3xl font-bold text-gray-900">
                  Welcome back
                </h2>
              </div>

              {isDemoFilled && (
                <div className="bg-brand/5 border border-brand/10 rounded-xl p-3 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-slate-600 font-inter">
                    <span className="font-semibold text-brand">Demo account pre-filled.</span> Click Sign in to continue.
                  </p>
                  <button onClick={handleClearDemo} className="text-xs text-brand hover:underline font-medium whitespace-nowrap">
                    Use different credentials
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-inter text-slate-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="font-inter bg-white"
                  />
                </div>
                
                <div className="space-y-2 relative">
                  <Label htmlFor="password" className="font-inter text-slate-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="font-inter pr-10 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-brand hover:bg-brand/90 text-white font-inter h-12 rounded-xl text-base mt-2 transition-all"
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
