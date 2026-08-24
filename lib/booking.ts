import { prisma } from "./prisma";
import { isSlotInPastIST, parseISTToUTC } from "./timezone";

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

  const available = allSlots.filter(s => !bookedTimes.has(s));

  // Filter out past slots
  return available.filter(slotTime => !isSlotInPastIST(date, slotTime));
}

export async function holdSlot(patientId: string, doctorId: string, date: string, time: string) {
  if (isSlotInPastIST(date, time)) {
    throw new Error("This appointment slot has already passed.");
  }

  // SQLite doesn't have true serializable tx locks like Postgres FOR UPDATE,
  // but we can simulate a safe check and create using findFirst + create
  // within a transaction. Since this is just SQLite, it's sequential anyway.
  
  const scheduledAt = parseISTToUTC(date, time);

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
  return await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CONFIRMED",
      symptoms
    }
  });
}

export async function cancelAppointment(appointmentId: string) {
  return await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" }
  });
}
