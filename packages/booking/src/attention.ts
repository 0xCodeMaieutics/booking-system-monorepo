import { type DbOrTx, and, eq, gt, gte, schema } from "@visita/db";

import { fitsWeeklySchedule, overlaps } from "./slots";

const { appointment, patient, practitioner, practitionerTreatment, scheduleRange, timeOff, treatment } =
  schema;

export type AttentionReason =
  | "practitioner_archived"
  | "treatment_not_offered"
  | "outside_schedule"
  | "time_off";

/**
 * Future Booked Appointments that no longer fit the setup behind them, e.g.
 * after Time Off was added or a Weekly Schedule changed. Changes never touch
 * existing Appointments, so an Admin resolves these by hand.
 */
export async function appointmentsNeedingAttention(db: DbOrTx, now: Date, practitionerId?: string) {
  const rows = await db
    .select({ appointment, patient, practitioner, treatment })
    .from(appointment)
    .innerJoin(patient, eq(patient.id, appointment.patientId))
    .innerJoin(practitioner, eq(practitioner.id, appointment.practitionerId))
    .innerJoin(treatment, eq(treatment.id, appointment.treatmentId))
    .where(
      and(
        eq(appointment.status, "booked"),
        gte(appointment.startsAt, now),
        practitionerId ? eq(appointment.practitionerId, practitionerId) : undefined,
      ),
    )
    .orderBy(appointment.startsAt);
  if (rows.length === 0) return [];

  const [ranges, offered, offs] = await Promise.all([
    db.select().from(scheduleRange),
    db.select().from(practitionerTreatment),
    db.select().from(timeOff).where(gt(timeOff.endsAt, now)),
  ]);
  const offeredSet = new Set(offered.map((o) => `${o.practitionerId}:${o.treatmentId}`));

  return rows.flatMap((row) => {
    const a = row.appointment;
    const reasons: AttentionReason[] = [];
    if (row.practitioner.archivedAt) reasons.push("practitioner_archived");
    if (!offeredSet.has(`${a.practitionerId}:${a.treatmentId}`)) reasons.push("treatment_not_offered");
    const own = ranges.filter((r) => r.practitionerId === a.practitionerId);
    if (!fitsWeeklySchedule(a, own)) reasons.push("outside_schedule");
    if (
      offs.some((o) => (o.practitionerId === null || o.practitionerId === a.practitionerId) && overlaps(a, o))
    ) {
      reasons.push("time_off");
    }
    return reasons.length > 0 ? [{ ...row, reasons }] : [];
  });
}
