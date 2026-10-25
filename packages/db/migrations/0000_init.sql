CREATE TYPE "public"."appointment_status" AS ENUM('booked', 'cancelled', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."cancelled_by" AS ENUM('patient', 'clinic');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('ka', 'en');--> statement-breakpoint
CREATE TABLE "admin" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"deactivated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "admin_account" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_session" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "appointment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"practitioner_id" uuid NOT NULL,
	"treatment_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'booked' NOT NULL,
	"locale" "locale" DEFAULT 'ka' NOT NULL,
	"note" text,
	"cancelled_by" "cancelled_by",
	"cancellation_reason" text,
	"created_by_admin_id" text,
	"status_changed_by_admin_id" text,
	"status_changed_at" timestamp with time zone,
	"manage_token_hash" text NOT NULL,
	"reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointment_manageTokenHash_unique" UNIQUE("manage_token_hash"),
	CONSTRAINT "appointment_bounds" CHECK ("appointment"."starts_at" < "appointment"."ends_at")
);
--> statement-breakpoint
CREATE TABLE "auth_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinic_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"min_notice_minutes" integer DEFAULT 120 NOT NULL,
	"booking_window_days" integer DEFAULT 60 NOT NULL,
	"cancellation_cutoff_hours" integer DEFAULT 24 NOT NULL,
	"clinic_phone" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clinic_settings_singleton" CHECK ("clinic_settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "patient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patient_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "phone_verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"code_hash" text NOT NULL,
	"ip_address" text,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practitioner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ka" text NOT NULL,
	"name_en" text NOT NULL,
	"title_ka" text,
	"title_en" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practitioner_treatment" (
	"practitioner_id" uuid NOT NULL,
	"treatment_id" uuid NOT NULL,
	CONSTRAINT "practitioner_treatment_practitioner_id_treatment_id_pk" PRIMARY KEY("practitioner_id","treatment_id")
);
--> statement-breakpoint
CREATE TABLE "schedule_range" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"practitioner_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"start_minute" smallint NOT NULL,
	"end_minute" smallint NOT NULL,
	CONSTRAINT "schedule_range_weekday" CHECK ("schedule_range"."weekday" between 1 and 7),
	CONSTRAINT "schedule_range_bounds" CHECK ("schedule_range"."start_minute" >= 0 and "schedule_range"."end_minute" <= 1440 and "schedule_range"."start_minute" < "schedule_range"."end_minute")
);
--> statement-breakpoint
CREATE TABLE "time_off" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"practitioner_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"note" text,
	"created_by_admin_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "time_off_bounds" CHECK ("time_off"."starts_at" < "time_off"."ends_at")
);
--> statement-breakpoint
CREATE TABLE "treatment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ka" text NOT NULL,
	"name_en" text NOT NULL,
	"description_ka" text,
	"description_en" text,
	"duration_minutes" integer NOT NULL,
	"price_from_gel" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "treatment_duration_positive" CHECK ("treatment"."duration_minutes" > 0)
);
--> statement-breakpoint
ALTER TABLE "admin_account" ADD CONSTRAINT "admin_account_admin_id_admin_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_session" ADD CONSTRAINT "admin_session_admin_id_admin_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_practitioner_id_practitioner_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."practitioner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_treatment_id_treatment_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_created_by_admin_id_admin_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_status_changed_by_admin_id_admin_id_fk" FOREIGN KEY ("status_changed_by_admin_id") REFERENCES "public"."admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practitioner_treatment" ADD CONSTRAINT "practitioner_treatment_practitioner_id_practitioner_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."practitioner"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practitioner_treatment" ADD CONSTRAINT "practitioner_treatment_treatment_id_treatment_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_range" ADD CONSTRAINT "schedule_range_practitioner_id_practitioner_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."practitioner"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off" ADD CONSTRAINT "time_off_practitioner_id_practitioner_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."practitioner"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off" ADD CONSTRAINT "time_off_created_by_admin_id_admin_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_account_admin_id_index" ON "admin_account" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_session_admin_id_index" ON "admin_session" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "appointment_practitioner_id_starts_at_index" ON "appointment" USING btree ("practitioner_id","starts_at");--> statement-breakpoint
CREATE INDEX "appointment_patient_id_index" ON "appointment" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "appointment_starts_at_index" ON "appointment" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "phone_verification_phone_created_at_index" ON "phone_verification" USING btree ("phone","created_at");--> statement-breakpoint
CREATE INDEX "phone_verification_ip_address_created_at_index" ON "phone_verification" USING btree ("ip_address","created_at");--> statement-breakpoint
CREATE INDEX "schedule_range_practitioner_id_index" ON "schedule_range" USING btree ("practitioner_id");--> statement-breakpoint
CREATE INDEX "time_off_practitioner_id_starts_at_index" ON "time_off" USING btree ("practitioner_id","starts_at");