import { type DbOrTx, and, asc, eq, gt, inArray, isNull, lt, ne, or, schema } from "@tsami/db";

import { type Clinic, bookingWindow } from "./clinics";
import { BookingError } from "./errors";
import { type Interval, type PractitionerAvailability, type Slot, computeAvailableSlots } from "./slots";
import { type LocalDate, addDays, datesBetween, localInstant, toLocalDate } from "./time";

const { appointment, practitioner, practitionerTreatment, scheduleRange, timeOff, treatment } = schema;

export type Actor = { kind: "patient" } | { kind: "admin"; adminId: string };

export async function getBookableTreatment(db: DbOrTx, clinicId: string, treatmentId: string) {
  const [row] = await db
    .select()
    .from(treatment)
    .where(
      and(eq(treatment.id, treatmentId), eq(treatment.clinicId, clinicId), isNull(treatment.archivedAt)),
    );
  if (!row) throw new BookingError("NOT_FOUND", "Treatment not found");
  return row;
}

/** Non-Archived Practitioners of the Clinic who perform the Treatment, in Admin sort order. */
export async function practitionersForTreatment(db: DbOrTx, clinicId: string, treatmentId: string) {
  return db
    .select({
      id: practitioner.id,
      nameKa: practitioner.nameKa,
      nameEn: practitioner.nameEn,
      titleKa: practitioner.titleKa,
      titleEn: practitioner.titleEn,
      photoKey: practitioner.photoKey,
      sortOrder: practitioner.sortOrder,
    })
    .from(practitioner)
    .innerJoin(practitionerTreatment, eq(practitionerTreatment.practitionerId, practitioner.id))
    .where(
      and(
        eq(practitionerTreatment.treatmentId, treatmentId),
        eq(practitioner.clinicId, clinicId),
        isNull(practitioner.archivedAt),
      ),
    )
    .orderBy(asc(practitioner.sortOrder), asc(practitioner.nameEn));
}

/**
 * Available Slots for a Treatment between two local dates (inclusive).
 * Patients are held to the Booking Window; Admins are not.
 */
export async function findAvailableSlots(
  db: DbOrTx,
  input: {
    clinic: Clinic;
    treatmentId: string;
    /** Restrict to one Practitioner; omit for Any Practitioner. */
    practitionerId?: string;
    from: LocalDate;
    to: LocalDate;
    actor: Actor;
    now: Date;
    /** Ignore this Appointment's own time, when moving it. */
    excludeAppointmentId?: string;
  },
): Promise<{ slots: Slot[]; practitioners: Awaited<ReturnType<typeof practitionersForTreatment>> }> {
  const clinicId = input.clinic.id;
  const t = await getBookableTreatment(db, clinicId, input.treatmentId);
  let candidates = await practitionersForTreatment(db, clinicId, t.id);
  if (input.practitionerId) candidates = candidates.filter((p) => p.id === input.practitionerId);
  if (candidates.length === 0) return { slots: [], practitioners: [] };

  let { from, to } = input;
  let earliest: Date | null = null;
  let latest: Date | null = null;
  if (input.actor.kind === "patient") {
    const window = bookingWindow(input.clinic, input.now);
    earliest = window.earliest;
    latest = window.latest;
    from = maxDate(from, toLocalDate(earliest));
    to = minDate(to, toLocalDate(latest));
  }
  if (from > to) return { slots: [], practitioners: candidates };

  const rangeStart = localInstant(from);
  const rangeEnd = localInstant(addDays(to, 1));
  const ids = candidates.map((p) => p.id);

  const [ranges, booked, offs] = await Promise.all([
    db.select().from(scheduleRange).where(inArray(scheduleRange.practitionerId, ids)),
    db
      .select({
        practitionerId: appointment.practitionerId,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
      })
      .from(appointment)
      .where(
        and(
          inArray(appointment.practitionerId, ids),
          eq(appointment.status, "booked"),
          lt(appointment.startsAt, rangeEnd),
          gt(appointment.endsAt, rangeStart),
          input.excludeAppointmentId ? ne(appointment.id, input.excludeAppointmentId) : undefined,
        ),
      ),
    db
      .select()
      .from(timeOff)
      .where(
        and(
          eq(timeOff.clinicId, clinicId),
          or(isNull(timeOff.practitionerId), inArray(timeOff.practitionerId, ids)),
          lt(timeOff.startsAt, rangeEnd),
          gt(timeOff.endsAt, rangeStart),
        ),
      ),
  ]);

  const practitioners: PractitionerAvailability[] = candidates.map((p) => ({
    id: p.id,
    ranges: ranges.filter((r) => r.practitionerId === p.id),
    busy: [
      ...booked.filter((b) => b.practitionerId === p.id),
      ...offs.filter((o) => o.practitionerId === p.id),
    ],
  }));
  const clinicClosures: Interval[] = offs.filter((o) => o.practitionerId === null);

  const slots = computeAvailableSlots({
    dates: datesBetween(from, to),
    durationMinutes: t.durationMinutes,
    practitioners,
    clinicClosures,
    earliest,
    latest,
  });
  return { slots, practitioners: candidates };
}

const maxDate = (a: LocalDate, b: LocalDate) => (a > b ? a : b);
const minDate = (a: LocalDate, b: LocalDate) => (a < b ? a : b);
