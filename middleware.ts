import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isProtectedPage =
    pathname.startsWith('/patient') ||
    pathname.startsWith('/doctor') ||
    pathname.startsWith('/admin')
  const isProtectedApi =
    pathname.startsWith('/api/patient') ||
    pathname.startsWith('/api/doctor') ||
    pathname.startsWith('/api/admin')

  // If on auth page and already has valid token → redirect to correct dashboard
  if (isAuthPage && token) {
    const payload = await verifyToken(token)
    if (payload) {
      const role = (payload as { role: string }).role
      if (role === 'ADMIN')  return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      if (role === 'DOCTOR') return NextResponse.redirect(new URL('/doctor/dashboard', request.url))
      return NextResponse.redirect(new URL('/patient/dashboard', request.url))
    }
  }

  if (isProtectedApi && !token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (isProtectedPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If on protected page/api with token → verify role matches path
  if ((isProtectedPage || isProtectedApi) && token) {
    const payload = await verifyToken(token)
    if (!payload) {
      if (isProtectedApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      return NextResponse.redirect(new URL('/login?expired=true', request.url))
    }
    const role = (payload as { role: string }).role
    
    if (isProtectedApi) {
      if (pathname.startsWith('/api/admin')   && role !== 'ADMIN')   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      if (pathname.startsWith('/api/doctor')  && role !== 'DOCTOR')  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      if (pathname.startsWith('/api/patient') && role !== 'PATIENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    } else if (isProtectedPage) {
      if (pathname.startsWith('/admin')   && role !== 'ADMIN')   return NextResponse.redirect(new URL(`/${role.toLowerCase()}/dashboard`, request.url))
      if (pathname.startsWith('/doctor')  && role !== 'DOCTOR')  return NextResponse.redirect(new URL(`/${role.toLowerCase()}/dashboard`, request.url))
      if (pathname.startsWith('/patient') && role !== 'PATIENT') return NextResponse.redirect(new URL(`/${role.toLowerCase()}/dashboard`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/patient/:path*',
    '/doctor/:path*',
    '/admin/:path*',
    '/api/patient/:path*',
    '/api/doctor/:path*',
    '/api/admin/:path*',
  ],
}
