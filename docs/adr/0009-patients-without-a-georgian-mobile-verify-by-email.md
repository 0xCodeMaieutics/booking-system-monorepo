# Patients without a Georgian mobile verify by email

Sender.ge, our SMS provider (ADR 0004), only delivers to Georgian mobiles, so a visitor without one couldn't receive a verification code. Such a Patient ticks "I don't have a Georgian mobile number" and is verified and notified by email instead: their code, confirmation with the Manage Link, reminder and the Clinic's cancellation and move notices all go by email through Resend, with the same text as the SMS. Each Patient has one channel, SMS or email, and is identified within the Clinic by that channel's verified contact, so a returning email links to the same Patient just as a returning number does (ADR 0002). An email Patient may also leave a phone number from any country, unverified, for the Clinic to call.

## Considered Options

- **A second SMS provider for international numbers.** Rejected: another account and sender registration for a handful of visitors, and international SMS costs far more.
- **Accept international numbers without verification.** Rejected: brings back the spam Bookings that ADR 0002 rules out.
- **Patients choose their channel freely.** Rejected: SMS reaches Georgian Patients more reliably than email, so email is only offered to those without a Georgian mobile.

## Consequences

- A Patient's phone is empty or unverified when their channel is email; their email is required and can't be edited by Admins, like an SMS Patient's number.
- The same person booking once by SMS and once by email is two Patients; Admins merge them by hand if needed.
- Both apps need `RESEND_API_KEY` and `PATIENT_EMAIL_FROM` in production.
