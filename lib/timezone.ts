import { formatInTimeZone } from 'date-fns-tz';

export const APP_TIMEZONE = 'Asia/Kolkata';

/**
 * Formats any Date or ISO string explicitly into the Asia/Kolkata timezone.
 * Uses date-fns formatting tokens (e.g. 'MMM d, yyyy').
 */
export function formatIST(date: Date | string | null | undefined, formatStr: string): string {
  if (!date) return '';
  try {
    return formatInTimeZone(date, APP_TIMEZONE, formatStr);
  } catch (e) {
    console.error("formatIST error:", e);
    return '';
  }
}

/**
 * Converts a selected slot (date string like "2026-08-25" and time string like "10:00")
 * into a true UTC Date object by interpreting it as Asia/Kolkata time.
 */
export function parseISTToUTC(dateStr: string, timeStr: string): Date {
  // Construct ISO string with IST offset (+05:30)
  // Example: 2026-08-25T10:00:00+05:30
  const isoString = `${dateStr}T${timeStr}:00+05:30`;
  return new Date(isoString);
}

/**
 * Gets the current accurate Date instant.
 */
export function getCurrentISTDate(): Date {
  return new Date(); // Represents the absolute current instant
}

/**
 * Checks if a proposed slot is in the past,
 * strictly interpreting the slot in IST and comparing it to the current true instant.
 */
export function isSlotInPastIST(dateStr: string, timeStr: string): boolean {
  const slotInstant = parseISTToUTC(dateStr, timeStr);
  const now = getCurrentISTDate();
  return slotInstant <= now;
}
