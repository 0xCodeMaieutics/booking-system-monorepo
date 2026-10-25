import { initTRPC } from "@trpc/server";
import type { SmsSender } from "@visita/booking";
import type { Db } from "@visita/db";

import { rethrowBookingError, trpcOptions } from "../shared";

export type BookingContext = {
  db: Db;
  sms: SmsSender;
  ipAddress: string | null;
  /** Public origin of the Booking Site, used in Manage Links. */
  siteUrl: string;
  now: () => Date;
};

const t = initTRPC.context<BookingContext>().create(trpcOptions);

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

/** Every Booking Site procedure is public; there is no signed-in user. */
export const publicProcedure = t.procedure.use(async ({ next }) => {
  const result = await next();
  if (!result.ok) rethrowBookingError(result.error);
  return result;
});
