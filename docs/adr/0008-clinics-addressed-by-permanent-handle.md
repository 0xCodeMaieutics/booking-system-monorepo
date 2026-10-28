# Clinics are addressed by a permanent Handle

One Tsami deployment and database serve every Clinic. Each Clinic's Booking Site lives under its Handle: `/{handle}` in Georgian, `/{handle}/en` in English, and Manage Links at `/{handle}/a/{token}`. Every table refers to a Clinic by a UUID; the Handle is only its public address. We chose a readable Handle over a UUID in the URL because Patients meet these links in SMS messages and on the Clinic's Landing Page, where an opaque ID looks like spam and can't be read out over the phone. Tsami sets the Handle during Onboarding and it never changes, because it is baked into every SMS already sent; a permanent Handle also means no redirects and no risk of a retired Handle reaching another Clinic.

## Considered Options

- **UUID in the URL.** Rejected: unreadable, longer SMS, and it undermines the Clinic-first trust of ADR 0005.
- **Locale before Handle (`/en/{handle}`).** Rejected: the Clinic is what gets shared, and `en` would become a reserved Handle.
- **Handle in the Manage Link optional, since the token alone identifies the Appointment.** Rejected: the Clinic's name in the link is what makes the SMS look trustworthy.

## Consequences

- `api`, `en`, `ka` and Next.js internals can never be Handles.
- A rebranded Clinic keeps its original Handle until Handle changes, with permanent redirects, are designed.
- `/` and `/en` redirect to the Marketing Site at tsami.ge.
