import { TZDate } from "@date-fns/tz";

export const CLINIC_TIME_ZONE = "Asia/Tbilisi";

/** A Clinic-local calendar date, `YYYY-MM-DD`. */
export type LocalDate = string;

export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseLocalDate(date: LocalDate): [number, number, number] {
  const match = LOCAL_DATE.exec(date);
  if (!match) throw new Error(`Invalid local date: ${date}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function isLocalDate(value: string): boolean {
  return LOCAL_DATE.test(value);
}

/** The instant of `minute` minutes past midnight on `date`, Clinic-local. */
export function localInstant(date: LocalDate, minute = 0): Date {
  const [y, m, d] = parseLocalDate(date);
  return new Date(new TZDate(y, m - 1, d, Math.floor(minute / 60), minute % 60, CLINIC_TIME_ZONE).getTime());
}

const pad = (n: number) => String(n).padStart(2, "0");

export function toLocalDate(instant: Date): LocalDate {
  const t = new TZDate(instant.getTime(), CLINIC_TIME_ZONE);
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

/** Minutes past Clinic-local midnight. */
export function toLocalMinute(instant: Date): number {
  const t = new TZDate(instant.getTime(), CLINIC_TIME_ZONE);
  return t.getHours() * 60 + t.getMinutes();
}

export function weekdayOf(date: LocalDate): IsoWeekday {
  const [y, m, d] = parseLocalDate(date);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return (day === 0 ? 7 : day) as IsoWeekday;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const [y, m, d] = parseLocalDate(date);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Inclusive list of local dates from `from` to `to`. */
export function datesBetween(from: LocalDate, to: LocalDate): LocalDate[] {
  const dates: LocalDate[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) dates.push(d);
  return dates;
}

export function formatMinute(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

export function parseMinute(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid time: ${value}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

// Chromium ships without Georgian ICU data, so `Intl` silently falls back to English there.
const KA_MONTHS = [
  "იანვარი",
  "თებერვალი",
  "მარტი",
  "აპრილი",
  "მაისი",
  "ივნისი",
  "ივლისი",
  "აგვისტო",
  "სექტემბერი",
  "ოქტომბერი",
  "ნოემბერი",
  "დეკემბერი",
];
const KA_WEEKDAYS = ["კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი"];

function formatKa(instant: Date, { long }: { long: boolean }): string {
  const t = new TZDate(instant.getTime(), CLINIC_TIME_ZONE);
  const weekday = KA_WEEKDAYS[t.getDay()]!;
  const dayMonth = `${t.getDate()} ${KA_MONTHS[t.getMonth()]}`;
  return long ? `${weekday}, ${dayMonth}, ${t.getFullYear()}` : `${weekday.slice(0, 3)}, ${dayMonth}`;
}

export function formatDate(instant: Date, locale: "ka" | "en"): string {
  if (locale === "ka") return formatKa(instant, { long: false });
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(instant);
}

export function formatLongDate(instant: Date, locale: "ka" | "en"): string {
  if (locale === "ka") return formatKa(instant, { long: true });
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(instant);
}

export function formatTime(instant: Date): string {
  return formatMinute(toLocalMinute(instant));
}
