# SMS can be switched off for all of Tsami

When Sender.ge is down, Patients can't get a verification code, so nobody can book. Tsami can switch SMS off for every Clinic at once with `pnpm sms:disable`, a flag in the single-row `tsami_settings` table, and back on with `pnpm sms:enable`; both alert the Tsami Telegram chat. While it is off, the Booking Site only offers email verification (ADR 0009), the API refuses SMS codes, and Patient Messages to SMS Patients go to their email if they gave one and are otherwise skipped and reported. The Admin Dashboard shows a banner and requires an email when an Admin books, so that Patient can still be reached.

## Considered Options

- **Per-Clinic flag.** Rejected: every Clinic shares one provider, so an outage hits them all.
- **Switch off automatically after repeated failures.** Rejected for now: one bad number or an empty balance would push every Patient to email; a person decides.

## Consequences

- A returning SMS Patient who books online while SMS is off becomes a second, email Patient. Their history is split across the two records; Admins can tell them apart by phone and email.
- Messages skipped while SMS is off are not resent when it comes back, including reminders.
