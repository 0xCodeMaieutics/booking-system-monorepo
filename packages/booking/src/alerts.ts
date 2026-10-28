import { maskPhone } from "./phone";

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

export type SmsFailure = {
  message: string;
  clinicName: string;
  appointmentId?: string;
  phone: string;
  error: unknown;
};

/** Logs a failed SMS and alerts the Tsami team. The phone number is masked. */
export async function reportSmsFailure(alerts: OpsAlerts, f: SmsFailure): Promise<void> {
  const subject = f.appointmentId ? `appointment ${f.appointmentId}` : maskPhone(f.phone);
  console.error(`SMS (${f.message}) for ${subject} failed`, f.error);
  const lines = [
    `SMS failed: ${f.message}`,
    `Clinic: ${f.clinicName}`,
    ...(f.appointmentId ? [`Appointment: ${f.appointmentId}`] : []),
    `Phone: ${maskPhone(f.phone)}`,
    `Error: ${errorMessage(f.error)}`,
  ];
  await alerts.send(lines.join("\n"));
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
