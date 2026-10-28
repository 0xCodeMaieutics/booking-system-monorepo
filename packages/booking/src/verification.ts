import { type Db, and, count, eq, gte, schema, sql } from "@tsami/db";

import { type Contact, contactDestination, normalizeContact } from "./contact";
import { BookingError } from "./errors";
import { isSmsDisabled } from "./sms-switch";
import { createVerificationCode, hashVerificationCode, safeEqualHex } from "./tokens";

const { contactVerification } = schema;

const CODE_VALID_MINUTES = 10;
const MAX_ATTEMPTS = 5;
/** How long after entering the code the Patient has to complete the Booking. */
export const VERIFIED_FOR_MINUTES = 20;

const LIMITS = {
  perDestination15Min: 3,
  perDestinationDay: 10,
  perIpHour: 10,
};

/**
 * Creates a one-time code for a Patient's phone or email, enforcing per-contact
 * and per-IP rate limits (skipped in development). The caller sends the code.
 */
export async function requestVerificationCode(
  db: Db,
  input: { contact: Contact; ipAddress: string | null; now: Date },
): Promise<{ verificationId: string; contact: Contact; code: string }> {
  const contact = normalizeContact(input.contact);
  if (contact.channel === "sms" && (await isSmsDisabled(db))) throw new BookingError("SMS_UNAVAILABLE");
  const destination = contactDestination(contact);
  const ago = (minutes: number) => new Date(input.now.getTime() - minutes * 60_000);

  const countSince = async (field: "destination" | "ipAddress", value: string, minutes: number) => {
    const [row] = await db
      .select({ n: count() })
      .from(contactVerification)
      .where(and(eq(contactVerification[field], value), gte(contactVerification.createdAt, ago(minutes))));
    return row?.n ?? 0;
  };

  if (
    process.env.NODE_ENV !== "development" &&
    ((await countSince("destination", destination, 15)) >= LIMITS.perDestination15Min ||
      (await countSince("destination", destination, 24 * 60)) >= LIMITS.perDestinationDay ||
      (input.ipAddress && (await countSince("ipAddress", input.ipAddress, 60)) >= LIMITS.perIpHour))
  ) {
    throw new BookingError("RATE_LIMITED");
  }

  const code = createVerificationCode();
  const [row] = await db
    .insert(contactVerification)
    .values({
      channel: contact.channel,
      destination,
      codeHash: hashVerificationCode(destination, code),
      ipAddress: input.ipAddress,
      expiresAt: new Date(input.now.getTime() + CODE_VALID_MINUTES * 60_000),
      createdAt: input.now,
    })
    .returning({ id: contactVerification.id });
  return { verificationId: row!.id, contact, code };
}

/** Checks a code the Patient typed. Wrong codes count towards the attempt limit. */
export async function checkVerificationCode(
  db: Db,
  input: { verificationId: string; contact: Contact; code: string; now: Date },
): Promise<void> {
  const contact = normalizeContact(input.contact);
  const destination = contactDestination(contact);
  const [v] = await db
    .select()
    .from(contactVerification)
    .where(eq(contactVerification.id, input.verificationId));
  if (
    !v ||
    v.channel !== contact.channel ||
    v.destination !== destination ||
    v.consumedAt ||
    v.expiresAt < input.now ||
    v.attempts >= MAX_ATTEMPTS
  ) {
    throw new BookingError("INVALID_CODE");
  }
  if (v.verifiedAt) return;

  if (!safeEqualHex(v.codeHash, hashVerificationCode(destination, input.code.trim()))) {
    await db
      .update(contactVerification)
      .set({ attempts: sql`${contactVerification.attempts} + 1` })
      .where(eq(contactVerification.id, v.id));
    throw new BookingError("INVALID_CODE");
  }
  await db.update(contactVerification).set({ verifiedAt: input.now }).where(eq(contactVerification.id, v.id));
}
