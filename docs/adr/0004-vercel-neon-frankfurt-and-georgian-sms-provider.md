# Vercel and Neon in Frankfurt, with a Georgian SMS provider

The Admin Dashboard and Booking Site deploy as two Vercel projects in `fra1`, backed by a Neon Postgres project in Frankfurt — the closest region to Kutaisi that both offer — chosen over Fly for less operational work at a single clinic's traffic. Patient SMS goes through a Georgian provider (e.g. Sender.ge or SMS Office) rather than Twilio, for price, delivery on Georgian carriers and alphanumeric sender-name registration; it sits behind an `SmsSender` interface so it can be swapped. Admin email (invites, password reset) uses Resend. The Landing Page stays on its existing static hosting.

## Consequences

- The provider is Sender.ge. It only delivers to Georgian mobiles, so Patients without one are verified and notified by email (ADR 0009).
- Failed SMS and emails are reported to a Tsami Telegram chat, since a Patient who doesn't get their code or confirmation has no other way to tell us.
