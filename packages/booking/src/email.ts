/** Sends plain-text email to Patients without a Georgian mobile (ADR 0009). */
export interface EmailSender {
  send(email: { to: string; subject: string; text: string }): Promise<void>;
}

const consoleEmailSender: EmailSender = {
  async send(email) {
    console.info(`[email] to ${email.to}: ${email.subject}\n${email.text}`);
  },
};

/** Resend's REST API (https://resend.com/docs/api-reference/emails/send-email). */
function resendEmailSender(apiKey: string, from: string): EmailSender {
  return {
    async send(email) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [email.to], subject: email.subject, text: email.text }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(`Resend ${response.status}: ${result?.message ?? response.statusText}`);
      }
    },
  };
}

/** Sends through Resend, or logs when RESEND_API_KEY is unset outside production. */
export function createEmailSender(
  apiKey = process.env.RESEND_API_KEY ?? "",
  from = process.env.PATIENT_EMAIL_FROM ?? "",
): EmailSender {
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY must be set in production");
    return consoleEmailSender;
  }
  if (!from) throw new Error("PATIENT_EMAIL_FROM must be set when RESEND_API_KEY is");
  return resendEmailSender(apiKey, from);
}
