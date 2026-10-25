import { type Db, and, eq, gt, inArray, isNull, lte, schema, sql } from "@tsami/db";

import { getClinicSettings } from "./settings";
import { type SmsSender, smsText } from "./sms";

const { appointment, patient, practitioner, treatment } = schema;

const REMINDER_HOURS = 24;

/**
 * Sends an SMS reminder for Booked Appointments starting within 24 hours.
 * Appointments booked less than 24 hours ahead are skipped: their
 * confirmation is recent enough. Safe to run concurrently.
 */
export async function sendDueReminders(db: Db, sms: SmsSender, now: Date): Promise<number> {
  const horizon = new Date(now.getTime() + REMINDER_HOURS * 3_600_000);

  const claimed = await db
    .update(appointment)
    .set({ reminderSentAt: now })
    .where(
      and(
        eq(appointment.status, "booked"),
        isNull(appointment.reminderSentAt),
        gt(appointment.startsAt, now),
        lte(appointment.startsAt, horizon),
        sql`${appointment.createdAt} < ${appointment.startsAt} - interval '${sql.raw(String(REMINDER_HOURS))} hours'`,
      ),
    )
    .returning({ id: appointment.id });
  if (claimed.length === 0) return 0;

  const settings = await getClinicSettings(db);
  const rows = await db
    .select({ appointment, patient, practitioner, treatment })
    .from(appointment)
    .innerJoin(patient, eq(patient.id, appointment.patientId))
    .innerJoin(practitioner, eq(practitioner.id, appointment.practitionerId))
    .innerJoin(treatment, eq(treatment.id, appointment.treatmentId))
    .where(
      inArray(
        appointment.id,
        claimed.map((c) => c.id),
      ),
    );

  for (const row of rows) {
    const locale = row.appointment.locale;
    const summary = {
      treatmentName: locale === "ka" ? row.treatment.nameKa : row.treatment.nameEn,
      practitionerName: locale === "ka" ? row.practitioner.nameKa : row.practitioner.nameEn,
      startsAt: row.appointment.startsAt,
    };
    try {
      // oxlint-disable-next-line no-await-in-loop -- one SMS at a time keeps us under provider rate limits
      await sms.send(row.patient.phone, smsText.reminder(summary, settings.clinicPhone, locale));
    } catch (error) {
      console.error(`Reminder for appointment ${row.appointment.id} failed`, error);
    }
  }
  return rows.length;
}
