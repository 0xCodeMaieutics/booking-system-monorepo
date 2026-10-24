<img src="assets/icon.svg" width="64" height="64" alt="">

# Face Aesthetic Centre

Monorepo for Face Aesthetic Centre (ესთეტიკის ცენტრი ფეისი), Kutaisi. See [CONTEXT.md](./CONTEXT.md) for the domain language.

## Layout

| Path | What |
| --- | --- |
| `apps/landing` | Static HTML Landing Page. Georgian at `/`, English at `/en/`. No build step. |
| `packages/` | Shared code between apps (empty for now). |

## Development

```sh
pnpm dev:landing   # serves apps/landing on http://localhost:4173
```

## Deploying the Landing Page

Publish the `apps/landing/` directory as-is to any static host. `package.json` in that directory is only for local preview and can be excluded.
