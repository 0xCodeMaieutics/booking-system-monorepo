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
 * Sender.ge (https://sender.ge/openapi.json). The sender name is the Brand Name
 * activated on the account, not something we send.
 */
export function senderGeSmsSender(apiKey: string): SmsSender {
  return {
    async send(to, body) {
      const destination = to.replace(/^\+995/, "");
      if (!/^5\d{8}$/.test(destination)) throw new Error("sender.ge only delivers to Georgian mobiles");
      // No retry: a timeout or 503 may still have been accepted, and a retry would send twice.
      const response = await fetch("https://sender.ge/api/send.php", {
        method: "POST",
        // smsno 2 is informational: no "SmsNo" opt-out suffix, unlike promotional (1).
        body: new URLSearchParams({ apikey: apiKey, smsno: "2", destination, content: body }),
        signal: AbortSignal.timeout(10_000),
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        data?: { messageId?: string; qnt?: number }[];
      } | null;
      if (!response.ok) {
        throw new Error(`sender.ge ${response.status}: ${result?.message ?? response.statusText}`);
      }
      const sent = result?.data?.[0];
      console.info(`[sms] sender.ge accepted ${sent?.messageId} (${sent?.qnt} segments)`);
    },
  };
}

/**
 * Picks the SMS provider from `SMS_PROVIDER`. Empty means log to the console,
 * which is only allowed outside production.
 */
export function createSmsSender(provider = process.env.SMS_PROVIDER ?? ""): SmsSender {
  if (provider === "") {
    if (process.env.NODE_ENV === "production") throw new Error("SMS_PROVIDER must be set in production");
    return consoleSmsSender;
  }
  if (provider === "sender.ge") {
    const apiKey = process.env.SENDER_GE_API_KEY;
    if (!apiKey) throw new Error("SENDER_GE_API_KEY must be set when SMS_PROVIDER is sender.ge");
    return senderGeSmsSender(apiKey);
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
