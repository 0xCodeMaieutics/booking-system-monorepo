import { TRPCError } from "@trpc/server";
import { getClinic, isSmsDisabled } from "@tsami/booking";
import { and, asc, eq, schema } from "@tsami/db";
import { z } from "zod";

import { appointmentsRouter, patientsRouter } from "./appointments";
import { attentionRouter, practitionersRouter, timeOffRouter, treatmentsRouter } from "./catalogue";
import { adminProcedure, createCallerFactory, router } from "./trpc";

const { admin, clinic } = schema;

const settingsRouter = router({
  get: adminProcedure.query(async ({ ctx }) => {
    const c = await getClinic(ctx.db, ctx.admin.clinicId);
    return { ...c, bookingSiteUrl: `${ctx.bookingSiteUrl}/${c.handle}` };
  }),
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
        phone: z.string().trim().max(32),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(clinic).set(input).where(eq(clinic.id, ctx.admin.clinicId));
    }),
});

const adminsRouter = router({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db
      .select({ id: admin.id, name: admin.name, email: admin.email, deactivatedAt: admin.deactivatedAt })
      .from(admin)
      .where(eq(admin.clinicId, ctx.admin.clinicId))
      .orderBy(asc(admin.name)),
  ),
  invite: adminProcedure
    .input(z.object({ name: z.string().trim().min(1).max(120), email: z.email() }))
    .mutation(({ ctx, input }) => ctx.accounts.invite({ ...input, clinicId: ctx.admin.clinicId })),
  setActive: adminProcedure
    .input(z.object({ id: z.string(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.admin.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot deactivate yourself" });
      }
      const [target] = await ctx.db
        .select({ id: admin.id })
        .from(admin)
        .where(and(eq(admin.id, input.id), eq(admin.clinicId, ctx.admin.clinicId)));
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });
      await (input.active ? ctx.accounts.reactivate(input.id) : ctx.accounts.deactivate(input.id));
    }),
});

export const adminRouter = router({
  me: adminProcedure.query(({ ctx }) => ctx.admin),
  /** The signed-in Admin's Clinic. Its name and Handle are set by Tsami, not by Admins. */
  clinic: adminProcedure.query(async ({ ctx }) => {
    const c = await getClinic(ctx.db, ctx.admin.clinicId);
    return {
      nameKa: c.nameKa,
      nameEn: c.nameEn,
      bookingSiteUrl: `${ctx.bookingSiteUrl}/${c.handle}`,
      smsAvailable: !(await isSmsDisabled(ctx.db)),
    };
  }),
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
export type { AdminAccounts, AdminContext, PhotoStore, SignedInAdmin } from "./trpc";
export { type PhotoContentType, pendingPhotoKey } from "./photos";
export const createAdminCaller = createCallerFactory(adminRouter);
