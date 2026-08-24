"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_TIMEZONE = void 0;
exports.formatIST = formatIST;
exports.parseISTToUTC = parseISTToUTC;
exports.getCurrentISTDate = getCurrentISTDate;
exports.isSlotInPastIST = isSlotInPastIST;
const date_fns_tz_1 = require("date-fns-tz");
exports.APP_TIMEZONE = 'Asia/Kolkata';
/**
 * Formats any Date or ISO string explicitly into the Asia/Kolkata timezone.
 * Uses date-fns formatting tokens (e.g. 'MMM d, yyyy').
 */
function formatIST(date, formatStr) {
    if (!date)
        return '';
    try {
        return (0, date_fns_tz_1.formatInTimeZone)(date, exports.APP_TIMEZONE, formatStr);
    }
    catch (e) {
        console.error("formatIST error:", e);
        return '';
    }
}
/**
 * Converts a selected slot (date string like "2026-08-25" and time string like "10:00")
 * into a true UTC Date object by interpreting it as Asia/Kolkata time.
 */
function parseISTToUTC(dateStr, timeStr) {
    // Construct ISO string with IST offset (+05:30)
    // Example: 2026-08-25T10:00:00+05:30
    const isoString = `${dateStr}T${timeStr}:00+05:30`;
    return new Date(isoString);
}
/**
 * Gets the current accurate Date instant.
 */
function getCurrentISTDate() {
    return new Date(); // Represents the absolute current instant
}
/**
 * Checks if a proposed slot is in the past,
 * strictly interpreting the slot in IST and comparing it to the current true instant.
 */
function isSlotInPastIST(dateStr, timeStr) {
    const slotInstant = parseISTToUTC(dateStr, timeStr);
    const now = getCurrentISTDate();
    return slotInstant <= now;
}
