import "server-only";
import type { AdminContext } from "@tsami/api/admin";
import { createMessenger, createOpsAlerts, isSmsDisabled } from "@tsami/booking";
import { getDb } from "@tsami/db";

import { adminAccounts, auth } from "./auth";
import { photoStore } from "./photos";

let messenger: ReturnType<typeof createMessenger> | undefined;
let alerts: ReturnType<typeof createOpsAlerts> | undefined;

export async function createAdminContext(headers: Headers): Promise<AdminContext> {
  messenger ??= createMessenger({ smsDisabled: () => isSmsDisabled(getDb()) });
  alerts ??= createOpsAlerts();
  const session = await auth.api.getSession({ headers });
  const user = session?.user;
  return {
    db: getDb(),
    messenger,
    alerts,
    admin:
      user && !user.deactivatedAt
        ? { id: user.id, clinicId: user.clinicId, name: user.name, email: user.email }
        : null,
    accounts: adminAccounts,
    photos: photoStore,
    bookingSiteUrl: process.env.BOOKING_BASE_URL ?? "http://localhost:3000",
    now: () => new Date(),
  };
}
