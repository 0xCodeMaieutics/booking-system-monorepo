import { createMessenger, createOpsAlerts, sendDueReminders } from "@tsami/booking";
import { getDb } from "@tsami/db";

/** Called hourly by Vercel Cron (see vercel.json). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const sent = await sendDueReminders(getDb(), createMessenger(), createOpsAlerts(), new Date());
  return Response.json({ sent });
}
