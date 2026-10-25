# Tsami

Monorepo for Tsami, an appointment booking product for clinics in Georgia, and the Landing Page of its first Clinic, Face Aesthetic Centre (ესთეტიკის ცენტრი ფეისი), Kutaisi. See [CONTEXT.md](./CONTEXT.md) for the domain language and [docs/adr](./docs/adr) for architecture decisions.

## Layout

| Path               | What                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `apps/admin`       | Tsami Admin Dashboard (Next.js). Georgian only.                                              |
| `apps/booking`     | Tsami Booking Site (Next.js). Headed by the Clinic's name, in Tsami's styling.               |
| `apps/landing`     | Face Aesthetic Centre's static Landing Page, in the Clinic's own styling. Not part of Tsami. |
| `packages/api`     | tRPC routers for the Booking Site and Admin Dashboard.                                       |
| `packages/booking` | Booking rules shared by both routers.                                                        |
| `packages/db`      | Database schema, migrations and seed.                                                        |
| `packages/ui`      | Tsami's shared components and theme.                                                         |

## Development

```sh
pnpm dev:landing   # serves apps/landing on http://localhost:4173
pnpm dev:booking   # Booking Site on http://localhost:3000
pnpm dev:admin     # Admin Dashboard
```

## Deploying the Landing Page

Publish the `apps/landing/` directory as-is to any static host. `package.json` in that directory is only for local preview and can be excluded.
