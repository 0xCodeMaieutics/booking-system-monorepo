# Tsami

Tsami, an Appointment Booking product for clinics in Georgia, and the Landing Page of its first Clinic, Face Aesthetic Centre in Kutaisi.

## Language

### The product

**Tsami**:
The Appointment Booking product (წამი): the Booking Site and Admin Dashboard. It has its own name and styling, separate from any Clinic's brand, and serves clinics in Georgia only. Patients meet the Clinic's name first (on the Booking Site and in every SMS), with Tsami in the background; Admins meet Tsami first.
_Avoid_: The booking system, the platform, the app

### The Clinic and its people

**Clinic**:
Face Aesthetic Centre (ესთეტიკის ცენტრი ფეისი) — the business and physical location at Tamar Mepe #38, Kutaisi. The Clinic's brand is what Patients recognise; it is Tsami's first customer.
_Avoid_: Salon, studio, centre (on its own), practice

**Practitioner**:
A qualified person who performs one or more Treatments at the Clinic, according to a Weekly Schedule. Dr. Khatuna Robakidze is the lead Practitioner.
_Avoid_: Doctor (as a role name), specialist, staff, provider

**Patient**:
A person who receives, or wants to receive, Treatments at the Clinic. A Patient has no account and is identified by their mobile number.
_Avoid_: Client, customer, user, guest

**Admin**:
A person who signs in to manage the Clinic's Practitioners, Treatments and Appointments. Admins are invited by other Admins and are deactivated, never deleted. Practitioners are not Admins and have no sign-in.
_Avoid_: User, staff, manager

### What the Clinic offers

**Treatment**:
A named aesthetic procedure the Clinic offers to patients, such as dermal fillers or a chemical peel. Each Treatment has one fixed duration, the same whichever Practitioner performs it, and may show an indicative price.
_Avoid_: Service, procedure, product

**Archived**:
A Practitioner or Treatment that can no longer be booked but is kept so past Appointments still show it.
_Avoid_: Deleted, inactive, disabled

### Scheduling

**Weekly Schedule**:
A Practitioner's repeating working hours: one or more time ranges per weekday, in Clinic-local time. A gap between ranges, such as lunch, is not bookable.
_Avoid_: Working hours, shifts, roster, availability

**Time Off**:
A period when a Practitioner is unavailable despite their Weekly Schedule, such as a holiday, sick day or Clinic closure.
_Avoid_: Absence, leave, exception, blocked time

**Available Slot**:
A start time at which a Practitioner can take a given Treatment: inside their Weekly Schedule, outside Time Off, clear of other Appointments, and within the Booking Window.
_Avoid_: Free slot, opening, availability, timeslot

**Booking Window**:
The span of time in which Patients may book: from the minimum notice (e.g. 2 hours ahead) to the furthest date (e.g. 60 days ahead). It applies to the whole Clinic, and Admins are not bound by it.
_Avoid_: Booking horizon, lead time, cutoff

### Appointments

**Appointment**:
A scheduled visit at which one Patient receives one Treatment from one Practitioner at a specific time. It keeps the duration it was booked with, even if the Treatment's duration later changes.
_Avoid_: Booking (as a noun), reservation, session

**Booking**:
The act of creating an Appointment, whether done by a Patient or by an Admin.
_Avoid_: Using "booking" for the Appointment itself

**Any Practitioner**:
A Patient's choice to book a Treatment without picking who performs it. A Practitioner is assigned at Booking time, so the Appointment always has exactly one Practitioner.
_Avoid_: No preference, first available, random

**Appointment status**:
An Appointment is **Booked** (holding its time), **Cancelled** (by the Patient or the Clinic; time freed), **Completed** or **No-show** (both set by an Admin after the time has passed).
_Avoid_: Pending, confirmed, done, missed

**Cancellation Cutoff**:
How close to an Appointment's start a Patient may still cancel it themselves (e.g. 24 hours). Later than that, only an Admin can cancel.
_Avoid_: Cancellation policy, deadline

**Manage Link**:
A private link, sent to the Patient with their confirmation, that lets them view or cancel one specific Appointment without signing in.
_Avoid_: Magic link, booking link, token

### Surfaces

**Landing Page**:
The Clinic's own public website, in the Clinic's brand, that introduces the Clinic and its Practitioners and directs visitors to the Booking Site. It is not part of Tsami.
_Avoid_: Homepage, site, website (when the landing page specifically is meant)

**Marketing Site**:
Tsami's public website, in Tsami's styling, that introduces Tsami to Clinics in Georgia and invites them to get in touch. It is not seen by Patients.
_Avoid_: Landing page (for Tsami's site), homepage, B2B site

**Booking Site**:
Tsami's public site where Patients make and manage Appointments with a Clinic, at booking.example.com. It is in Tsami's styling but headed by the Clinic's name. No sign-in.
_Avoid_: User booking interface, booking app, portal

**Admin Dashboard**:
Tsami's signed-in site where Admins manage Practitioners, Treatments, Weekly Schedules, Time Off and Appointments, at admin.example.com.
_Avoid_: Admin panel, back office, CMS

**Locale**:
One of the languages the Clinic's public content (Landing Page, Booking Site, Patient SMS) is published in: Georgian (`ka`) or English (`en`). The Admin Dashboard is Georgian only.
_Avoid_: Translation, language version
