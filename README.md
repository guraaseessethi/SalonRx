# Salon Rx

Website and back office for **Salon Rx**, an independent hair salon at 213 Bayfield Street, Barrie, Ontario.
Built by Kooht Studio. **Phase 1: a clickable mockup** (public site and staff back office on demo data stored in the
browser). Phase 2 swaps in a real database; see `docs/`.

## Run it

```bash
pnpm install
cp .env.example .env.local   # NEXT_PUBLIC_DATA_SOURCE=mock
pnpm dev                     # http://localhost:3000
```

## Scripts

| Command                                              | What it does                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `pnpm typecheck` / `pnpm lint` / `pnpm format:check` | TypeScript strict, ESLint, Prettier                                                     |
| `pnpm test`                                          | Vitest: availability, pricing, calendar file, permissions, mock repository              |
| `pnpm build && pnpm test:e2e`                        | Playwright against a production build: booking flow, roles, checkout, axe accessibility |
| `pnpm build && pnpm screenshots`                     | Screenshots into `docs/screenshots` (360, 768, 1280 px; light and dark)                 |

## Try the demo

1. Open the site, book an appointment at **/book** (confirmation, "Add to calendar" `.ics`).
2. Click **See it in the salon calendar**, pick a role on the demo gate (no password) and find the booking in the
   calendar, on the dashboard (as "new online booking") and the confirmation text and email in the demo outbox.
3. Add `?review=1` to any public URL to mark content that must be verified with the salon.
4. **Reset demo data** is in the admin sidebar and in Settings.

## Docs

[Architecture](docs/ARCHITECTURE.md) · [Security](docs/SECURITY.md) · [Migration](docs/MIGRATION.md) ·
[Costs](docs/COSTS.md) · [Content to verify](docs/CONTENT_TODO.md) · [Images](public/images/README.md)

`reference/salon-rx-concept.html` is the approved visual concept (design source of truth). It is not shipped.
