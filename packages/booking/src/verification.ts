import { type Db, and, count, eq, gte, schema, sql } from "@face/db";

import { BookingError } from "./errors";
import { normalizePhone } from "./phone";
import { createVerificationCode, hashVerificationCode, safeEqualHex } from "./tokens";

const { phoneVerification } = schema;

const CODE_VALID_MINUTES = 10;
const MAX_ATTEMPTS = 5;
/** How long after entering the code the Patient has to complete the Booking. */
export const VERIFIED_FOR_MINUTES = 20;

const LIMITS = {
  perPhone15Min: 3,
  perPhoneDay: 10,
  perIpHour: 10,
};

/**
 * Creates a one-time code for a Patient's phone, enforcing per-phone and
 * per-IP rate limits. The caller sends the code by SMS.
 */
export async function requestVerificationCode(
  db: Db,
  input: { phone: string; ipAddress: string | null; now: Date },
): Promise<{ verificationId: string; phone: string; code: string }> {
  const phone = normalizePhone(input.phone);
  const ago = (minutes: number) => new Date(input.now.getTime() - minutes * 60_000);

  const countSince = async (field: "phone" | "ipAddress", value: string, minutes: number) => {
    const [row] = await db
      .select({ n: count() })
      .from(phoneVerification)
      .where(and(eq(phoneVerification[field], value), gte(phoneVerification.createdAt, ago(minutes))));
    return row?.n ?? 0;
  };

  if (
    (await countSince("phone", phone, 15)) >= LIMITS.perPhone15Min ||
    (await countSince("phone", phone, 24 * 60)) >= LIMITS.perPhoneDay ||
    (input.ipAddress && (await countSince("ipAddress", input.ipAddress, 60)) >= LIMITS.perIpHour)
  ) {
    throw new BookingError("RATE_LIMITED");
  }

  const code = createVerificationCode();
  const [row] = await db
    .insert(phoneVerification)
    .values({
      phone,
      codeHash: hashVerificationCode(phone, code),
      ipAddress: input.ipAddress,
      expiresAt: new Date(input.now.getTime() + CODE_VALID_MINUTES * 60_000),
      createdAt: input.now,
    })
    .returning({ id: phoneVerification.id });
  return { verificationId: row!.id, phone, code };
}

/** Checks a code the Patient typed. Wrong codes count towards the attempt limit. */
export async function checkVerificationCode(
  db: Db,
  input: { verificationId: string; phone: string; code: string; now: Date },
): Promise<void> {
  const phone = normalizePhone(input.phone);
  const [v] = await db.select().from(phoneVerification).where(eq(phoneVerification.id, input.verificationId));
  if (!v || v.phone !== phone || v.consumedAt || v.expiresAt < input.now || v.attempts >= MAX_ATTEMPTS) {
    throw new BookingError("INVALID_CODE");
  }
  if (v.verifiedAt) return;

  if (!safeEqualHex(v.codeHash, hashVerificationCode(phone, input.code.trim()))) {
    await db
      .update(phoneVerification)
      .set({ attempts: sql`${phoneVerification.attempts} + 1` })
      .where(eq(phoneVerification.id, v.id));
    throw new BookingError("INVALID_CODE");
  }
  await db.update(phoneVerification).set({ verifiedAt: input.now }).where(eq(phoneVerification.id, v.id));
}
