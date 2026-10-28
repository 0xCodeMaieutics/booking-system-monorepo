# Patients are identified by a verified mobile number, not an account

Patients book without signing in. Their mobile number is the Patient's identity: it is verified with a one-time SMS code before an Appointment is created, and a returning number links to the existing Patient. We chose this over Patient accounts (too much friction for a single clinic) and over unverified Bookings confirmed by an Admin (manual work, and spam blocks real slots until someone checks). Because verification happens before the Appointment exists, there is no pending Appointment status. Patients manage an Appointment through a Manage Link rather than a "my bookings" area.

## Consequences

- Requires an SMS provider, with per-message cost, for verification codes, confirmations, reminders and Clinic cancellations.
- Two people sharing one phone number share one Patient record; Admins correct names by hand.
- Appointments created by Admins skip SMS verification.
- Patients without a Georgian mobile are verified by email instead, and identified by it (ADR 0009).
- Once Tsami served more than one Clinic, a Patient became per Clinic: a returning number links to the existing Patient at that Clinic only. Clinics are independent businesses, so one Clinic never sees another's Patients, names or history.
