import { type DbOrTx, eq, schema } from "@tsami/db";

import { BookingError } from "./errors";

export type Clinic = typeof schema.clinic.$inferSelect;

/** Path segments a Handle would shadow on the Booking Site (docs/adr/0008). */
const RESERVED_HANDLES = new Set(["api", "en", "ka"]);

export function isValidHandle(handle: string): boolean {
  return (
    handle.length >= 3 &&
    handle.length <= 40 &&
    /^[a-z0-9]+(-[a-z0-9]+)*$/.test(handle) &&
    !RESERVED_HANDLES.has(handle)
  );
}

export async function getClinic(db: DbOrTx, clinicId: string): Promise<Clinic> {
  const [row] = await db.select().from(schema.clinic).where(eq(schema.clinic.id, clinicId));
  if (!row) throw new BookingError("NOT_FOUND", "Clinic not found");
  return row;
}

export async function findClinicByHandle(db: DbOrTx, handle: string): Promise<Clinic | null> {
  if (!isValidHandle(handle)) return null;
  const [row] = await db.select().from(schema.clinic).where(eq(schema.clinic.handle, handle));
  return row ?? null;
}

export function clinicName(clinic: Pick<Clinic, "nameKa" | "nameEn">, locale: "ka" | "en"): string {
  return locale === "ka" ? clinic.nameKa : clinic.nameEn;
}

/** The Manage Link for an Appointment, under its Clinic's Booking Site. */
export function manageUrl(siteUrl: string, handle: string, locale: "ka" | "en", token: string): string {
  return `${siteUrl}/${handle}${locale === "en" ? "/en" : ""}/a/${token}`;
}

/** Earliest and latest start a Patient may book, given the Booking Window. */
export function bookingWindow(clinic: Clinic, now: Date): { earliest: Date; latest: Date } {
  return {
    earliest: new Date(now.getTime() + clinic.minNoticeMinutes * 60_000),
    latest: new Date(now.getTime() + clinic.bookingWindowDays * 86_400_000),
  };
}
