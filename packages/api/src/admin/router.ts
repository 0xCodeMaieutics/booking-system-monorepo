import { TRPCError } from "@trpc/server";
import { getClinicSettings } from "@tsami/booking";
import { asc, eq, schema } from "@tsami/db";
import { z } from "zod";

import { appointmentsRouter, patientsRouter } from "./appointments";
import { attentionRouter, practitionersRouter, timeOffRouter, treatmentsRouter } from "./catalogue";
import { adminProcedure, createCallerFactory, router } from "./trpc";

const { admin, clinicSettings } = schema;

const settingsRouter = router({
  get: adminProcedure.query(({ ctx }) => getClinicSettings(ctx.db)),
  update: adminProcedure
    .input(
      z.object({
        minNoticeMinutes: z
          .number()
          .int()
          .min(0)
          .max(7 * 24 * 60),
        bookingWindowDays: z.number().int().min(1).max(365),
        cancellationCutoffHours: z
          .number()
          .int()
          .min(0)
          .max(14 * 24),
        clinicPhone: z.string().trim().max(32),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(clinicSettings).set(input).where(eq(clinicSettings.id, 1));
    }),
});

const adminsRouter = router({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db
      .select({ id: admin.id, name: admin.name, email: admin.email, deactivatedAt: admin.deactivatedAt })
      .from(admin)
      .orderBy(asc(admin.name)),
  ),
  invite: adminProcedure
    .input(z.object({ name: z.string().trim().min(1).max(120), email: z.email() }))
    .mutation(({ ctx, input }) => ctx.accounts.invite(input)),
  setActive: adminProcedure
    .input(z.object({ id: z.string(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.admin.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot deactivate yourself" });
      }
      await (input.active ? ctx.accounts.reactivate(input.id) : ctx.accounts.deactivate(input.id));
    }),
});

export const adminRouter = router({
  me: adminProcedure.query(({ ctx }) => ctx.admin),
  settings: settingsRouter,
  admins: adminsRouter,
  treatments: treatmentsRouter,
  practitioners: practitionersRouter,
  timeOff: timeOffRouter,
  attention: attentionRouter,
  appointments: appointmentsRouter,
  patients: patientsRouter,
});

export type AdminRouter = typeof adminRouter;
export type { AdminAccounts, AdminContext, SignedInAdmin } from "./trpc";
export const createAdminCaller = createCallerFactory(adminRouter);
