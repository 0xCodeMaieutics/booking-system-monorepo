import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const locale = pgEnum("locale", ["ka", "en"]);

// Admins and their sessions. Shape is dictated by Better Auth.

export const admin = pgTable("admin", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  deactivatedAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

export const adminSession = pgTable(
  "admin_session",
  {
    id: text().primaryKey(),
    adminId: text()
      .notNull()
      .references(() => admin.id, { onDelete: "cascade" }),
    token: text().notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    ...timestamps,
  },
  (t) => [index().on(t.adminId)],
);

export const adminAccount = pgTable(
  "admin_account",
  {
    id: text().primaryKey(),
    adminId: text()
      .notNull()
      .references(() => admin.id, { onDelete: "cascade" }),
    accountId: text().notNull(),
    providerId: text().notNull(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    ...timestamps,
  },
  (t) => [index().on(t.adminId)],
);

export const authVerification = pgTable("auth_verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  ...timestamps,
});

// Catalogue

export const practitioner = pgTable("practitioner", {
  id: uuid().primaryKey().defaultRandom(),
  nameKa: text().notNull(),
  nameEn: text().notNull(),
  titleKa: text(),
  titleEn: text(),
  /** Object key of the Practitioner Photo in the photo bucket, e.g. `practitioners/<uuid>.webp`. */
  photoKey: text(),
  sortOrder: integer().notNull().default(0),
  archivedAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

export const treatment = pgTable(
  "treatment",
  {
    id: uuid().primaryKey().defaultRandom(),
    nameKa: text().notNull(),
    nameEn: text().notNull(),
    descriptionKa: text(),
    descriptionEn: text(),
    durationMinutes: integer().notNull(),
    priceFromGel: integer(),
    sortOrder: integer().notNull().default(0),
    archivedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [check("treatment_duration_positive", sql`${t.durationMinutes} > 0`)],
);

export const practitionerTreatment = pgTable(
  "practitioner_treatment",
  {
    practitionerId: uuid()
      .notNull()
      .references(() => practitioner.id, { onDelete: "cascade" }),
    treatmentId: uuid()
      .notNull()
      .references(() => treatment.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.practitionerId, t.treatmentId] })],
);

// Scheduling

/** One working range of a Weekly Schedule, in Clinic-local minutes from midnight. */
export const scheduleRange = pgTable(
  "schedule_range",
  {
    id: uuid().primaryKey().defaultRandom(),
    practitionerId: uuid()
      .notNull()
      .references(() => practitioner.id, { onDelete: "cascade" }),
    /** ISO weekday: 1 = Monday … 7 = Sunday. */
    weekday: smallint().notNull(),
    startMinute: smallint().notNull(),
    endMinute: smallint().notNull(),
  },
  (t) => [
    index().on(t.practitionerId),
    check("schedule_range_weekday", sql`${t.weekday} between 1 and 7`),
    check(
      "schedule_range_bounds",
      sql`${t.startMinute} >= 0 and ${t.endMinute} <= 1440 and ${t.startMinute} < ${t.endMinute}`,
    ),
  ],
);

/** A null practitionerId means the whole Clinic is closed. */
export const timeOff = pgTable(
  "time_off",
  {
    id: uuid().primaryKey().defaultRandom(),
    practitionerId: uuid().references(() => practitioner.id, { onDelete: "cascade" }),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }).notNull(),
    note: text(),
    createdByAdminId: text().references(() => admin.id),
    ...timestamps,
  },
  (t) => [
    index().on(t.practitionerId, t.startsAt),
    check("time_off_bounds", sql`${t.startsAt} < ${t.endsAt}`),
  ],
);

export const clinicSettings = pgTable(
  "clinic_settings",
  {
    id: smallint().primaryKey().default(1),
    minNoticeMinutes: integer().notNull().default(120),
    bookingWindowDays: integer().notNull().default(60),
    cancellationCutoffHours: integer().notNull().default(24),
    clinicPhone: text().notNull().default(""),
    ...timestamps,
  },
  (t) => [check("clinic_settings_singleton", sql`${t.id} = 1`)],
);

// Patients and Appointments

export const patient = pgTable("patient", {
  id: uuid().primaryKey().defaultRandom(),
  /** E.164, e.g. +995599123456. */
  phone: text().notNull().unique(),
  fullName: text().notNull(),
  email: text(),
  ...timestamps,
});

export const appointmentStatus = pgEnum("appointment_status", [
  "booked",
  "cancelled",
  "completed",
  "no_show",
]);

export const cancelledBy = pgEnum("cancelled_by", ["patient", "clinic"]);

/**
 * Overlapping Booked Appointments for one Practitioner are rejected by the
 * `appointment_no_overlap` exclusion constraint (see docs/adr/0001).
 */
export const appointment = pgTable(
  "appointment",
  {
    id: uuid().primaryKey().defaultRandom(),
    patientId: uuid()
      .notNull()
      .references(() => patient.id),
    practitionerId: uuid()
      .notNull()
      .references(() => practitioner.id),
    treatmentId: uuid()
      .notNull()
      .references(() => treatment.id),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }).notNull(),
    status: appointmentStatus().notNull().default("booked"),
    locale: locale().notNull().default("ka"),
    note: text(),
    cancelledBy: cancelledBy(),
    cancellationReason: text(),
    /** Null when the Patient booked it themselves. */
    createdByAdminId: text().references(() => admin.id),
    /** Null when the Patient changed it, or it was never changed. */
    statusChangedByAdminId: text().references(() => admin.id),
    statusChangedAt: timestamp({ withTimezone: true }),
    manageTokenHash: text().notNull().unique(),
    reminderSentAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index().on(t.practitionerId, t.startsAt),
    index().on(t.patientId),
    index().on(t.startsAt),
    check("appointment_bounds", sql`${t.startsAt} < ${t.endsAt}`),
  ],
);

export const phoneVerification = pgTable(
  "phone_verification",
  {
    id: uuid().primaryKey().defaultRandom(),
    phone: text().notNull(),
    codeHash: text().notNull(),
    ipAddress: text(),
    attempts: smallint().notNull().default(0),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    /** Set once the Patient enters the right code. */
    verifiedAt: timestamp({ withTimezone: true }),
    /** Set when an Appointment is created with this verification. */
    consumedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.phone, t.createdAt), index().on(t.ipAddress, t.createdAt)],
);
