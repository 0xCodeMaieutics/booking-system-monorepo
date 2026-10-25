import {
  addDays,
  canPatientCancel,
  cancelByPatient,
  checkVerificationCode,
  createAppointment,
  findAvailableSlots,
  getAppointmentDetails,
  getClinicSettings,
  practitionersForTreatment,
  requestVerificationCode,
  smsText,
  toLocalDate,
} from "@face/booking";
import { asc, isNull, schema } from "@face/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { zLocalDate, zLocale } from "../shared";
import { type BookingContext, createCallerFactory, publicProcedure, router } from "./trpc";

const { treatment } = schema;

function manageUrl(ctx: BookingContext, locale: "ka" | "en", token: string) {
  return `${ctx.siteUrl}${locale === "en" ? "/en" : ""}/a/${token}`;
}

export const bookingRouter = router({
  clinic: publicProcedure.query(async ({ ctx }) => {
    const settings = await getClinicSettings(ctx.db);
    return {
      clinicPhone: settings.clinicPhone,
      cancellationCutoffHours: settings.cancellationCutoffHours,
      bookingWindowDays: settings.bookingWindowDays,
    };
  }),

  treatments: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        id: treatment.id,
        nameKa: treatment.nameKa,
        nameEn: treatment.nameEn,
        descriptionKa: treatment.descriptionKa,
        descriptionEn: treatment.descriptionEn,
        durationMinutes: treatment.durationMinutes,
        priceFromGel: treatment.priceFromGel,
      })
      .from(treatment)
      .where(isNull(treatment.archivedAt))
      .orderBy(asc(treatment.sortOrder), asc(treatment.nameEn)),
  ),

  /** Practitioners who perform the Treatment and have at least one Available Slot. */
  practitioners: publicProcedure.input(z.object({ treatmentId: z.uuid() })).query(async ({ ctx, input }) => {
    const now = ctx.now();
    const today = toLocalDate(now);
    const { slots } = await findAvailableSlots(ctx.db, {
      treatmentId: input.treatmentId,
      from: today,
      to: addDays(today, 366),
      actor: { kind: "patient" },
      now,
    });
    const withSlots = new Set(slots.map((s) => s.practitionerId));
    const all = await practitionersForTreatment(ctx.db, input.treatmentId);
    return all.filter((p) => withSlots.has(p.id));
  }),

  /** Available start times. Without a Practitioner, times are combined across everyone (Any Practitioner). */
  slots: publicProcedure
    .input(
      z.object({
        treatmentId: z.uuid(),
        practitionerId: z.uuid().nullable(),
        from: zLocalDate,
        to: zLocalDate,
      }),
    )
    .query(async ({ ctx, input }) => {
      const { slots } = await findAvailableSlots(ctx.db, {
        treatmentId: input.treatmentId,
        practitionerId: input.practitionerId ?? undefined,
        from: input.from,
        to: input.to,
        actor: { kind: "patient" },
        now: ctx.now(),
      });
      const unique = new Map(slots.map((s) => [s.startsAt.getTime(), s.startsAt]));
      return [...unique.values()];
    }),

  requestCode: publicProcedure
    .input(z.object({ phone: z.string().min(5).max(32), locale: zLocale }))
    .mutation(async ({ ctx, input }) => {
      const { verificationId, phone, code } = await requestVerificationCode(ctx.db, {
        phone: input.phone,
        ipAddress: ctx.ipAddress,
        now: ctx.now(),
      });
      await ctx.sms.send(phone, smsText.verificationCode(code, input.locale));
      return { verificationId };
    }),

  checkCode: publicProcedure
    .input(z.object({ verificationId: z.uuid(), phone: z.string(), code: z.string().max(10) }))
    .mutation(async ({ ctx, input }) => {
      await checkVerificationCode(ctx.db, { ...input, now: ctx.now() });
      return { ok: true as const };
    }),

  book: publicProcedure
    .input(
      z.object({
        treatmentId: z.uuid(),
        practitionerId: z.uuid().nullable(),
        startsAt: z.date(),
        fullName: z.string().trim().min(2).max(120),
        phone: z.string(),
        email: z.email().max(200).optional().or(z.literal("")),
        note: z.string().max(1000).optional(),
        locale: zLocale,
        verificationId: z.uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { appointment, manageToken } = await createAppointment(ctx.db, {
        actor: { kind: "patient" },
        treatmentId: input.treatmentId,
        practitionerId: input.practitionerId,
        startsAt: input.startsAt,
        patient: { phone: input.phone, fullName: input.fullName, email: input.email || null },
        note: input.note,
        locale: input.locale,
        now: ctx.now(),
        verificationId: input.verificationId,
      });

      const details = await getAppointmentDetails(ctx.db, { id: appointment.id });
      if (!details) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const summary = {
        treatmentName: input.locale === "ka" ? details.treatment.nameKa : details.treatment.nameEn,
        practitionerName: input.locale === "ka" ? details.practitioner.nameKa : details.practitioner.nameEn,
        startsAt: appointment.startsAt,
      };
      const url = manageUrl(ctx, input.locale, manageToken);
      try {
        await ctx.sms.send(details.patient.phone, smsText.confirmation(summary, url, input.locale));
      } catch (error) {
        // The Appointment exists; a failed SMS must not make the Patient book twice.
        console.error(`Confirmation SMS for appointment ${appointment.id} failed`, error);
      }
      return { manageToken, ...summary };
    }),

  appointment: publicProcedure
    .input(z.object({ token: z.string().min(16) }))
    .query(async ({ ctx, input }) => {
      const details = await getAppointmentDetails(ctx.db, { manageToken: input.token });
      if (!details) throw new TRPCError({ code: "NOT_FOUND" });
      const settings = await getClinicSettings(ctx.db);
      const a = details.appointment;
      return {
        status: a.status,
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        treatment: { nameKa: details.treatment.nameKa, nameEn: details.treatment.nameEn },
        practitioner: { nameKa: details.practitioner.nameKa, nameEn: details.practitioner.nameEn },
        patientName: details.patient.fullName,
        canCancel: canPatientCancel(a, settings.cancellationCutoffHours, ctx.now()),
        cancellationCutoffHours: settings.cancellationCutoffHours,
        clinicPhone: settings.clinicPhone,
      };
    }),

  cancel: publicProcedure.input(z.object({ token: z.string().min(16) })).mutation(async ({ ctx, input }) => {
    await cancelByPatient(ctx.db, input.token, ctx.now());
    return { ok: true as const };
  }),
});

export type BookingRouter = typeof bookingRouter;
export type { BookingContext };
export const createBookingCaller = createCallerFactory(bookingRouter);
