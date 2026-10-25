import type { SmsSender } from "@face/booking";
import type { Db } from "@face/db";
import { TRPCError, initTRPC } from "@trpc/server";

import { rethrowBookingError, trpcOptions } from "../shared";

export type SignedInAdmin = { id: string; name: string; email: string };

/** Admin account operations, implemented by the Admin Dashboard's auth setup. */
export interface AdminAccounts {
  invite(input: { name: string; email: string }): Promise<void>;
  deactivate(adminId: string): Promise<void>;
  reactivate(adminId: string): Promise<void>;
}

export type AdminContext = {
  db: Db;
  sms: SmsSender;
  admin: SignedInAdmin | null;
  accounts: AdminAccounts;
  /** Public origin of the Booking Site, for Manage Links in SMS. */
  bookingSiteUrl: string;
  now: () => Date;
};

const t = initTRPC.context<AdminContext>().create(trpcOptions);

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.admin) throw new TRPCError({ code: "UNAUTHORIZED" });
  const result = await next({ ctx: { admin: ctx.admin } });
  if (!result.ok) rethrowBookingError(result.error);
  return result;
});
