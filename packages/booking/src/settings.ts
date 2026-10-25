import { type DbOrTx, eq, schema } from "@tsami/db";

export type ClinicSettings = typeof schema.clinicSettings.$inferSelect;

export async function getClinicSettings(db: DbOrTx): Promise<ClinicSettings> {
  const [row] = await db.select().from(schema.clinicSettings).where(eq(schema.clinicSettings.id, 1));
  if (!row) throw new Error("clinic_settings row is missing; run migrations");
  return row;
}

/** Earliest and latest start a Patient may book, given the Booking Window. */
export function bookingWindow(settings: ClinicSettings, now: Date): { earliest: Date; latest: Date } {
  return {
    earliest: new Date(now.getTime() + settings.minNoticeMinutes * 60_000),
    latest: new Date(now.getTime() + settings.bookingWindowDays * 86_400_000),
  };
}
