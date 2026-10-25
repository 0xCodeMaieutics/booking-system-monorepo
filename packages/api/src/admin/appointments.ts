import {
  type Appointment,
  createAppointment,
  findAvailableSlots,
  getAppointmentDetails,
  getClinicSettings,
  localInstant,
  addDays,
  moveAppointment,
  setStatusByAdmin,
  smsText,
} from "@face/booking";
import { and, asc, desc, eq, gte, ilike, lt, or, schema } from "@face/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { zLocalDate, zLocale } from "../shared";
import { type AdminContext, adminProcedure, router } from "./trpc";

const { admin, appointment, patient, practitioner, treatment } = schema;

async function notifyPatient(
  ctx: AdminContext,
  a: Appointment,
  message: "cancelledByClinic" | "moved" | "confirmation",
  manageUrl?: string,
): Promise<boolean> {
  const details = await getAppointmentDetails(ctx.db, { id: a.id });
  if (!details) return false;
  const settings = await getClinicSettings(ctx.db);
  const locale = a.locale;
  const summary = {
    treatmentName: locale === "ka" ? details.treatment.nameKa : details.treatment.nameEn,
    practitionerName: locale === "ka" ? details.practitioner.nameKa : details.practitioner.nameEn,
    startsAt: a.startsAt,
  };
  try {
    const body =
      message === "confirmation"
        ? smsText.confirmation(summary, manageUrl ?? "", locale)
        : smsText[message](summary, settings.clinicPhone, locale);
    await ctx.sms.send(details.patient.phone, body);
    return true;
  } catch (error) {
    console.error(`SMS (${message}) for appointment ${a.id} failed`, error);
    return false;
  }
}

export const appointmentsRouter = router({
  /** All Appointments starting on a Clinic-local day. */
  day: adminProcedure.input(z.object({ date: zLocalDate })).query(({ ctx, input }) =>
    ctx.db
      .select({
        appointment,
        patient,
        practitioner: { id: practitioner.id, nameKa: practitioner.nameKa },
        treatment: { id: treatment.id, nameKa: treatment.nameKa },
        createdBy: { name: admin.name },
      })
      .from(appointment)
      .innerJoin(patient, eq(patient.id, appointment.patientId))
      .innerJoin(practitioner, eq(practitioner.id, appointment.practitionerId))
      .innerJoin(treatment, eq(treatment.id, appointment.treatmentId))
      .leftJoin(admin, eq(admin.id, appointment.createdByAdminId))
      .where(
        and(
          gte(appointment.startsAt, localInstant(input.date)),
          lt(appointment.startsAt, localInstant(addDays(input.date, 1))),
        ),
      )
      .orderBy(asc(appointment.startsAt), asc(practitioner.sortOrder)),
  ),

  /** Available Slots for Admins: no Booking Window, per Practitioner. */
  slots: adminProcedure
    .input(
      z.object({
        treatmentId: z.uuid(),
        practitionerId: z.uuid().nullable(),
        date: zLocalDate,
        excludeAppointmentId: z.uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { slots } = await findAvailableSlots(ctx.db, {
        treatmentId: input.treatmentId,
        practitionerId: input.practitionerId ?? undefined,
        from: input.date,
        to: input.date,
        actor: { kind: "admin", adminId: ctx.admin.id },
        now: ctx.now(),
        excludeAppointmentId: input.excludeAppointmentId,
      });
      return slots;
    }),

  create: adminProcedure
    .input(
      z.object({
        treatmentId: z.uuid(),
        practitionerId: z.uuid().nullable(),
        startsAt: z.date(),
        fullName: z.string().trim().min(2).max(120),
        phone: z.string(),
        email: z.email().optional().or(z.literal("")),
        note: z.string().max(1000).optional(),
        locale: zLocale,
        override: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { appointment: created, manageToken } = await createAppointment(ctx.db, {
        actor: { kind: "admin", adminId: ctx.admin.id },
        treatmentId: input.treatmentId,
        practitionerId: input.practitionerId,
        startsAt: input.startsAt,
        patient: { phone: input.phone, fullName: input.fullName, email: input.email || null },
        note: input.note,
        locale: input.locale,
        now: ctx.now(),
        override: input.override,
      });
      const manageUrl = `${ctx.bookingSiteUrl}${created.locale === "en" ? "/en" : ""}/a/${manageToken}`;
      // Appointments recorded after the fact (walk-ins) don't need a confirmation.
      const smsSent =
        created.startsAt > ctx.now() ? await notifyPatient(ctx, created, "confirmation", manageUrl) : false;
      return { ...created, smsSent };
    }),

  move: adminProcedure
    .input(
      z.object({
        id: z.uuid(),
        practitionerId: z.uuid(),
        startsAt: z.date(),
        override: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const moved = await moveAppointment(ctx.db, {
        appointmentId: input.id,
        practitionerId: input.practitionerId,
        startsAt: input.startsAt,
        adminId: ctx.admin.id,
        override: input.override,
        now: ctx.now(),
      });
      return { smsSent: await notifyPatient(ctx, moved, "moved") };
    }),

  setStatus: adminProcedure
    .input(
      z.object({
        id: z.uuid(),
        status: z.enum(["booked", "cancelled", "completed", "no_show"]),
        reason: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await setStatusByAdmin(ctx.db, {
        appointmentId: input.id,
        status: input.status,
        adminId: ctx.admin.id,
        reason: input.reason,
        now: ctx.now(),
      });
      const smsSent =
        input.status === "cancelled" && updated.startsAt > ctx.now()
          ? await notifyPatient(ctx, updated, "cancelledByClinic")
          : false;
      return { smsSent };
    }),
});

export const patientsRouter = router({
  search: adminProcedure.input(z.object({ q: z.string().trim().min(2).max(100) })).query(({ ctx, input }) => {
    const digits = input.q.replace(/\D/g, "");
    return ctx.db
      .select()
      .from(patient)
      .where(
        or(
          ilike(patient.fullName, `%${input.q}%`),
          digits.length >= 3 ? ilike(patient.phone, `%${digits}%`) : undefined,
        ),
      )
      .orderBy(asc(patient.fullName))
      .limit(20);
  }),

  get: adminProcedure.input(z.object({ id: z.uuid() })).query(async ({ ctx, input }) => {
    const [p] = await ctx.db.select().from(patient).where(eq(patient.id, input.id));
    if (!p) throw new TRPCError({ code: "NOT_FOUND" });
    const history = await ctx.db
      .select({
        appointment,
        practitioner: { nameKa: practitioner.nameKa },
        treatment: { nameKa: treatment.nameKa },
      })
      .from(appointment)
      .innerJoin(practitioner, eq(practitioner.id, appointment.practitionerId))
      .innerJoin(treatment, eq(treatment.id, appointment.treatmentId))
      .where(eq(appointment.patientId, p.id))
      .orderBy(desc(appointment.startsAt));
    return { ...p, history };
  }),

  update: adminProcedure
    .input(
      z.object({
        id: z.uuid(),
        fullName: z.string().trim().min(2).max(120),
        email: z.email().nullable().or(z.literal("")),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(patient)
        .set({ fullName: input.fullName, email: input.email || null })
        .where(eq(patient.id, input.id));
    }),
});
