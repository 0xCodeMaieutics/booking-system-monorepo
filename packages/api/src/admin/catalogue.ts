import { TRPCError } from "@trpc/server";
import { appointmentsNeedingAttention } from "@tsami/booking";
import { type DbOrTx, and, asc, eq, gt, inArray, isNull, or, schema } from "@tsami/db";
import { z } from "zod";

import { deletePhotos, isPendingPhotoKey, savedPhotoKey } from "./photos";
import { type PhotoStore, adminProcedure, router } from "./trpc";

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

/** Throws unless the Practitioner belongs to the Clinic, so its Weekly Schedule and Treatments are safe to touch. */
async function assertOwnPractitioner(db: DbOrTx, clinicId: string, practitionerId: string) {
  const [row] = await db
    .select({ id: practitioner.id })
    .from(practitioner)
    .where(and(eq(practitioner.id, practitionerId), eq(practitioner.clinicId, clinicId)));
  if (!row) throw new TRPCError({ code: "NOT_FOUND" });
}

async function assertOwnTreatments(db: DbOrTx, clinicId: string, treatmentIds: string[]) {
  if (treatmentIds.length === 0) return;
  const rows = await db
    .select({ id: treatment.id })
    .from(treatment)
    .where(and(inArray(treatment.id, treatmentIds), eq(treatment.clinicId, clinicId)));
  if (rows.length !== new Set(treatmentIds).size) throw new TRPCError({ code: "NOT_FOUND" });
}

export const treatmentsRouter = router({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db
      .select()
      .from(treatment)
      .where(eq(treatment.clinicId, ctx.admin.clinicId))
      .orderBy(asc(treatment.sortOrder), asc(treatment.nameEn)),
  ),
  create: adminProcedure.input(treatmentInput).mutation(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .insert(treatment)
      .values({ ...input, clinicId: ctx.admin.clinicId })
      .returning();
    return row!;
  }),
  update: adminProcedure.input(treatmentInput.extend({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    const { id, ...values } = input;
    await ctx.db
      .update(treatment)
      .set(values)
      .where(and(eq(treatment.id, id), eq(treatment.clinicId, ctx.admin.clinicId)));
  }),
  setArchived: adminProcedure.input(archive).mutation(async ({ ctx, input }) => {
    await ctx.db
      .update(treatment)
      .set({ archivedAt: input.archived ? ctx.now() : null })
      .where(and(eq(treatment.id, input.id), eq(treatment.clinicId, ctx.admin.clinicId)));
  }),
});

const photoUrl = (photos: PhotoStore, key: string | null) => (key ? photos.publicUrl(key) : null);

export const practitionersRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    const [rows, links] = await Promise.all([
      ctx.db
        .select()
        .from(practitioner)
        .where(eq(practitioner.clinicId, ctx.admin.clinicId))
        .orderBy(asc(practitioner.sortOrder), asc(practitioner.nameEn)),
      ctx.db
        .select({
          practitionerId: practitionerTreatment.practitionerId,
          treatmentId: practitionerTreatment.treatmentId,
        })
        .from(practitionerTreatment)
        .innerJoin(practitioner, eq(practitioner.id, practitionerTreatment.practitionerId))
        .where(eq(practitioner.clinicId, ctx.admin.clinicId)),
    ]);
    return rows.map((p) => ({
      ...p,
      photoUrl: photoUrl(ctx.photos, p.photoKey),
      treatmentIds: links.filter((l) => l.practitionerId === p.id).map((l) => l.treatmentId),
    }));
  }),

  get: adminProcedure.input(z.object({ id: z.uuid() })).query(async ({ ctx, input }) => {
    const [p] = await ctx.db
      .select()
      .from(practitioner)
      .where(and(eq(practitioner.id, input.id), eq(practitioner.clinicId, ctx.admin.clinicId)));
    if (!p) throw new TRPCError({ code: "NOT_FOUND" });
    const [links, ranges] = await Promise.all([
      ctx.db.select().from(practitionerTreatment).where(eq(practitionerTreatment.practitionerId, p.id)),
      ctx.db
        .select()
        .from(scheduleRange)
        .where(eq(scheduleRange.practitionerId, p.id))
        .orderBy(asc(scheduleRange.weekday), asc(scheduleRange.startMinute)),
    ]);
    return {
      ...p,
      photoUrl: photoUrl(ctx.photos, p.photoKey),
      treatmentIds: links.map((l) => l.treatmentId),
      ranges,
    };
  }),

  create: adminProcedure.input(practitionerInput).mutation(async ({ ctx, input }) => {
    const { treatmentIds, ...values } = input;
    await assertOwnTreatments(ctx.db, ctx.admin.clinicId, treatmentIds);
    return ctx.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(practitioner)
        .values({ ...values, clinicId: ctx.admin.clinicId })
        .returning();
      if (treatmentIds.length > 0) {
        await tx
          .insert(practitionerTreatment)
          .values(treatmentIds.map((treatmentId) => ({ practitionerId: row!.id, treatmentId })));
      }
      return row!;
    });
  }),

  /**
   * `photoKey` is the current key to keep it, a `pending/` key from an upload to replace it,
   * or null to remove it. Replaced and removed photos are deleted from storage.
   */
  update: adminProcedure
    .input(practitionerInput.extend({ id: z.uuid(), photoKey: z.string().max(200).nullable() }))
    .mutation(async ({ ctx, input }) => {
      const { id, treatmentIds, photoKey: requestedPhotoKey, ...values } = input;
      const [current] = await ctx.db
        .select({ photoKey: practitioner.photoKey })
        .from(practitioner)
        .where(and(eq(practitioner.id, id), eq(practitioner.clinicId, ctx.admin.clinicId)));
      if (!current) throw new TRPCError({ code: "NOT_FOUND" });
      await assertOwnTreatments(ctx.db, ctx.admin.clinicId, treatmentIds);

      let photoKey = requestedPhotoKey;
      if (photoKey && photoKey !== current.photoKey) {
        if (!isPendingPhotoKey(photoKey)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown photo" });
        }
        photoKey = savedPhotoKey(id, photoKey);
        await ctx.photos.copy(requestedPhotoKey!, photoKey);
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(practitioner)
          .set({ ...values, photoKey })
          .where(eq(practitioner.id, id));
        await tx.delete(practitionerTreatment).where(eq(practitionerTreatment.practitionerId, id));
        if (treatmentIds.length > 0) {
          await tx
            .insert(practitionerTreatment)
            .values(treatmentIds.map((treatmentId) => ({ practitionerId: id, treatmentId })));
        }
      });

      const unused = [
        photoKey !== requestedPhotoKey ? requestedPhotoKey : null,
        current.photoKey !== photoKey ? current.photoKey : null,
      ].filter((key) => key !== null);
      await deletePhotos(ctx.photos, unused);
      return { photoKey };
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
      await assertOwnPractitioner(ctx.db, ctx.admin.clinicId, input.id);
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
      .where(and(eq(practitioner.id, input.id), eq(practitioner.clinicId, ctx.admin.clinicId)));
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
          eq(timeOff.clinicId, ctx.admin.clinicId),
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
      if (input.practitionerId) await assertOwnPractitioner(ctx.db, ctx.admin.clinicId, input.practitionerId);
      await ctx.db
        .insert(timeOff)
        .values({ ...input, clinicId: ctx.admin.clinicId, createdByAdminId: ctx.admin.id });
    }),

  delete: adminProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    await ctx.db
      .delete(timeOff)
      .where(and(eq(timeOff.id, input.id), eq(timeOff.clinicId, ctx.admin.clinicId)));
  }),
});

export const attentionRouter = router({
  list: adminProcedure
    .input(z.object({ practitionerId: z.uuid().optional() }).optional())
    .query(({ ctx, input }) =>
      appointmentsNeedingAttention(ctx.db, ctx.admin.clinicId, ctx.now(), input?.practitionerId),
    ),
});
