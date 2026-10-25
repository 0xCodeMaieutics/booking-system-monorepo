# Tsami is a product separate from the Clinic's brand

The Booking Site and Admin Dashboard are Tsami, a booking product for clinics in Georgia with its own name and styling, rather than part of Face Aesthetic Centre's brand. Face is Tsami's first customer. Patients still meet the Clinic's name first: it heads the Booking Site and signs every SMS, because Patients know the Clinic, not the software, and an unknown sender looks like spam. Admins meet Tsami first. Face's Landing Page stays in this repo as `@tsami/face-landing`, a customer's site hosted alongside the product, keeping Face's own styling; it shares no code or theme with Tsami and can move to its own repo at no cost.

## Considered Options

- **Keep one Face brand across all surfaces.** Rejected: the booking system is meant to serve other Georgian clinics.
- **Tsami leads on the Booking Site too.** Rejected: it makes the jump from the Clinic's Landing Page jarring and weakens Patient trust.
- **Rename only user-facing text, keep `@face/*` packages.** Rejected: every import would keep implying the product belongs to Face.
