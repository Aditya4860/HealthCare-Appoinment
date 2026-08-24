import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DOCTORS = [
  { name: "Dr. Emily Chen", email: "emily.chen@medibook.local", spec: "Neurology" },
  { name: "Dr. Marcus Johnson", email: "marcus.j@medibook.local", spec: "Orthopedics" },
  { name: "Dr. Sarah Williams", email: "swilliams@medibook.local", spec: "Pediatrics" },
  { name: "Dr. David Lee", email: "david.lee@medibook.local", spec: "Dermatology" },
  { name: "Dr. Lisa Patel", email: "lisa.patel@medibook.local", spec: "Psychiatry" },
  { name: "Dr. Robert Taylor", email: "rtaylor@medibook.local", spec: "General Surgery" },
  { name: "Dr. Amanda Garcia", email: "agarcia@medibook.local", spec: "Cardiology" },
];

const PATIENTS = [
  { name: "Michael Brown", email: "michael.b@example.com" },
  { name: "Jessica Davis", email: "jessica.d@example.com" },
  { name: "Christopher Miller", email: "chris.miller@example.com" },
  { name: "Ashley Wilson", email: "ashley.w@example.com" },
  { name: "Matthew Moore", email: "m.moore@example.com" },
  { name: "Taylor Anderson", email: "taylor.a@example.com" },
  { name: "Joshua Thomas", email: "joshua.t@example.com" },
  { name: "Samantha Jackson", email: "samantha.j@example.com" },
  { name: "Daniel White", email: "dan.white@example.com" },
  { name: "Olivia Harris", email: "olivia.h@example.com" },
];

const SYMPTOMS = [
  "Persistent headache and mild fever.",
  "Lower back pain lasting for a week.",
  "Skin rash on arms and legs.",
  "Feeling anxious and having trouble sleeping.",
  "Chest pain after walking short distances.",
  "Knee pain when climbing stairs.",
  "Sore throat and dry cough.",
];

const MEDICINES = [
  { name: "Ibuprofen", dose: "400mg", freq: "Twice daily" },
  { name: "Amoxicillin", dose: "500mg", freq: "3 times a day" },
  { name: "Lisinopril", dose: "10mg", freq: "Once daily" },
  { name: "Metformin", dose: "500mg", freq: "Twice daily with meals" },
  { name: "Sertraline", dose: "50mg", freq: "Once daily in the morning" },
];

async function main() {
  console.log("🌱 Generating 7 doctors and 10 patients with history...");
  const SALT_ROUNDS = 10;
  const defaultPassword = await bcrypt.hash("Password123!", SALT_ROUNDS);

  const createdDoctors = [];
  for (const doc of DOCTORS) {
    const d = await prisma.user.upsert({
      where: { email: doc.email },
      update: {},
      create: {
        email: doc.email,
        password: defaultPassword,
        role: "DOCTOR",
        name: doc.name,
        doctorProfile: {
          create: {
            specialisation: doc.spec,
            slotDuration: 30,
            workingHours: JSON.stringify({ start: "09:00", end: "17:00" }),
          },
        },
      },
    });
    createdDoctors.push(d);
  }
  console.log(`✅ Created 7 Doctors`);

  const createdPatients = [];
  for (const pat of PATIENTS) {
    const p = await prisma.user.upsert({
      where: { email: pat.email },
      update: {},
      create: {
        email: pat.email,
        password: defaultPassword,
        role: "PATIENT",
        name: pat.name,
        patientProfile: { create: {} },
      },
    });
    createdPatients.push(p);
  }
  console.log(`✅ Created 10 Patients`);

  let appointmentsCreated = 0;
  let medsCreated = 0;

  for (const patient of createdPatients) {
    // 2 past appointments
    for (let i = 0; i < 2; i++) {
      const doc = createdDoctors[Math.floor(Math.random() * createdDoctors.length)];
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - (Math.floor(Math.random() * 30) + 1)); // 1 to 30 days ago
      pastDate.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);

      const symp = SYMPTOMS[Math.floor(Math.random() * SYMPTOMS.length)];
      
      const appt = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doc.id,
          scheduledAt: pastDate,
          status: "COMPLETED",
          symptoms: symp,
          urgencyLevel: "Low",
          chiefConcern: symp,
          notes: "Patient reported symptoms. Prescribed medication.",
          patientSummary: "You visited for " + symp + ". Please follow the medication schedule.",
        },
      });
      appointmentsCreated++;

      // create a medication reminder for half of the past appointments
      if (Math.random() > 0.5) {
        const med = MEDICINES[Math.floor(Math.random() * MEDICINES.length)];
        await prisma.medicationReminder.create({
          data: {
            patientId: patient.id,
            appointmentId: appt.id,
            medicine: med.name,
            dose: med.dose,
            frequency: med.freq,
            nextReminderAt: new Date(Date.now() + 86400000), // tomorrow
            active: true,
          }
        });
        medsCreated++;
      }
    }

    // 1 future appointment (70% chance)
    if (Math.random() > 0.3) {
      const doc = createdDoctors[Math.floor(Math.random() * createdDoctors.length)];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + (Math.floor(Math.random() * 14) + 1)); // 1 to 14 days future
      futureDate.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);
      const symp = SYMPTOMS[Math.floor(Math.random() * SYMPTOMS.length)];

      await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doc.id,
          scheduledAt: futureDate,
          status: "CONFIRMED",
          symptoms: symp,
          urgencyLevel: Math.random() > 0.7 ? "High" : "Medium",
          chiefConcern: symp,
        },
      });
      appointmentsCreated++;
    }
  }

  console.log(`✅ Created ${appointmentsCreated} Appointments`);
  console.log(`✅ Created ${medsCreated} Medication Reminders`);
  console.log("🎉 Extended Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
