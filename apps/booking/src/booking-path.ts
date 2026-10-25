import { isLocale } from "@/i18n";

export const ANY_PRACTITIONER = "any";

export type BookingSelection = {
  treatmentId?: string;
  practitionerId?: string;
  date?: string;
  time?: string;
  confirmed?: boolean;
};

const STEPS = [
  ["treatment", "treatmentId"],
  ["practitioner", "practitionerId"],
  ["date", "date"],
  ["time", "time"],
] as const;

const CONFIRMATION = "confirmation";

/**
 * `/treatment/<id>/practitioner/<id|any>/date/<YYYY-MM-DD>/time/<HH:MM>[/confirmation]`,
 * truncated at the first step without a value.
 */
export function bookingPath(selection: BookingSelection): string {
  let path = "";
  for (const [segment, field] of STEPS) {
    const value = selection[field];
    if (!value) return path || "/";
    path += `/${segment}/${value}`;
  }
  return selection.confirmed ? `${path}/${CONFIRMATION}` : path;
}

/** Parses the path segments after the locale; `undefined` if they aren't a booking path. */
export function parseBookingSteps(segments: string[]): BookingSelection | undefined {
  if (segments.length === STEPS.length * 2 + 1 && segments.at(-1) === CONFIRMATION) {
    const selection = parseBookingSteps(segments.slice(0, -1));
    return selection && { ...selection, confirmed: true };
  }
  if (segments.length % 2 !== 0 || segments.length > STEPS.length * 2) return undefined;
  const selection: BookingSelection = {};
  for (let i = 0; i < segments.length; i += 2) {
    const [segment, field] = STEPS[i / 2]!;
    if (segments[i] !== segment) return undefined;
    selection[field] = segments[i + 1];
  }
  return selection;
}

export function parseBookingPathname(pathname: string): BookingSelection {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] && isLocale(segments[0])) segments.shift();
  return parseBookingSteps(segments) ?? {};
}
