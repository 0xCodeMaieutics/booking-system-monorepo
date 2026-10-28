import { BookingError } from "./errors";

/**
 * Normalises a Georgian mobile number (9 digits starting with 5) to E.164.
 * Other countries are rejected: the SMS provider only delivers in Georgia.
 */
export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("00")) digits = digits.slice(2);
  if (trimmed.startsWith("+") || trimmed.startsWith("00") || digits.length === 12) {
    if (!digits.startsWith("995")) throw new BookingError("INVALID_PHONE");
    digits = digits.slice(3);
  }
  if (!/^5\d{8}$/.test(digits)) throw new BookingError("INVALID_PHONE");
  return `+995${digits}`;
}

/**
 * Normalises a phone number from any country to E.164, for the Clinic to call.
 * Numbers without a country code are read as Georgian.
 */
export function normalizeAnyPhone(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.startsWith("+") && !trimmed.startsWith("00")) return normalizePhone(trimmed);
  const digits = trimmed.replace(/\D/g, "").slice(trimmed.startsWith("00") ? 2 : 0);
  if (digits.startsWith("995")) return normalizePhone(trimmed);
  if (digits.length < 8 || digits.length > 15) throw new BookingError("INVALID_PHONE");
  return `+${digits}`;
}

/** Hides all but the first and last digits of a normalised number, e.g. +995 5•• ••• 450. */
export function maskPhone(phone: string): string {
  if (!phone.startsWith("+995")) return `${phone.slice(0, 3)}•••${phone.slice(-3)}`;
  const national = phone.slice(4);
  return `+995 ${national.slice(0, 1)}•• ••• ${national.slice(-3)}`;
}
