import { createSmsSender, sendDueReminders } from "@face/booking";
import { getDb } from "@face/db";

/** Called every 15 minutes by Vercel Cron (see vercel.json). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const sent = await sendDueReminders(getDb(), createSmsSender(), new Date());
  return Response.json({ sent });
}
