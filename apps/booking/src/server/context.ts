import "server-only";
import type { BookingContext } from "@tsami/api/booking";
import { createMessenger, createOpsAlerts, isSmsDisabled } from "@tsami/booking";
import { getDb } from "@tsami/db";

let messenger: ReturnType<typeof createMessenger> | undefined;
let alerts: ReturnType<typeof createOpsAlerts> | undefined;

export function createBookingContext(headers: Headers): BookingContext {
  messenger ??= createMessenger({ smsDisabled: () => isSmsDisabled(getDb()) });
  alerts ??= createOpsAlerts();
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    db: getDb(),
    messenger,
    alerts,
    ipAddress: forwarded || headers.get("x-real-ip") || null,
    siteUrl: process.env.BOOKING_BASE_URL ?? "http://localhost:3000",
    photosUrl: process.env.PHOTOS_URL ?? "http://localhost:8333/tsami-photos",
    now: () => new Date(),
  };
}
