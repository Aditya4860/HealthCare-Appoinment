import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  const SALT_ROUNDS = 10;

  // ── Admin ──────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin123!", SALT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      password: adminPassword,
      role: "ADMIN",
      name: "Admin User",
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // ── Doctor ─────────────────────────────────────────────────────────────────
  const doctorPassword = await bcrypt.hash("Doctor123!", SALT_ROUNDS);
  const doctor = await prisma.user.upsert({
    where: { email: "doctor@test.com" },
    update: {},
    create: {
      email: "doctor@test.com",
      password: doctorPassword,
      role: "DOCTOR",
      name: "Dr. Jane Smith",
      doctorProfile: {
        create: {
          specialisation: "Cardiology",
          slotDuration: 30,
          // stored as JSON string; parsed in app layer
          workingHours: JSON.stringify({ start: "09:00", end: "17:00" }),
        },
      },
    },
  });
  console.log(`✅ Doctor created: ${doctor.email}`);

  // ── Patient ────────────────────────────────────────────────────────────────
  const patientPassword = await bcrypt.hash("Patient123!", SALT_ROUNDS);
  const patient = await prisma.user.upsert({
    where: { email: "patient@test.com" },
    update: {},
    create: {
      email: "patient@test.com",
      password: patientPassword,
      role: "PATIENT",
      name: "John Patient",
      patientProfile: {
        create: {},
      },
    },
  });
  console.log(`✅ Patient created: ${patient.email}`);

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
