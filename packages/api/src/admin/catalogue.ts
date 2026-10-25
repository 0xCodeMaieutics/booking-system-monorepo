import { TRPCError } from "@trpc/server";
import { appointmentsNeedingAttention } from "@visita/booking";
import { and, asc, eq, gt, isNull, or, schema } from "@visita/db";
import { z } from "zod";

import { adminProcedure, router } from "./trpc";

const { practitioner, practitionerTreatment, scheduleRange, timeOff, treatment } = schema;

const treatmentInput = z.object({
  nameKa: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().min(1).max(200),
  descriptionKa: z.string().trim().max(2000).nullable(),
  descriptionEn: z.string().trim().max(2000).nullable(),
  durationMinutes: z
    .number()
    .int()
    .min(5)
    .max(8 * 60),
  priceFromGel: z.number().int().min(0).nullable(),
  sortOrder: z.number().int(),
});

const practitionerInput = z.object({
  nameKa: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().min(1).max(200),
  titleKa: z.string().trim().max(50).nullable(),
  titleEn: z.string().trim().max(50).nullable(),
  sortOrder: z.number().int(),
  treatmentIds: z.array(z.uuid()),
});

const rangeInput = z
  .object({
    weekday: z.number().int().min(1).max(7),
    startMinute: z.number().int().min(0).max(1440),
    endMinute: z.number().int().min(0).max(1440),
  })
  .refine((r) => r.startMinute < r.endMinute, "Range must end after it starts");

const archive = z.object({ id: z.uuid(), archived: z.boolean() });

export const treatmentsRouter = router({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db.select().from(treatment).orderBy(asc(treatment.sortOrder), asc(treatment.nameEn)),
  ),
  create: adminProcedure.input(treatmentInput).mutation(async ({ ctx, input }) => {
    const [row] = await ctx.db.insert(treatment).values(input).returning();
    return row!;
  }),
  update: adminProcedure.input(treatmentInput.extend({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    const { id, ...values } = input;
    await ctx.db.update(treatment).set(values).where(eq(treatment.id, id));
  }),
  setArchived: adminProcedure.input(archive).mutation(async ({ ctx, input }) => {
    await ctx.db
      .update(treatment)
      .set({ archivedAt: input.archived ? ctx.now() : null })
      .where(eq(treatment.id, input.id));
  }),
});

export const practitionersRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    const [rows, links] = await Promise.all([
      ctx.db.select().from(practitioner).orderBy(asc(practitioner.sortOrder), asc(practitioner.nameEn)),
      ctx.db.select().from(practitionerTreatment),
    ]);
    return rows.map((p) => ({
      ...p,
      treatmentIds: links.filter((l) => l.practitionerId === p.id).map((l) => l.treatmentId),
    }));
  }),

  get: adminProcedure.input(z.object({ id: z.uuid() })).query(async ({ ctx, input }) => {
    const [p] = await ctx.db.select().from(practitioner).where(eq(practitioner.id, input.id));
    if (!p) throw new TRPCError({ code: "NOT_FOUND" });
    const [links, ranges] = await Promise.all([
      ctx.db.select().from(practitionerTreatment).where(eq(practitionerTreatment.practitionerId, p.id)),
      ctx.db
        .select()
        .from(scheduleRange)
        .where(eq(scheduleRange.practitionerId, p.id))
        .orderBy(asc(scheduleRange.weekday), asc(scheduleRange.startMinute)),
    ]);
    return { ...p, treatmentIds: links.map((l) => l.treatmentId), ranges };
  }),

  create: adminProcedure.input(practitionerInput).mutation(async ({ ctx, input }) => {
    const { treatmentIds, ...values } = input;
    return ctx.db.transaction(async (tx) => {
      const [row] = await tx.insert(practitioner).values(values).returning();
      if (treatmentIds.length > 0) {
        await tx
          .insert(practitionerTreatment)
          .values(treatmentIds.map((treatmentId) => ({ practitionerId: row!.id, treatmentId })));
      }
      return row!;
    });
  }),

  update: adminProcedure
    .input(practitionerInput.extend({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, treatmentIds, ...values } = input;
      await ctx.db.transaction(async (tx) => {
        await tx.update(practitioner).set(values).where(eq(practitioner.id, id));
        await tx.delete(practitionerTreatment).where(eq(practitionerTreatment.practitionerId, id));
        if (treatmentIds.length > 0) {
          await tx
            .insert(practitionerTreatment)
            .values(treatmentIds.map((treatmentId) => ({ practitionerId: id, treatmentId })));
        }
      });
    }),

  /** Replaces the Practitioner's whole Weekly Schedule. */
  setWeeklySchedule: adminProcedure
    .input(z.object({ id: z.uuid(), ranges: z.array(rangeInput).max(50) }))
    .mutation(async ({ ctx, input }) => {
      for (const day of [1, 2, 3, 4, 5, 6, 7]) {
        const sorted = input.ranges
          .filter((r) => r.weekday === day)
          .toSorted((a, b) => a.startMinute - b.startMinute);
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i]!.startMinute < sorted[i - 1]!.endMinute) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Ranges on the same day must not overlap" });
          }
        }
      }
      await ctx.db.transaction(async (tx) => {
        await tx.delete(scheduleRange).where(eq(scheduleRange.practitionerId, input.id));
        if (input.ranges.length > 0) {
          await tx
            .insert(scheduleRange)
            .values(input.ranges.map((r) => ({ ...r, practitionerId: input.id })));
        }
      });
    }),

  setArchived: adminProcedure.input(archive).mutation(async ({ ctx, input }) => {
    await ctx.db
      .update(practitioner)
      .set({ archivedAt: input.archived ? ctx.now() : null })
      .where(eq(practitioner.id, input.id));
  }),
});

export const timeOffRouter = router({
  /** Upcoming and current Time Off; for one Practitioner it includes Clinic-wide closures. */
  list: adminProcedure.input(z.object({ practitionerId: z.uuid().nullable() })).query(({ ctx, input }) =>
    ctx.db
      .select({ timeOff, practitioner: { nameKa: practitioner.nameKa } })
      .from(timeOff)
      .leftJoin(practitioner, eq(practitioner.id, timeOff.practitionerId))
      .where(
        and(
          gt(timeOff.endsAt, ctx.now()),
          input.practitionerId
            ? or(eq(timeOff.practitionerId, input.practitionerId), isNull(timeOff.practitionerId))
            : undefined,
        ),
      )
      .orderBy(asc(timeOff.startsAt)),
  ),

  create: adminProcedure
    .input(
      z
        .object({
          practitionerId: z.uuid().nullable(),
          startsAt: z.date(),
          endsAt: z.date(),
          note: z.string().trim().max(500).nullable(),
        })
        .refine((v) => v.startsAt < v.endsAt, "Time Off must end after it starts"),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(timeOff).values({ ...input, createdByAdminId: ctx.admin.id });
    }),

  delete: adminProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(timeOff).where(eq(timeOff.id, input.id));
  }),
});

export const attentionRouter = router({
  list: adminProcedure
    .input(z.object({ practitionerId: z.uuid().optional() }).optional())
    .query(({ ctx, input }) => appointmentsNeedingAttention(ctx.db, ctx.now(), input?.practitionerId)),
});
