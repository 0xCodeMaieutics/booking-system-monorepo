import { BookingError } from "./errors";

/**
 * Normalises a mobile number to E.164. Numbers without a country code are
 * read as Georgian (+995), where mobiles are 9 digits starting with 5.
 */
export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
    const international = trimmed.startsWith("00") ? digits.slice(2) : digits;
    if (international.startsWith("995")) return georgian(international.slice(3));
    if (international.length < 8 || international.length > 15) throw new BookingError("INVALID_PHONE");
    return `+${international}`;
  }
  if (digits.startsWith("995") && digits.length === 12) return georgian(digits.slice(3));
  return georgian(digits);
}

function georgian(national: string): string {
  if (!/^5\d{8}$/.test(national)) throw new BookingError("INVALID_PHONE");
  return `+995${national}`;
}
