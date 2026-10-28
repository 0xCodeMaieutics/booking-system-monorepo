import { BookingError } from "./errors";
import { maskPhone, normalizePhone } from "./phone";

export type ContactChannel = "sms" | "email";

/**
 * Where a Patient is verified and notified: a Georgian mobile, or an email without one (ADR 0009).
 * An SMS Patient's optional email is used while SMS is switched off (ADR 0010).
 */
export type Contact =
  | { channel: "sms"; phone: string; fallbackEmail?: string | null }
  | { channel: "email"; email: string };

export function normalizeEmail(input: string): string {
  const email = input.trim().toLowerCase();
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new BookingError("INVALID_EMAIL");
  return email;
}

export function normalizeContact(contact: Contact): Contact {
  return contact.channel === "sms"
    ? { channel: "sms", phone: normalizePhone(contact.phone) }
    : { channel: "email", email: normalizeEmail(contact.email) };
}

/** The phone number or email address a Contact is identified by. */
export function contactDestination(contact: Contact): string {
  return contact.channel === "sms" ? contact.phone : contact.email;
}

/** The Contact a Patient is notified on. The database guarantees it is set for their channel. */
export function patientContact(p: { channel: ContactChannel; phone: string | null; email: string | null }) {
  return p.channel === "sms"
    ? ({ channel: "sms", phone: p.phone!, fallbackEmail: p.email } as const)
    : ({ channel: "email", email: p.email! } as const);
}

/** Hides most of a Contact for alerts, e.g. +995 5•• ••• 450 or a•••@gmail.com. */
export function maskContact(contact: Contact): string {
  if (contact.channel === "sms") return maskPhone(contact.phone);
  const [local = "", domain = ""] = contact.email.split("@");
  return `${local.slice(0, 1)}•••@${domain}`;
}
