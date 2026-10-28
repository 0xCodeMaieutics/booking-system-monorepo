// Development seed data: Face, the first Clinic. Durations, prices and the
// Practitioner "Anna" are placeholders for the Clinic to replace in the Admin Dashboard.
import { createDb } from "./index";
import * as s from "./schema";

const db = createDb();

const treatments = [
  { nameKa: "კონსულტაცია", nameEn: "Consultation", durationMinutes: 30, priceFromGel: null },
  { nameKa: "ბოტულინოთერაპია", nameEn: "Botulinum toxin", durationMinutes: 30, priceFromGel: 300 },
  {
    nameKa: "ფილერები და ტუჩების კონტურული პლასტიკა",
    nameEn: "Dermal fillers & lip contouring",
    durationMinutes: 45,
    priceFromGel: 450,
  },
  { nameKa: "ბიორევიტალიზაცია", nameEn: "Biorevitalization", durationMinutes: 45, priceFromGel: 350 },
  { nameKa: "მეზოთერაპია", nameEn: "Mesotherapy", durationMinutes: 45, priceFromGel: 200 },
  { nameKa: "პლაზმოლიფტინგი (PRP)", nameEn: "PRP (plasmolifting)", durationMinutes: 60, priceFromGel: 250 },
  { nameKa: "ქიმიური პილინგი", nameEn: "Chemical peels", durationMinutes: 45, priceFromGel: 150 },
  {
    nameKa: "სახის წმენდა და მოვლა",
    nameEn: "Facial cleansing & care",
    durationMinutes: 60,
    priceFromGel: 120,
  },
];

await db.transaction(async (tx) => {
  const existing = await tx.select({ id: s.clinic.id }).from(s.clinic).limit(1);
  if (existing.length > 0) {
    console.log("Database already has data; skipping seed.");
    return;
  }

  const [face] = await tx
    .insert(s.clinic)
    .values({
      handle: "face-kutaisi",
      nameKa: "ესთეტიკის ცენტრი ფეისი",
      nameEn: "Face Aesthetic Centre",
      phone: "+995599446450",
    })
    .returning();
  if (!face) throw new Error("Failed to insert the Clinic");

  const insertedTreatments = await tx
    .insert(s.treatment)
    .values(treatments.map((t, i) => ({ ...t, clinicId: face.id, sortOrder: i })))
    .returning();
  const byName = new Map(insertedTreatments.map((t) => [t.nameEn, t.id]));

  const [khatuna, anna] = await tx
    .insert(s.practitioner)
    .values([
      {
        clinicId: face.id,
        nameKa: "ხათუნა რობაქიძე",
        nameEn: "Khatuna Robakidze",
        titleKa: "ექიმი",
        titleEn: "Dr.",
        sortOrder: 0,
      },
      { clinicId: face.id, nameKa: "ანა", nameEn: "Anna", sortOrder: 1 },
    ])
    .returning();
  if (!khatuna || !anna) throw new Error("Failed to insert Practitioners");

  await tx
    .insert(s.practitionerTreatment)
    .values([
      ...insertedTreatments.map((t) => ({ practitionerId: khatuna.id, treatmentId: t.id })),
      { practitionerId: anna.id, treatmentId: byName.get("Botulinum toxin")! },
    ]);

  const weekdays = [1, 2, 3, 4, 5];
  await tx.insert(s.scheduleRange).values(
    [khatuna, anna].flatMap((p) =>
      weekdays.flatMap((weekday) => [
        { practitionerId: p.id, weekday, startMinute: 9 * 60, endMinute: 13 * 60 },
        { practitionerId: p.id, weekday, startMinute: 14 * 60, endMinute: 18 * 60 },
      ]),
    ),
  );

  console.log("Seeded Face (face-kutaisi) with Treatments, Practitioners and Weekly Schedules.");
});

await db.$client.end();
