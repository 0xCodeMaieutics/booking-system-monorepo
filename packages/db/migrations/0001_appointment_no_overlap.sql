-- See docs/adr/0001-database-guards-against-double-booking.md
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_no_overlap"
  EXCLUDE USING gist (
    "practitioner_id" WITH =,
    tstzrange("starts_at", "ends_at", '[)') WITH &&
  )
  WHERE ("status" = 'booked');
--> statement-breakpoint
INSERT INTO "clinic_settings" ("id") VALUES (1) ON CONFLICT DO NOTHING;
