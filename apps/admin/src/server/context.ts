import "server-only";
import type { AdminContext } from "@visita/api/admin";
import { createSmsSender } from "@visita/booking";
import { getDb } from "@visita/db";

import { adminAccounts, auth } from "./auth";

let sms: ReturnType<typeof createSmsSender> | undefined;

export async function createAdminContext(headers: Headers): Promise<AdminContext> {
  sms ??= createSmsSender();
  const session = await auth.api.getSession({ headers });
  const user = session?.user;
  return {
    db: getDb(),
    sms,
    admin: user && !user.deactivatedAt ? { id: user.id, name: user.name, email: user.email } : null,
    accounts: adminAccounts,
    bookingSiteUrl: process.env.BOOKING_SITE_URL ?? "http://localhost:3000",
    now: () => new Date(),
  };
}
