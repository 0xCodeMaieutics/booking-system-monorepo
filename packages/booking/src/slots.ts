import { type IsoWeekday, type LocalDate, localInstant, toLocalDate, toLocalMinute, weekdayOf } from "./time";

/** Available Slots start on this Clinic-wide grid, counted from local midnight. */
const SLOT_STEP_MINUTES = 15;

export type Interval = { startsAt: Date; endsAt: Date };

export type ScheduleRange = { weekday: number; startMinute: number; endMinute: number };

export type PractitionerAvailability = {
  id: string;
  ranges: ScheduleRange[];
  /** Booked Appointments and the Practitioner's own Time Off. */
  busy: Interval[];
};

export type Slot = { practitionerId: string; startsAt: Date };

export function overlaps(a: Interval, b: Interval): boolean {
  return a.startsAt < b.endsAt && a.endsAt > b.startsAt;
}

export function computeAvailableSlots(input: {
  dates: LocalDate[];
  durationMinutes: number;
  practitioners: PractitionerAvailability[];
  /** Time Off that applies to every Practitioner. */
  clinicClosures: Interval[];
  /** Earliest allowed start, or null for no limit. */
  earliest: Date | null;
  /** Latest allowed start, or null for no limit. */
  latest: Date | null;
}): Slot[] {
  const { durationMinutes, clinicClosures, earliest, latest } = input;
  const slots: Slot[] = [];

  for (const date of input.dates) {
    const weekday = weekdayOf(date);
    for (const p of input.practitioners) {
      const blocked = [...p.busy, ...clinicClosures];
      for (const range of p.ranges) {
        if (range.weekday !== weekday) continue;
        const first = Math.ceil(range.startMinute / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES;
        for (let m = first; m + durationMinutes <= range.endMinute; m += SLOT_STEP_MINUTES) {
          const slot = { startsAt: localInstant(date, m), endsAt: localInstant(date, m + durationMinutes) };
          if (earliest && slot.startsAt < earliest) continue;
          if (latest && slot.startsAt > latest) continue;
          if (blocked.some((b) => overlaps(slot, b))) continue;
          slots.push({ practitionerId: p.id, startsAt: slot.startsAt });
        }
      }
    }
  }

  return slots.toSorted((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/** Whether an interval sits entirely inside one range of a Weekly Schedule. */
export function fitsWeeklySchedule(interval: Interval, ranges: ScheduleRange[]): boolean {
  const date = toLocalDate(interval.startsAt);
  if (toLocalDate(new Date(interval.endsAt.getTime() - 1)) !== date) return false;
  const weekday: IsoWeekday = weekdayOf(date);
  const start = toLocalMinute(interval.startsAt);
  const end = start + (interval.endsAt.getTime() - interval.startsAt.getTime()) / 60_000;
  return ranges.some((r) => r.weekday === weekday && r.startMinute <= start && end <= r.endMinute);
}

/**
 * Any Practitioner assignment: the candidate with the fewest Appointments that
 * day, ties broken by the Admin-set sort order, then id for determinism.
 */
export function rankForAnyPractitioner<T extends { id: string; sortOrder: number }>(
  candidates: T[],
  appointmentsThatDay: ReadonlyMap<string, number>,
): T[] {
  return candidates.toSorted(
    (a, b) =>
      (appointmentsThatDay.get(a.id) ?? 0) - (appointmentsThatDay.get(b.id) ?? 0) ||
      a.sortOrder - b.sortOrder ||
      a.id.localeCompare(b.id),
  );
}
