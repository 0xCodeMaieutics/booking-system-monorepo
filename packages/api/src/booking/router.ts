import { TRPCError } from "@trpc/server";
import {
  addDays,
  appointmentSummary,
  canPatientCancel,
  cancelByPatient,
  checkVerificationCode,
  clinicName,
  createAppointment,
  findAvailableSlots,
  getAppointmentDetails,
  manageUrl,
  patientContact,
  patientMessages,
  practitionersForTreatment,
  reportMessageFailure,
  requestVerificationCode,
  toLocalDate,
} from "@tsami/booking";
import { and, asc, eq, isNull, schema } from "@tsami/db";
import { z } from "zod";

import { zChannel, zContact, zLocalDate, zLocale } from "../shared";
import {
  type BookingContext,
  clinicProcedure,
  createCallerFactory,
  openClinicProcedure,
  router,
} from "./trpc";

const { treatment } = schema;

export const bookingRouter = router({
  clinic: clinicProcedure.query(({ ctx: { clinic } }) => ({
    handle: clinic.handle,
    nameKa: clinic.nameKa,
    nameEn: clinic.nameEn,
    clinicPhone: clinic.phone,
    cancellationCutoffHours: clinic.cancellationCutoffHours,
    bookingWindowDays: clinic.bookingWindowDays,
    closed: clinic.closedAt !== null,
  })),

  treatments: clinicProcedure.query(({ ctx }) =>
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
      .where(and(eq(treatment.clinicId, ctx.clinic.id), isNull(treatment.archivedAt)))
      .orderBy(asc(treatment.sortOrder), asc(treatment.nameEn)),
  ),

  /** Practitioners who perform the Treatment and have at least one Available Slot. */
  practitioners: openClinicProcedure
    .input(z.object({ treatmentId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const now = ctx.now();
      const today = toLocalDate(now);
      const { slots } = await findAvailableSlots(ctx.db, {
        clinic: ctx.clinic,
        treatmentId: input.treatmentId,
        from: today,
        to: addDays(today, 366),
        actor: { kind: "patient" },
        now,
      });
      const withSlots = new Set(slots.map((s) => s.practitionerId));
      const all = await practitionersForTreatment(ctx.db, ctx.clinic.id, input.treatmentId);
      return all
        .filter((p) => withSlots.has(p.id))
        .map(({ photoKey, ...p }) => ({ ...p, photoUrl: photoKey ? `${ctx.photosUrl}/${photoKey}` : null }));
    }),

  /** Available start times. Without a Practitioner, times are combined across everyone (Any Practitioner). */
  slots: openClinicProcedure
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
        clinic: ctx.clinic,
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

  requestCode: openClinicProcedure
    .input(z.object({ contact: zContact, locale: zLocale }))
    .mutation(async ({ ctx, input }) => {
      const { verificationId, contact, code } = await requestVerificationCode(ctx.db, {
        contact: input.contact,
        ipAddress: ctx.ipAddress,
        now: ctx.now(),
      });
      const name = clinicName(ctx.clinic, input.locale);
      try {
        await ctx.messenger.send(contact, patientMessages.verificationCode(name, code, input.locale));
      } catch (error) {
        await reportMessageFailure(ctx.alerts, {
          message: "verificationCode",
          clinicName: name,
          contact,
          error,
        });
        throw error;
      }
      return { verificationId };
    }),

  checkCode: openClinicProcedure
    .input(z.object({ verificationId: z.uuid(), contact: zContact, code: z.string().max(10) }))
    .mutation(async ({ ctx, input }) => {
      await checkVerificationCode(ctx.db, { ...input, now: ctx.now() });
      return { ok: true as const };
    }),

  book: openClinicProcedure
    .input(
      z.object({
        treatmentId: z.uuid(),
        practitionerId: z.uuid().nullable(),
        startsAt: z.date(),
        fullName: z.string().trim().min(2).max(120),
        channel: zChannel,
        phone: z.string().max(32),
        email: z.email().max(200).optional().or(z.literal("")),
        note: z.string().max(1000).optional(),
        locale: zLocale,
        verificationId: z.uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { appointment, manageToken } = await createAppointment(ctx.db, {
        clinic: ctx.clinic,
        actor: { kind: "patient" },
        treatmentId: input.treatmentId,
        practitionerId: input.practitionerId,
        startsAt: input.startsAt,
        patient: {
          channel: input.channel,
          phone: input.phone || null,
          email: input.email || null,
          fullName: input.fullName,
        },
        note: input.note,
        locale: input.locale,
        now: ctx.now(),
        verificationId: input.verificationId,
      });

      const details = await getAppointmentDetails(ctx.db, ctx.clinic.id, { id: appointment.id });
      if (!details) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const summary = appointmentSummary(details, input.locale);
      const url = manageUrl(ctx.siteUrl, ctx.clinic.handle, input.locale, manageToken);
      const contact = patientContact(details.patient);
      try {
        await ctx.messenger.send(contact, patientMessages.confirmation(summary, url, input.locale));
      } catch (error) {
        // The Appointment exists; a failed message must not make the Patient book twice.
        await reportMessageFailure(ctx.alerts, {
          message: "confirmation",
          clinicName: summary.clinicName,
          appointmentId: appointment.id,
          contact,
          error,
        });
      }
      return { manageToken, ...summary };
    }),

  appointment: clinicProcedure
    .input(z.object({ token: z.string().min(16) }))
    .query(async ({ ctx, input }) => {
      const details = await getAppointmentDetails(ctx.db, ctx.clinic.id, { manageToken: input.token });
      if (!details) throw new TRPCError({ code: "NOT_FOUND" });
      const { clinic } = ctx;
      const a = details.appointment;
      return {
        status: a.status,
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        treatment: { nameKa: details.treatment.nameKa, nameEn: details.treatment.nameEn },
        practitioner: { nameKa: details.practitioner.nameKa, nameEn: details.practitioner.nameEn },
        patientName: details.patient.fullName,
        canCancel: canPatientCancel(a, clinic.cancellationCutoffHours, ctx.now()),
        cancellationCutoffHours: clinic.cancellationCutoffHours,
        clinicPhone: clinic.phone,
      };
    }),

  cancel: clinicProcedure.input(z.object({ token: z.string().min(16) })).mutation(async ({ ctx, input }) => {
    await cancelByPatient(ctx.db, ctx.clinic, input.token, ctx.now());
    return { ok: true as const };
  }),
});

export type BookingRouter = typeof bookingRouter;
export type { BookingContext };
export const createBookingCaller = createCallerFactory(bookingRouter);
