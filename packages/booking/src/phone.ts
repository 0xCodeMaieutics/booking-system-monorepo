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

/** Hides all but the first and last digits of a normalised number, e.g. +995 5•• ••• 450. */
export function maskPhone(phone: string): string {
  const national = phone.replace(/^\+995/, "");
  return `+995 ${national.slice(0, 1)}•• ••• ${national.slice(-3)}`;
}
