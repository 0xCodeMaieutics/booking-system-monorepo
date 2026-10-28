import "server-only";
import type { AdminContext } from "@tsami/api/admin";
import { createSmsSender } from "@tsami/booking";
import { getDb } from "@tsami/db";

import { adminAccounts, auth } from "./auth";
import { photoStore } from "./photos";

let sms: ReturnType<typeof createSmsSender> | undefined;

export async function createAdminContext(headers: Headers): Promise<AdminContext> {
  sms ??= createSmsSender();
  const session = await auth.api.getSession({ headers });
  const user = session?.user;
  return {
    db: getDb(),
    sms,
    admin:
      user && !user.deactivatedAt
        ? { id: user.id, clinicId: user.clinicId, name: user.name, email: user.email }
        : null,
    accounts: adminAccounts,
    photos: photoStore,
    bookingSiteUrl: process.env.BOOKING_SITE_URL ?? "http://localhost:3000",
    now: () => new Date(),
  };
}
