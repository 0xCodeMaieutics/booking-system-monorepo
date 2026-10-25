import { Resend } from "resend";

type Email = { to: string; subject: string; html: string };

let resend: Resend | undefined;

/** Sends Admin email through Resend, or logs it when RESEND_API_KEY is unset outside production. */
export async function sendEmail(email: Email): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY must be set in production");
    console.info(`[email] to ${email.to}: ${email.subject}\n${email.html}`);
    return;
  }
  resend ??= new Resend(key);
  const { error } = await resend.emails.send({
    from: process.env.ADMIN_EMAIL_FROM ?? "Visita <no-reply@example.com>",
    ...email,
  });
  if (error) throw new Error(`Resend failed: ${error.message}`);
}
