import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Check if already seeded
  const existing = await prisma.user.findUnique({ 
    where: { email: 'admin@medibook.com' } 
  })
  if (existing) {
    console.log('Database already seeded, skipping.')
    return
  }

  const hashedPassword = await bcrypt.hash('MediBook2026!', 12)

  // Admin
  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@medibook.com',
      password: hashedPassword,
      role: 'ADMIN',
    }
  })

  // Doctor 1
  const doctor1 = await prisma.user.create({
    data: {
      name: 'Dr. Sarah Johnson',
      email: 'sarah@medibook.com',
      password: hashedPassword,
      role: 'DOCTOR',
    }
  })
  await prisma.doctorProfile.create({
    data: {
      userId: doctor1.id,
      specialisation: 'Cardiology',
      workingHours: JSON.stringify({ start: '09:00', end: '17:00' }),
    }
  })

  // Doctor 2
  const doctor2 = await prisma.user.create({
    data: {
      name: 'Dr. Michael Chen',
      email: 'michael@medibook.com',
      password: hashedPassword,
      role: 'DOCTOR',
    }
  })
  await prisma.doctorProfile.create({
    data: {
      userId: doctor2.id,
      specialisation: 'General Practice',
      workingHours: JSON.stringify({ start: '08:00', end: '16:00' }),
    }
  })

  // Patient
  await prisma.user.create({
    data: {
      name: 'John Patient',
      email: 'patient@medibook.com',
      password: hashedPassword,
      role: 'PATIENT',
    }
  })

  console.log('Production seed complete.')
  console.log('Credentials — all accounts use password: MediBook2026!')
  console.log('Admin: admin@medibook.com')
  console.log('Doctor 1: sarah@medibook.com')
  console.log('Doctor 2: michael@medibook.com')
  console.log('Patient: patient@medibook.com')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
