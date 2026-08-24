"use client";

export type SlotStatus = "available" | "selected" | "booked";

export interface TimeSlot {
  id: string;
  /** Display time e.g. "09:00", "09:30" */
  time: string;
  status: SlotStatus;
}

interface SlotPickerProps {
  slots: TimeSlot[];
  selectedSlotId?: string;
  onSelect: (slotId: string) => void;
}

/**
 * Signature slot picker grid — the most-used interactive element in MediBook.
 *
 * States:
 *  • available  — brand-light background, brand text, hover morphs to solid brand
 *  • selected   — solid brand, white text, slightly scaled up + shadow
 *  • booked     — gray, line-through, cursor-not-allowed
 */
export function SlotPicker({ slots, selectedSlotId, onSelect }: SlotPickerProps) {
  if (slots.length === 0) {
    return (
      <p className="text-sm text-muted text-center py-6">
        No slots available for this date.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
      {slots.map((slot) => {
        const isSelected = slot.id === selectedSlotId;
        const isBooked   = slot.status === "booked";

        return (
          <button
            key={slot.id}
            id={`slot-${slot.id}`}
            disabled={isBooked}
            onClick={() => !isBooked && onSelect(slot.id)}
            aria-pressed={isSelected}
            aria-disabled={isBooked}
            className={[
              // base
              "px-3 py-2.5 rounded-full text-sm font-medium border",
              "transition-all duration-200 select-none",
              // states
              isBooked
                ? "bg-gray-100 text-gray-400 cursor-not-allowed line-through border-transparent"
                : isSelected
                  ? "bg-brand text-white scale-105 shadow-md border-transparent"
                  : "bg-brand-light text-brand border-brand/20 hover:bg-brand hover:text-white hover:scale-105 hover:shadow-sm",
            ].join(" ")}
          >
            {slot.time}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Utility — generate 30-minute slots between start and end time strings.
 * e.g. generateSlots("09:00", "17:00", bookedIds) → TimeSlot[]
 */
export function generateSlots(
  start: string,
  end: string,
  bookedTimes: string[] = [],
  slotDuration = 30,
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM]     = end.split(":").map(Number);
  const startMin = startH * 60 + startM;
  const endMin   = endH   * 60 + endM;

  for (let m = startMin; m < endMin; m += slotDuration) {
    const h  = Math.floor(m / 60);
    const mm = m % 60;
    const time = `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    slots.push({
      id:     time,
      time,
      status: bookedTimes.includes(time) ? "booked" : "available",
    });
  }

  return slots;
}
