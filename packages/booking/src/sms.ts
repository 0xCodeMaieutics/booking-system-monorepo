import { formatDate, formatTime } from "./time";

export type Locale = "ka" | "en";

export interface SmsSender {
  send(to: string, body: string): Promise<void>;
}

export const consoleSmsSender: SmsSender = {
  async send(to, body) {
    console.info(`[sms] to ${to}: ${body}`);
  },
};

/**
 * Picks the SMS provider from `SMS_PROVIDER`. Empty means log to the console,
 * which is only allowed outside production.
 */
export function createSmsSender(provider = process.env.SMS_PROVIDER ?? ""): SmsSender {
  if (provider === "") {
    if (process.env.NODE_ENV === "production") throw new Error("SMS_PROVIDER must be set in production");
    return consoleSmsSender;
  }
  throw new Error(
    `Unknown SMS_PROVIDER "${provider}". Add an SmsSender for it in packages/booking/src/sms.ts.`,
  );
}

type AppointmentSummary = {
  treatmentName: string;
  practitionerName: string;
  startsAt: Date;
};

const when = (a: AppointmentSummary, locale: Locale) =>
  `${formatDate(a.startsAt, locale)}, ${formatTime(a.startsAt)}`;

export const smsText = {
  verificationCode: (code: string, locale: Locale) =>
    locale === "ka" ? `ფეისი: თქვენი კოდია ${code}` : `Face: your code is ${code}`,

  confirmation: (a: AppointmentSummary, manageUrl: string, locale: Locale) =>
    locale === "ka"
      ? `ფეისი: ჩაწერილი ხართ — ${a.treatmentName}, ${when(a, locale)}, ${a.practitionerName}. ვიზიტის მართვა: ${manageUrl}`
      : `Face: you're booked for ${a.treatmentName}, ${when(a, locale)}, with ${a.practitionerName}. Manage: ${manageUrl}`,

  reminder: (a: AppointmentSummary, clinicPhone: string, locale: Locale) =>
    locale === "ka"
      ? `ფეისი: შეხსენება — ${a.treatmentName}, ${when(a, locale)}, ${a.practitionerName}. კითხვები: ${clinicPhone}`
      : `Face: reminder — ${a.treatmentName} with ${a.practitionerName}, ${when(a, locale)}. Questions: ${clinicPhone}`,

  cancelledByClinic: (a: AppointmentSummary, clinicPhone: string, locale: Locale) =>
    locale === "ka"
      ? `ფეისი: თქვენი ვიზიტი (${a.treatmentName}, ${when(a, locale)}) გაუქმდა. დაგვიკავშირდით: ${clinicPhone}`
      : `Face: your appointment (${a.treatmentName}, ${when(a, locale)}) has been cancelled. Please call us: ${clinicPhone}`,

  moved: (a: AppointmentSummary, clinicPhone: string, locale: Locale) =>
    locale === "ka"
      ? `ფეისი: თქვენი ვიზიტი გადატანილია — ${a.treatmentName}, ${when(a, locale)}, ${a.practitionerName}. კითხვები: ${clinicPhone}`
      : `Face: your appointment has moved to ${when(a, locale)}, ${a.treatmentName} with ${a.practitionerName}. Questions: ${clinicPhone}`,
};
