import "server-only";
import type { BookingContext } from "@face/api/booking";
import { createSmsSender } from "@face/booking";
import { getDb } from "@face/db";

let sms: ReturnType<typeof createSmsSender> | undefined;

export function createBookingContext(headers: Headers): BookingContext {
  sms ??= createSmsSender();
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    db: getDb(),
    sms,
    ipAddress: forwarded || headers.get("x-real-ip") || null,
    siteUrl: process.env.BOOKING_SITE_URL ?? "http://localhost:3000",
    now: () => new Date(),
  };
}
