import { type Db, createDb, eq, inArray, like, schema } from "@tsami/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cancelByPatient, createAppointment, getAppointmentDetails } from "./appointments";
import { findAvailableSlots } from "./availability";
import type { Clinic } from "./clinics";
import { addDays, localInstant, toLocalDate, weekdayOf } from "./time";
import { checkVerificationCode, requestVerificationCode } from "./verification";

// Runs against a migrated, empty database: TEST_DATABASE_URL=postgres://… pnpm test
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("Appointments against Postgres", () => {
  let db: Db;
  let clinic: Clinic;
  let otherClinic: Clinic;
  let treatmentId: string;
  let otherTreatmentId: string;
  let annaId: string;
  let ninoId: string;
  let otherPractitionerId: string;
  const now = new Date();
  // Next Monday, so the Booking Window and Weekly Schedule both allow it.
  let day = addDays(toLocalDate(now), 3);
  while (weekdayOf(day) !== 1) day = addDays(day, 1);
  const tenAm = localInstant(day, 10 * 60);

  beforeAll(async () => {
    db = createDb(url);
    // Verification rate limits count rows per phone, so earlier runs would lock these numbers out.
    await db.delete(schema.phoneVerification).where(like(schema.phoneVerification.phone, "+99559900000%"));
    const suffix = Date.now();
    [clinic, otherClinic] = (await db
      .insert(schema.clinic)
      .values([
        { handle: `test-${suffix}`, nameKa: "ტესტი", nameEn: "Test" },
        { handle: `other-${suffix}`, nameKa: "სხვა", nameEn: "Other" },
      ])
      .returning()) as [Clinic, Clinic];

    const [t, other] = await db
      .insert(schema.treatment)
      .values([
        { clinicId: clinic.id, nameKa: "ტესტი", nameEn: "Test", durationMinutes: 30 },
        { clinicId: otherClinic.id, nameKa: "ტესტი", nameEn: "Test", durationMinutes: 30 },
      ])
      .returning();
    const [anna, nino, otherPractitioner] = await db
      .insert(schema.practitioner)
      .values([
        { clinicId: clinic.id, nameKa: "ანა", nameEn: "Anna", sortOrder: 0 },
        { clinicId: clinic.id, nameKa: "ნინო", nameEn: "Nino", sortOrder: 1 },
        { clinicId: otherClinic.id, nameKa: "ეკა", nameEn: "Eka", sortOrder: 0 },
      ])
      .returning();
    treatmentId = t!.id;
    otherTreatmentId = other!.id;
    annaId = anna!.id;
    ninoId = nino!.id;
    otherPractitionerId = otherPractitioner!.id;
    await db.insert(schema.practitionerTreatment).values([
      { practitionerId: annaId, treatmentId },
      { practitionerId: ninoId, treatmentId },
      { practitionerId: otherPractitionerId, treatmentId: otherTreatmentId },
    ]);
    await db.insert(schema.scheduleRange).values(
      [annaId, ninoId, otherPractitionerId].map((practitionerId) => ({
        practitionerId,
        weekday: 1,
        startMinute: 9 * 60,
        endMinute: 13 * 60,
      })),
    );
  });

  afterAll(async () => {
    const clinicIds = [clinic.id, otherClinic.id];
    await db.delete(schema.appointment).where(inArray(schema.appointment.clinicId, clinicIds));
    await db.delete(schema.patient).where(inArray(schema.patient.clinicId, clinicIds));
    await db.delete(schema.timeOff).where(inArray(schema.timeOff.clinicId, clinicIds));
    await db.delete(schema.practitioner).where(inArray(schema.practitioner.clinicId, clinicIds));
    await db.delete(schema.treatment).where(inArray(schema.treatment.clinicId, clinicIds));
    await db.delete(schema.clinic).where(inArray(schema.clinic.id, clinicIds));
    await db.$client.end();
  });

  async function verifiedPhone(phone: string) {
    const { verificationId, code } = await requestVerificationCode(db, { phone, ipAddress: null, now });
    await expect(checkVerificationCode(db, { verificationId, phone, code: "000000", now })).rejects.toThrow(
      "INVALID_CODE",
    );
    await checkVerificationCode(db, { verificationId, phone, code, now });
    return verificationId;
  }

  const book = async (
    phone: string,
    practitionerId: string | null,
    at: { clinic: Clinic; treatmentId: string } = { clinic, treatmentId },
  ) =>
    createAppointment(db, {
      clinic: at.clinic,
      actor: { kind: "patient" },
      treatmentId: at.treatmentId,
      practitionerId,
      startsAt: tenAm,
      patient: { phone, fullName: "Test Patient" },
      locale: "ka",
      now,
      verificationId: await verifiedPhone(phone),
    });

  const freeAtTen = async (at: Clinic, atTreatmentId: string, practitionerId: string) => {
    const { slots } = await findAvailableSlots(db, {
      clinic: at,
      treatmentId: atTreatmentId,
      practitionerId,
      from: day,
      to: day,
      actor: { kind: "patient" },
      now,
    });
    return slots.some((s) => s.startsAt.getTime() === tenAm.getTime());
  };

  it("lets exactly one of two simultaneous Bookings for the same Practitioner succeed", async () => {
    const results = await Promise.allSettled([book("599000001", annaId), book("599000002", annaId)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
  });

  it("assigns Any Practitioner to whoever is still free", async () => {
    const { appointment } = await book("599000003", null);
    expect(appointment.practitionerId).toBe(ninoId);
    await expect(book("599000004", null)).rejects.toMatchObject({ code: "SLOT_UNAVAILABLE" });
  });

  it("frees the time when a Patient cancels", async () => {
    expect(await freeAtTen(clinic, treatmentId, annaId)).toBe(false);

    const [annas] = await db
      .select({ patientId: schema.appointment.patientId })
      .from(schema.appointment)
      .where(eq(schema.appointment.practitionerId, annaId));
    const [owner] = await db.select().from(schema.patient).where(eq(schema.patient.id, annas!.patientId));
    // Manage tokens are only stored hashed, so book a fresh one to get a token.
    await db.delete(schema.appointment).where(eq(schema.appointment.practitionerId, annaId));
    const { manageToken } = await book(owner!.phone.slice(4), annaId);

    await cancelByPatient(db, clinic, manageToken, now);
    expect(await freeAtTen(clinic, treatmentId, annaId)).toBe(true);
  });

  it("keeps Clinics apart", async () => {
    // Another Clinic's Treatment can't be booked here.
    await expect(
      book("599000005", otherPractitionerId, { clinic, treatmentId: otherTreatmentId }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    // The same phone at another Clinic is another Patient.
    const { appointment, manageToken } = await book("599000003", otherPractitionerId, {
      clinic: otherClinic,
      treatmentId: otherTreatmentId,
    });
    const patients = await db
      .select({ clinicId: schema.patient.clinicId })
      .from(schema.patient)
      .where(eq(schema.patient.phone, "+995599000003"));
    expect(patients.map((p) => p.clinicId).toSorted()).toEqual([clinic.id, otherClinic.id].toSorted());

    // A Manage Link only works under its own Clinic.
    expect(await getAppointmentDetails(db, clinic.id, { manageToken })).toBeNull();
    await expect(cancelByPatient(db, clinic, manageToken, now)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await getAppointmentDetails(db, otherClinic.id, { manageToken }))?.appointment.id).toBe(
      appointment.id,
    );

    // A Clinic-wide closure only closes its own Clinic.
    await db.insert(schema.timeOff).values({
      clinicId: otherClinic.id,
      practitionerId: null,
      startsAt: localInstant(day),
      endsAt: localInstant(addDays(day, 1)),
    });
    expect(await freeAtTen(clinic, treatmentId, annaId)).toBe(true);
  });
});
