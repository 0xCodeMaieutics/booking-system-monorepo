import { type Db, type DbOrTx, and, eq, gte, isExclusionViolation, isNull, lt, schema, sql } from "@face/db";

import { type Actor, findAvailableSlots, getBookableTreatment } from "./availability";
import { BookingError } from "./errors";
import { normalizePhone } from "./phone";
import { getClinicSettings } from "./settings";
import { rankForAnyPractitioner } from "./slots";
import { addDays, localInstant, toLocalDate } from "./time";
import { createManageToken, sha256 } from "./tokens";
import { VERIFIED_FOR_MINUTES } from "./verification";

const { appointment, patient, phoneVerification, practitioner, treatment } = schema;

const NO_OVERLAP = "appointment_no_overlap";

export type Appointment = typeof appointment.$inferSelect;

export type CreateAppointmentInput = {
  actor: Actor;
  treatmentId: string;
  /** Null means Any Practitioner. */
  practitionerId: string | null;
  startsAt: Date;
  patient: { phone: string; fullName: string; email?: string | null };
  note?: string | null;
  locale: "ka" | "en";
  now: Date;
  /** Admins only: book outside Available Slots. Overlaps are still rejected. */
  override?: boolean;
  /** Patients only: a verification already checked with `checkVerificationCode`. */
  verificationId?: string;
};

export async function createAppointment(
  db: Db,
  input: CreateAppointmentInput,
): Promise<{ appointment: Appointment; manageToken: string }> {
  const t = await getBookableTreatment(db, input.treatmentId);
  const phone = normalizePhone(input.patient.phone);
  const override = input.actor.kind === "admin" && input.override === true;

  if (input.actor.kind === "patient" && !input.verificationId) {
    throw new BookingError("INVALID_CODE", "Phone verification is required");
  }

  let candidateIds: string[];
  if (override) {
    if (!input.practitionerId) throw new BookingError("SLOT_UNAVAILABLE", "Pick a Practitioner to override");
    const [p] = await db
      .select({ id: practitioner.id })
      .from(practitioner)
      .where(and(eq(practitioner.id, input.practitionerId), isNull(practitioner.archivedAt)));
    if (!p) throw new BookingError("NOT_FOUND", "Practitioner not found");
    candidateIds = [p.id];
  } else {
    const day = toLocalDate(input.startsAt);
    const { slots, practitioners } = await findAvailableSlots(db, {
      treatmentId: t.id,
      practitionerId: input.practitionerId ?? undefined,
      from: day,
      to: day,
      actor: input.actor,
      now: input.now,
    });
    const freeIds = new Set(
      slots.filter((s) => s.startsAt.getTime() === input.startsAt.getTime()).map((s) => s.practitionerId),
    );
    const free = practitioners.filter((p) => freeIds.has(p.id));
    if (free.length === 0) throw new BookingError("SLOT_UNAVAILABLE");
    candidateIds = rankForAnyPractitioner(free, await appointmentCountsOn(db, day)).map((p) => p.id);
  }

  const endsAt = new Date(input.startsAt.getTime() + t.durationMinutes * 60_000);
  const { token, hash } = createManageToken();
  const adminId = input.actor.kind === "admin" ? input.actor.adminId : null;

  const created = await db.transaction(async (tx) => {
    if (input.verificationId) await consumeVerification(tx, input.verificationId, phone, input.now);

    const [p] = await tx
      .insert(patient)
      .values({ phone, fullName: input.patient.fullName.trim(), email: input.patient.email || null })
      .onConflictDoUpdate({
        target: patient.phone,
        set: { email: sql`coalesce(excluded.email, ${patient.email})` },
      })
      .returning({ id: patient.id });
    if (!p) throw new Error("Patient upsert returned nothing");

    for (const practitionerId of candidateIds) {
      try {
        // oxlint-disable-next-line no-await-in-loop -- candidates are tried in rank order; the first that fits wins
        return await tx.transaction(async (sp) => {
          const [row] = await sp
            .insert(appointment)
            .values({
              patientId: p.id,
              practitionerId,
              treatmentId: t.id,
              startsAt: input.startsAt,
              endsAt,
              locale: input.locale,
              note: input.note || null,
              createdByAdminId: adminId,
              manageTokenHash: hash,
            })
            .returning();
          return row!;
        });
      } catch (error) {
        if (!isExclusionViolation(error, NO_OVERLAP)) throw error;
      }
    }
    throw new BookingError("SLOT_TAKEN");
  });

  return { appointment: created, manageToken: token };
}

async function appointmentCountsOn(db: DbOrTx, day: string): Promise<Map<string, number>> {
  const rows = await db
    .select({ practitionerId: appointment.practitionerId, count: sql<number>`count(*)::int` })
    .from(appointment)
    .where(
      and(
        eq(appointment.status, "booked"),
        gte(appointment.startsAt, localInstant(day)),
        lt(appointment.startsAt, localInstant(addDays(day, 1))),
      ),
    )
    .groupBy(appointment.practitionerId);
  return new Map(rows.map((r) => [r.practitionerId, r.count]));
}

async function consumeVerification(tx: DbOrTx, id: string, phone: string, now: Date) {
  const consumed = await tx
    .update(phoneVerification)
    .set({ consumedAt: now })
    .where(
      and(
        eq(phoneVerification.id, id),
        eq(phoneVerification.phone, phone),
        isNull(phoneVerification.consumedAt),
        gte(phoneVerification.verifiedAt, new Date(now.getTime() - VERIFIED_FOR_MINUTES * 60_000)),
      ),
    )
    .returning({ id: phoneVerification.id });
  if (consumed.length === 0) throw new BookingError("INVALID_CODE", "Verification is no longer valid");
}

/** Details needed to describe an Appointment to its Patient. */
export async function getAppointmentDetails(db: DbOrTx, where: { id: string } | { manageToken: string }) {
  const condition =
    "id" in where ? eq(appointment.id, where.id) : eq(appointment.manageTokenHash, sha256(where.manageToken));
  const [row] = await db
    .select({ appointment, patient, practitioner, treatment })
    .from(appointment)
    .innerJoin(patient, eq(patient.id, appointment.patientId))
    .innerJoin(practitioner, eq(practitioner.id, appointment.practitionerId))
    .innerJoin(treatment, eq(treatment.id, appointment.treatmentId))
    .where(condition);
  return row ?? null;
}

export function canPatientCancel(
  a: Pick<Appointment, "status" | "startsAt">,
  cutoffHours: number,
  now: Date,
) {
  return a.status === "booked" && a.startsAt.getTime() - now.getTime() >= cutoffHours * 3_600_000;
}

export async function cancelByPatient(db: Db, manageToken: string, now: Date): Promise<Appointment> {
  const details = await getAppointmentDetails(db, { manageToken });
  if (!details) throw new BookingError("NOT_FOUND");
  const settings = await getClinicSettings(db);
  if (details.appointment.status !== "booked") throw new BookingError("INVALID_STATE");
  if (!canPatientCancel(details.appointment, settings.cancellationCutoffHours, now)) {
    throw new BookingError("CUTOFF_PASSED");
  }
  const [row] = await db
    .update(appointment)
    .set({
      status: "cancelled",
      cancelledBy: "patient",
      statusChangedAt: now,
      statusChangedByAdminId: null,
    })
    .where(and(eq(appointment.id, details.appointment.id), eq(appointment.status, "booked")))
    .returning();
  if (!row) throw new BookingError("INVALID_STATE");
  return row;
}

export async function setStatusByAdmin(
  db: Db,
  input: {
    appointmentId: string;
    status: "cancelled" | "completed" | "no_show" | "booked";
    adminId: string;
    reason?: string | null;
    now: Date;
  },
): Promise<Appointment> {
  const [current] = await db.select().from(appointment).where(eq(appointment.id, input.appointmentId));
  if (!current) throw new BookingError("NOT_FOUND");
  if (current.status === input.status) return current;
  if ((input.status === "completed" || input.status === "no_show") && current.startsAt > input.now) {
    throw new BookingError("INVALID_STATE", "Only past Appointments can be marked Completed or No-show");
  }

  try {
    const [row] = await db
      .update(appointment)
      .set({
        status: input.status,
        cancelledBy: input.status === "cancelled" ? "clinic" : null,
        cancellationReason: input.status === "cancelled" ? input.reason || null : null,
        statusChangedAt: input.now,
        statusChangedByAdminId: input.adminId,
      })
      .where(eq(appointment.id, current.id))
      .returning();
    return row!;
  } catch (error) {
    // Restoring a Cancelled Appointment to Booked can collide with a newer one.
    if (isExclusionViolation(error, NO_OVERLAP)) throw new BookingError("SLOT_TAKEN");
    throw error;
  }
}

/** Moves an Appointment to a new time and/or Practitioner. It keeps its duration. */
export async function moveAppointment(
  db: Db,
  input: {
    appointmentId: string;
    practitionerId: string;
    startsAt: Date;
    adminId: string;
    override: boolean;
    now: Date;
  },
): Promise<Appointment> {
  const [current] = await db.select().from(appointment).where(eq(appointment.id, input.appointmentId));
  if (!current) throw new BookingError("NOT_FOUND");
  if (current.status !== "booked")
    throw new BookingError("INVALID_STATE", "Only Booked Appointments can move");

  if (!input.override) {
    const day = toLocalDate(input.startsAt);
    const { slots } = await findAvailableSlots(db, {
      treatmentId: current.treatmentId,
      practitionerId: input.practitionerId,
      from: day,
      to: day,
      actor: { kind: "admin", adminId: input.adminId },
      now: input.now,
      excludeAppointmentId: current.id,
    });
    if (!slots.some((s) => s.startsAt.getTime() === input.startsAt.getTime())) {
      throw new BookingError("SLOT_UNAVAILABLE");
    }
  }

  const duration = current.endsAt.getTime() - current.startsAt.getTime();
  try {
    const [row] = await db
      .update(appointment)
      .set({
        practitionerId: input.practitionerId,
        startsAt: input.startsAt,
        endsAt: new Date(input.startsAt.getTime() + duration),
        reminderSentAt: null,
        statusChangedAt: input.now,
        statusChangedByAdminId: input.adminId,
      })
      .where(eq(appointment.id, current.id))
      .returning();
    return row!;
  } catch (error) {
    if (isExclusionViolation(error, NO_OVERLAP)) throw new BookingError("SLOT_TAKEN");
    throw error;
  }
}
