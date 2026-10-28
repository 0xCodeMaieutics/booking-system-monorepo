# Tsami

Monorepo for Tsami, an appointment booking product for clinics in Georgia, and the Landing Page of its first Clinic, Face Aesthetic Centre (ესთეტიკის ცენტრი ფეისი), Kutaisi. See [CONTEXT.md](./CONTEXT.md) for the domain language and [docs/adr](./docs/adr) for architecture decisions.

## Layout

| Path               | What                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `apps/admin`       | Tsami Admin Dashboard (Next.js). Georgian only.                                              |
| `apps/booking`     | Tsami Booking Site (Next.js). Headed by the Clinic's name, in Tsami's styling.               |
| `apps/marketing`   | Tsami Marketing Site (Next.js) for Clinics. Georgian and English.                            |
| `apps/landing`     | Face Aesthetic Centre's static Landing Page, in the Clinic's own styling. Not part of Tsami. |
| `packages/api`     | tRPC routers for the Booking Site and Admin Dashboard.                                       |
| `packages/booking` | Booking rules shared by both routers.                                                        |
| `packages/db`      | Database schema, migrations and seed.                                                        |
| `packages/ui`      | Tsami's shared components and theme.                                                         |

## Development

Requires Docker. `make setup` creates `.env` from `.env.example` if missing, installs dependencies, starts Postgres on port 5433 and a SeaweedFS S3 server on port 8333 (standing in for the Cloudflare R2 photo bucket), and runs migrations and the seed, including a development Admin (`dev@tsami.local` / `dev-password`) that the sign-in page prefills. `make db-reset` wipes the database and does the same again; `make db-down` stops it.

```sh
make setup
pnpm dev:landing   # serves apps/landing on http://localhost:4173
pnpm dev:booking   # Booking Site; the seeded Clinic is at http://localhost:3000/face-kutaisi
pnpm dev:admin     # Admin Dashboard
pnpm dev:marketing # Marketing Site on http://localhost:3003
```

## Onboarding a Clinic

Tsami onboards Clinics by hand (see `CONTEXT.md` and `docs/adr/0008`). This creates the Clinic with its permanent Handle and emails its first Admin an invitation:

```sh
pnpm clinic:onboard --handle face-kutaisi --name-ka "ესთეტიკის ცენტრი ფეისი" --name-en "Face Aesthetic Centre" \
  --phone +995599446450 --admin-email owner@example.com --admin-name "Owner Name"
pnpm clinic:close face-kutaisi   # stops new Bookings; Manage Links and Admin sign-in keep working
```

If Sender.ge is down, switch SMS off for every Clinic until it recovers (ADR 0010). Patients then verify by email, and SMS Patients get their messages by email when they've given one:

```sh
pnpm sms:disable
pnpm sms:enable
```

## Deploying the Landing Page

Publish the `apps/landing/` directory as-is to any static host. `package.json` in that directory is only for local preview and can be excluded.
