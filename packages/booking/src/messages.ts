import type { Contact } from "./contact";
import { type EmailSender, createEmailSender } from "./email";
import { type SmsSender, createSmsSender } from "./sms";
import { formatDate, formatTime } from "./time";

export type Locale = "ka" | "en";

/** A message to a Patient. SMS sends only the text; email adds the subject. */
export type Message = { subject: string; text: string };

/**
 * Sends a Message on whichever channel the Patient was verified on (ADR 0009).
 * While SMS is switched off, SMS Patients get email if they gave one (ADR 0010).
 */
export interface Messenger {
  send(to: Contact, message: Message): Promise<void>;
}

export function createMessenger({
  smsDisabled,
  sms = createSmsSender(),
  email = createEmailSender(),
}: {
  smsDisabled: () => Promise<boolean>;
  sms?: SmsSender;
  email?: EmailSender;
}): Messenger {
  return {
    async send(to, message) {
      if (to.channel === "sms" && !(await smsDisabled())) return sms.send(to.phone, message.text);
      const address = to.channel === "email" ? to.email : to.fallbackEmail;
      if (!address) throw new Error("Not sent: SMS is switched off and the Patient has no email");
      await email.send({ to: address, subject: message.subject, text: message.text });
    },
  };
}

type AppointmentSummary = {
  clinicName: string;
  treatmentName: string;
  practitionerName: string;
  startsAt: Date;
};

const when = (a: AppointmentSummary, locale: Locale) =>
  `${formatDate(a.startsAt, locale)}, ${formatTime(a.startsAt)}`;

const message = (clinicName: string, subject: string, text: string): Message => ({
  subject: `${clinicName}: ${subject}`,
  text,
});

/** Every SMS goes out under Tsami's sender name, so each opens with the Clinic's name (ADR 0005). */
export const patientMessages = {
  verificationCode: (clinicName: string, code: string, locale: Locale) =>
    locale === "ka"
      ? message(clinicName, "დადასტურების კოდი", `${clinicName}: თქვენი კოდია ${code}`)
      : message(clinicName, "your verification code", `${clinicName}: your code is ${code}`),

  confirmation: (a: AppointmentSummary, manageUrl: string, locale: Locale) =>
    locale === "ka"
      ? message(
          a.clinicName,
          "ჩაწერის დადასტურება",
          `${a.clinicName}: ჩაწერილი ხართ — ${a.treatmentName}, ${when(a, locale)}, ${a.practitionerName}. ვიზიტის მართვა: ${manageUrl}`,
        )
      : message(
          a.clinicName,
          "appointment confirmed",
          `${a.clinicName}: you're booked for ${a.treatmentName}, ${when(a, locale)}, with ${a.practitionerName}. Manage: ${manageUrl}`,
        ),

  reminder: (a: AppointmentSummary, clinicPhone: string, locale: Locale) =>
    locale === "ka"
      ? message(
          a.clinicName,
          "შეხსენება",
          `${a.clinicName}: შეხსენება — ${a.treatmentName}, ${when(a, locale)}, ${a.practitionerName}. კითხვები: ${clinicPhone}`,
        )
      : message(
          a.clinicName,
          "appointment reminder",
          `${a.clinicName}: reminder — ${a.treatmentName} with ${a.practitionerName}, ${when(a, locale)}. Questions: ${clinicPhone}`,
        ),

  cancelledByClinic: (a: AppointmentSummary, clinicPhone: string, locale: Locale) =>
    locale === "ka"
      ? message(
          a.clinicName,
          "ვიზიტი გაუქმდა",
          `${a.clinicName}: თქვენი ვიზიტი (${a.treatmentName}, ${when(a, locale)}) გაუქმდა. დაგვიკავშირდით: ${clinicPhone}`,
        )
      : message(
          a.clinicName,
          "appointment cancelled",
          `${a.clinicName}: your appointment (${a.treatmentName}, ${when(a, locale)}) has been cancelled. Please call us: ${clinicPhone}`,
        ),

  moved: (a: AppointmentSummary, clinicPhone: string, locale: Locale) =>
    locale === "ka"
      ? message(
          a.clinicName,
          "ვიზიტი გადატანილია",
          `${a.clinicName}: თქვენი ვიზიტი გადატანილია — ${a.treatmentName}, ${when(a, locale)}, ${a.practitionerName}. კითხვები: ${clinicPhone}`,
        )
      : message(
          a.clinicName,
          "appointment moved",
          `${a.clinicName}: your appointment has moved to ${when(a, locale)}, ${a.treatmentName} with ${a.practitionerName}. Questions: ${clinicPhone}`,
        ),
};
