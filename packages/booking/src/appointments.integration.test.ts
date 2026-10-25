import { type Db, createDb, eq, like, schema } from "@tsami/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cancelByPatient, createAppointment } from "./appointments";
import { findAvailableSlots } from "./availability";
import { addDays, localInstant, toLocalDate, weekdayOf } from "./time";
import { checkVerificationCode, requestVerificationCode } from "./verification";

// Runs against a migrated, empty database: TEST_DATABASE_URL=postgres://… pnpm test
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("Appointments against Postgres", () => {
  let db: Db;
  let treatmentId: string;
  let annaId: string;
  let ninoId: string;
  const now = new Date();
  // Next Monday, so the Booking Window and Weekly Schedule both allow it.
  let day = addDays(toLocalDate(now), 3);
  while (weekdayOf(day) !== 1) day = addDays(day, 1);
  const tenAm = localInstant(day, 10 * 60);

  beforeAll(async () => {
    db = createDb(url);
    // Verification rate limits count rows per phone, so earlier runs would lock these numbers out.
    await db.delete(schema.phoneVerification).where(like(schema.phoneVerification.phone, "+99559900000%"));
    const [t] = await db
      .insert(schema.treatment)
      .values({ nameKa: "ტესტი", nameEn: `Test ${Date.now()}`, durationMinutes: 30 })
      .returning();
    const [anna, nino] = await db
      .insert(schema.practitioner)
      .values([
        { nameKa: "ანა", nameEn: "Anna", sortOrder: 0 },
        { nameKa: "ნინო", nameEn: "Nino", sortOrder: 1 },
      ])
      .returning();
    treatmentId = t!.id;
    annaId = anna!.id;
    ninoId = nino!.id;
    await db.insert(schema.practitionerTreatment).values([
      { practitionerId: annaId, treatmentId },
      { practitionerId: ninoId, treatmentId },
    ]);
    await db.insert(schema.scheduleRange).values([
      { practitionerId: annaId, weekday: 1, startMinute: 9 * 60, endMinute: 13 * 60 },
      { practitionerId: ninoId, weekday: 1, startMinute: 9 * 60, endMinute: 13 * 60 },
    ]);
  });

  afterAll(async () => {
    await db.delete(schema.appointment).where(eq(schema.appointment.treatmentId, treatmentId));
    await db.delete(schema.practitioner).where(eq(schema.practitioner.id, annaId));
    await db.delete(schema.practitioner).where(eq(schema.practitioner.id, ninoId));
    await db.delete(schema.treatment).where(eq(schema.treatment.id, treatmentId));
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

  const book = async (phone: string, practitionerId: string | null) =>
    createAppointment(db, {
      actor: { kind: "patient" },
      treatmentId,
      practitionerId,
      startsAt: tenAm,
      patient: { phone, fullName: "Test Patient" },
      locale: "ka",
      now,
      verificationId: await verifiedPhone(phone),
    });

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
    const freeAtTen = async () => {
      const { slots } = await findAvailableSlots(db, {
        treatmentId,
        practitionerId: annaId,
        from: day,
        to: day,
        actor: { kind: "patient" },
        now,
      });
      return slots.some((s) => s.startsAt.getTime() === tenAm.getTime());
    };
    expect(await freeAtTen()).toBe(false);

    const [annas] = await db
      .select({ patientId: schema.appointment.patientId })
      .from(schema.appointment)
      .where(eq(schema.appointment.practitionerId, annaId));
    const [owner] = await db.select().from(schema.patient).where(eq(schema.patient.id, annas!.patientId));
    // Manage tokens are only stored hashed, so book a fresh one to get a token.
    await db.delete(schema.appointment).where(eq(schema.appointment.practitionerId, annaId));
    const { manageToken } = await book(owner!.phone.slice(4), annaId);

    await cancelByPatient(db, manageToken, now);
    expect(await freeAtTen()).toBe(true);
  });
});
