import { TRPCError, initTRPC } from "@trpc/server";
import { BookingError, type SmsSender, findClinicByHandle } from "@tsami/booking";
import type { Db } from "@tsami/db";
import { z } from "zod";

import { rethrowBookingError, trpcOptions } from "../shared";

export type BookingContext = {
  db: Db;
  sms: SmsSender;
  ipAddress: string | null;
  /** Public origin of the Booking Site, used in Manage Links. */
  siteUrl: string;
  /** Public base URL of the photo bucket (ADR 0006). */
  photosUrl: string;
  now: () => Date;
};

const t = initTRPC.context<BookingContext>().create(trpcOptions);

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

/** Every Booking Site procedure is public; there is no signed-in user. */
const publicProcedure = t.procedure.use(async ({ next }) => {
  const result = await next();
  if (!result.ok) rethrowBookingError(result.error);
  return result;
});

/** A procedure on one Clinic's Booking Site, addressed by its Handle (docs/adr/0008). */
export const clinicProcedure = publicProcedure
  .input(z.object({ handle: z.string().max(40) }))
  .use(async ({ ctx, input, next }) => {
    const clinic = await findClinicByHandle(ctx.db, input.handle);
    if (!clinic) throw new TRPCError({ code: "NOT_FOUND", message: "Clinic not found" });
    return next({ ctx: { clinic } });
  });

/** A Closed Clinic takes no new Bookings, but its Manage Links keep working. */
export const openClinicProcedure = clinicProcedure.use(({ ctx, next }) => {
  if (ctx.clinic.closedAt) throw new BookingError("CLINIC_CLOSED");
  return next();
});
