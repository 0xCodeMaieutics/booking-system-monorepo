import { formatDate, formatTime } from "./time";

export type Locale = "ka" | "en";

export interface SmsSender {
  send(to: string, body: string): Promise<void>;
}

const consoleSmsSender: SmsSender = {
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
  clinicName: string;
  treatmentName: string;
  practitionerName: string;
  startsAt: Date;
};

const when = (a: AppointmentSummary, locale: Locale) =>
  `${formatDate(a.startsAt, locale)}, ${formatTime(a.startsAt)}`;

/** Every SMS goes out under Tsami's sender name, so each opens with the Clinic's name (ADR 0005). */
export const smsText = {
  verificationCode: (clinicName: string, code: string, locale: Locale) =>
    locale === "ka" ? `${clinicName}: თქვენი კოდია ${code}` : `${clinicName}: your code is ${code}`,

  confirmation: (a: AppointmentSummary, manageUrl: string, locale: Locale) =>
    locale === "ka"
      ? `${a.clinicName}: ჩაწერილი ხართ — ${a.treatmentName}, ${when(a, locale)}, ${a.practitionerName}. ვიზიტის მართვა: ${manageUrl}`
      : `${a.clinicName}: you're booked for ${a.treatmentName}, ${when(a, locale)}, with ${a.practitionerName}. Manage: ${manageUrl}`,

  reminder: (a: AppointmentSummary, clinicPhone: string, locale: Locale) =>
    locale === "ka"
      ? `${a.clinicName}: შეხსენება — ${a.treatmentName}, ${when(a, locale)}, ${a.practitionerName}. კითხვები: ${clinicPhone}`
      : `${a.clinicName}: reminder — ${a.treatmentName} with ${a.practitionerName}, ${when(a, locale)}. Questions: ${clinicPhone}`,

  cancelledByClinic: (a: AppointmentSummary, clinicPhone: string, locale: Locale) =>
    locale === "ka"
      ? `${a.clinicName}: თქვენი ვიზიტი (${a.treatmentName}, ${when(a, locale)}) გაუქმდა. დაგვიკავშირდით: ${clinicPhone}`
      : `${a.clinicName}: your appointment (${a.treatmentName}, ${when(a, locale)}) has been cancelled. Please call us: ${clinicPhone}`,

  moved: (a: AppointmentSummary, clinicPhone: string, locale: Locale) =>
    locale === "ka"
      ? `${a.clinicName}: თქვენი ვიზიტი გადატანილია — ${a.treatmentName}, ${when(a, locale)}, ${a.practitionerName}. კითხვები: ${clinicPhone}`
      : `${a.clinicName}: your appointment has moved to ${when(a, locale)}, ${a.treatmentName} with ${a.practitionerName}. Questions: ${clinicPhone}`,
};
