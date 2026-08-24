const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doctor = await prisma.user.findFirst({
    where: { role: 'DOCTOR' },
    include: { doctorProfile: true }
  });

  const patient = await prisma.user.findFirst({
    where: { role: 'PATIENT' }
  });

  if (!doctor || !patient) {
    console.log("Missing doctor or patient");
    return;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1 hour from now
  const appt1 = new Date(today);
  appt1.setHours(9, 30, 0, 0);

  // 3 hours from now
  const appt2 = new Date(today);
  appt2.setHours(11, 0, 0, 0);
  
  // Tomorrow
  const appt3 = new Date(today);
  appt3.setDate(appt3.getDate() + 1);
  appt3.setHours(10, 0, 0, 0);

  await prisma.appointment.createMany({
    data: [
      {
        patientId: patient.id,
        doctorId: doctor.id,
        scheduledAt: appt1,
        status: "CONFIRMED",
        chiefConcern: "Severe headache for 3 days",
        urgencyLevel: "High",
        symptoms: "I have been experiencing a severe throbbing headache for the past 3 days. Light makes it worse.",
        aiQuestions: "1. Have you experienced any nausea or vomiting?\n2. Are you experiencing any changes in your vision?\n3. Do you have any weakness or numbness?"
      },
      {
        patientId: patient.id,
        doctorId: doctor.id,
        scheduledAt: appt2,
        status: "CONFIRMED",
        chiefConcern: "Routine checkup",
        urgencyLevel: "Low",
        symptoms: "Just coming in for my annual physical and blood work.",
        aiQuestions: "1. Have there been any changes to your medical history since your last visit?\n2. Are you currently taking any new medications?"
      },
      {
        patientId: patient.id,
        doctorId: doctor.id,
        scheduledAt: appt3,
        status: "CONFIRMED",
        chiefConcern: "Knee pain",
        urgencyLevel: "Medium",
        symptoms: "Left knee hurts when walking up the stairs.",
        aiQuestions: "1. Did you injure your knee recently?\n2. Does the pain spread anywhere else?"
      }
    ]
  });

  console.log("Seeded appointments for", doctor.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
