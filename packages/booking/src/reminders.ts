import { type Db, and, eq, gt, inArray, isNull, lte, schema, sql } from "@tsami/db";

import { type OpsAlerts, errorMessage } from "./alerts";
import { appointmentSummary } from "./appointments";
import { type SmsSender, smsText } from "./sms";

const { appointment, clinic, patient, practitioner, treatment } = schema;

const REMINDER_HOURS = 24;

/**
 * Sends an SMS reminder for Booked Appointments starting within 24 hours.
 * Appointments booked less than 24 hours ahead are skipped: their
 * confirmation is recent enough. Safe to run concurrently. Failures are sent
 * as one alert per run, so a provider outage doesn't flood the chat.
 */
export async function sendDueReminders(
  db: Db,
  sms: SmsSender,
  alerts: OpsAlerts,
  now: Date,
): Promise<number> {
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

  const rows = await db
    .select({ appointment, clinic, patient, practitioner, treatment })
    .from(appointment)
    .innerJoin(clinic, eq(clinic.id, appointment.clinicId))
    .innerJoin(patient, eq(patient.id, appointment.patientId))
    .innerJoin(practitioner, eq(practitioner.id, appointment.practitionerId))
    .innerJoin(treatment, eq(treatment.id, appointment.treatmentId))
    .where(
      inArray(
        appointment.id,
        claimed.map((c) => c.id),
      ),
    );

  const failed: string[] = [];
  for (const row of rows) {
    const locale = row.appointment.locale;
    const summary = appointmentSummary(row, locale);
    try {
      // oxlint-disable-next-line no-await-in-loop -- one SMS at a time keeps us under provider rate limits
      await sms.send(row.patient.phone, smsText.reminder(summary, row.clinic.phone, locale));
    } catch (error) {
      console.error(`Reminder for appointment ${row.appointment.id} failed`, error);
      failed.push(`${row.clinic.nameEn}, appointment ${row.appointment.id}: ${errorMessage(error)}`);
    }
  }
  if (failed.length > 0) {
    await alerts.send(
      [`SMS failed: ${failed.length} of ${rows.length} reminders`, ...failed.slice(0, 10)].join("\n"),
    );
  }
  return rows.length;
}
