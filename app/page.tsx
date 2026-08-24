import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export default async function RootPage() {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login')
  }

  const payload = await verifyToken(token)
  if (!payload) {
    redirect('/login')
  }

  const role = (payload as { role: string }).role
  if (role === 'ADMIN')  redirect('/admin/dashboard')
  if (role === 'DOCTOR') redirect('/doctor/dashboard')
  redirect('/patient/dashboard')
}
