import { type Contact, maskContact } from "./contact";

/** Tells the Tsami team about failures that need a person to look at them. Never throws. */
export interface OpsAlerts {
  send(text: string): Promise<void>;
}

/** Sends alerts to a Telegram chat, or only logs them when the bot isn't configured. */
export function createOpsAlerts(
  botToken = process.env.TELEGRAM_BOT_TOKEN ?? "",
  chatId = process.env.TELEGRAM_CHAT_ID ?? "",
): OpsAlerts {
  if (!botToken || !chatId) {
    return {
      async send(text) {
        console.warn(`[alert] ${text}`);
      },
    };
  }
  return {
    async send(text) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text }),
          signal: AbortSignal.timeout(5_000),
        });
        if (!response.ok) console.error(`Telegram alert failed with ${response.status}: ${text}`);
      } catch (error) {
        console.error(`Telegram alert failed: ${text}`, error);
      }
    },
  };
}

export type MessageFailure = {
  message: string;
  clinicName: string;
  appointmentId?: string;
  contact: Contact;
  error: unknown;
};

/** Logs a Message that failed to send and alerts the Tsami team. The contact is masked. */
export async function reportMessageFailure(alerts: OpsAlerts, f: MessageFailure): Promise<void> {
  const channel = f.contact.channel === "sms" ? "SMS" : "Email";
  const masked = maskContact(f.contact);
  console.error(
    `${channel} (${f.message}) for ${f.appointmentId ? `appointment ${f.appointmentId}` : masked} failed`,
    f.error,
  );
  const lines = [
    `${channel} failed: ${f.message}`,
    `Clinic: ${f.clinicName}`,
    ...(f.appointmentId ? [`Appointment: ${f.appointmentId}`] : []),
    `To: ${masked}`,
    `Error: ${errorMessage(f.error)}`,
  ];
  await alerts.send(lines.join("\n"));
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
