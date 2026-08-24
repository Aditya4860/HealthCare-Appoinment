import { prisma } from "./prisma";

export function generateSlots(
  workingHours: { start: string; end: string },
  slotDuration: number
): string[] {
  const slots: string[] = [];
  if (!workingHours?.start || !workingHours?.end || !slotDuration) return slots;

  const [startHour, startMin] = workingHours.start.split(":").map(Number);
  const [endHour, endMin] = workingHours.end.split(":").map(Number);
  if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) return slots;

  let currentTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = endHour * 60 + endMin;

  while (currentTotalMinutes + slotDuration <= endTotalMinutes) {
    const h = Math.floor(currentTotalMinutes / 60);
    const m = currentTotalMinutes % 60;
    slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    currentTotalMinutes += slotDuration;
  }
  return slots;
}

export async function getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
  const profile = await prisma.doctorProfile.findFirst({
    where: { userId: doctorId }
  });
  if (!profile) throw new Error("Doctor not found");

  // Check if doctor is on leave
  const targetDate = new Date(`${date}T00:00:00.000Z`);
  const onLeave = await prisma.doctorLeave.findFirst({
    where: { doctorProfileId: profile.id, date: targetDate }
  });
  if (onLeave) return [];

  let workingHours = { start: "09:00", end: "17:00" };
  try {
    workingHours = JSON.parse(profile.workingHours);
  } catch {}

  const allSlots = generateSlots(workingHours, profile.slotDuration);

  // Fetch appointments for that day that are HOLD or CONFIRMED
  const startOfDay = new Date(targetDate);
  const endOfDay = new Date(targetDate);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: { gte: startOfDay, lt: endOfDay },
      status: { in: ["HOLD", "CONFIRMED"] }
    }
  });

  const bookedTimes = new Set(
    existingAppointments.map(a => {
      return `${a.scheduledAt.getUTCHours().toString().padStart(2, "0")}:${a.scheduledAt.getUTCMinutes().toString().padStart(2, "0")}`;
    })
  );

  return allSlots.filter(s => !bookedTimes.has(s));
}

export async function holdSlot(patientId: string, doctorId: string, date: string, time: string) {
  // SQLite doesn't have true serializable tx locks like Postgres FOR UPDATE,
  // but we can simulate a safe check and create using findFirst + create
  // within a transaction. Since this is just SQLite, it's sequential anyway.
  
  const scheduledAt = new Date(`${date}T${time}:00.000Z`);

  return await prisma.$transaction(async (tx) => {
    // 1. Check if it's already booked/held
    const existing = await tx.appointment.findFirst({
      where: {
        doctorId,
        scheduledAt,
        status: { in: ["HOLD", "CONFIRMED"] }
      }
    });

    if (existing) {
      throw new Error("Slot is already taken");
    }

    // 2. Create HOLD appointment
    const appointment = await tx.appointment.create({
      data: {
        patientId,
        doctorId,
        scheduledAt,
        status: "HOLD"
      }
    });

    return appointment;
  });
}

export async function confirmSlot(appointmentId: string, symptoms: string) {
  // Simple AI mock for urgency and summary
  const urgencyLevel = symptoms.toLowerCase().includes("pain") ? "High" : "Low";
  const chiefConcern = symptoms.substring(0, 50) + "...";
  const aiQuestions = "1. How long has this been happening?\n2. Have you taken any medication for it?\n3. Any other symptoms?";
  
  return await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CONFIRMED",
      symptoms,
      urgencyLevel,
      chiefConcern,
      aiQuestions
    }
  });
}

export async function cancelAppointment(appointmentId: string) {
  return await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" }
  });
}
