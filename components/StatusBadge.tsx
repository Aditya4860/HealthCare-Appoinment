/**
 * StatusBadge & UrgencyBadge
 *
 * Use these components everywhere status/urgency needs to be displayed.
 * Classes match the design system spec exactly — do not inline alternatives.
 */

// ── Appointment Status ────────────────────────────────────────────────────────

export type AppointmentStatus = "CONFIRMED" | "HOLD" | "CANCELLED" | "COMPLETED";

const STATUS_CLASSES: Record<AppointmentStatus, string> = {
  CONFIRMED: "bg-mb-accent/10 text-mb-accent border border-mb-accent/20",
  HOLD: "bg-warn/10   text-warn   border border-warn/20",
  CANCELLED: "bg-danger/10 text-danger border border-danger/20",
  COMPLETED: "bg-brand/10  text-brand  border border-brand/20",
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  CONFIRMED: "Confirmed",
  HOLD: "Hold",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

interface StatusBadgeProps {
  status: AppointmentStatus;
  /** Optional additional classes */
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                  ${STATUS_CLASSES[status]} ${className}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

// ── Urgency Level ─────────────────────────────────────────────────────────────

export type UrgencyLevel = "High" | "Medium" | "Low";

const URGENCY_CLASSES: Record<UrgencyLevel, string> = {
  High: "bg-danger text-white",
  Medium: "bg-warn   text-white",
  Low: "bg-mb-accent text-white",
};

interface UrgencyBadgeProps {
  level: UrgencyLevel;
  className?: string;
}

export function UrgencyBadge({ level, className = "" }: UrgencyBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                  ${URGENCY_CLASSES[level]} ${className}`}
    >
      {level}
    </span>
  );
}
