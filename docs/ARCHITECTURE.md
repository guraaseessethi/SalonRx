# Architecture

Salon Rx is one Next.js 16 app (App Router, TypeScript strict, pnpm) containing the public website and the staff back
office. **Phase 1 (this repo)** is a clickable mockup on mock data. The code is shaped so **Phase 2** swaps the mock data
layer for a real database without rewriting the UI.

```
app/
  layout.tsx            fonts (next/font), providers, skip link. Renders per request so the CSP nonce applies.
  (public)/             home, book, services, weddings, team, shop, visit  (+ header, footer, demo ribbon, JSON-LD)
  (admin)/admin/        noindex layout; (console)/ holds the ten modules + demo outbox behind the role gate
  api/                  empty in Phase 1 (README only)
  sitemap.ts robots.ts icon.svg opengraph-image.tsx
proxy.ts                per-request Content-Security-Policy with a nonce
lib/
  domain/               types.ts (zod schemas + inferred types), constants.ts, permissions.ts
  booking/              availability.ts, pricing.ts, time.ts, schedule.ts, ics.ts   (pure, unit tested)
  data/
    repository.ts       interface DataRepository
    mock/               MockRepository, seed data, storage adapters
    queries.ts          stable query functions for hooks
    index.ts            getRepository(): picks the data source from NEXT_PUBLIC_DATA_SOURCE
  images.ts site.ts seo.ts
components/             ui/ (Button, ToggleGroup, Modal, Switch, Table, Toast, Logo), public/, admin/, providers/
e2e/                    Playwright smoke, axe, screenshots
tests/unit/             Vitest
docs/ reference/        (reference/ is the approved concept, not shipped)
```

## The rule that makes Phase 2 painless

> UI components never touch localStorage or seed data. Everything goes through `DataRepository`.

- `DataRepository` (`lib/data/repository.ts`) is the only door to data. Every method is async because a network
  database cannot be synchronous. Returned objects are immutable snapshots.
- `getRepository()` chooses the implementation from `NEXT_PUBLIC_DATA_SOURCE` (`mock` today, `supabase` in Phase 2).
- **Server rendering:** server components call `getRepository()` too. On the server the mock repository is in-memory
  seed data, so public pages are fully rendered HTML (good for SEO) with the seed content.
- **Browser:** `RepositoryProvider` creates the browser repository (localStorage for data, sessionStorage for the demo
  role). `useRepoQuery(queries.x, initial)` starts from what the server rendered (no hydration mismatch), then reads the
  browser repository and re-reads after every write (`repo.subscribe`).
- The booking flow, admin modules and public price list/shop all work through the same hooks, so a booking made on the
  public site shows up in the admin calendar, and a price edited in the services editor changes the public price list.

## Pure rules (unit tested)

`lib/booking/*` has no clock, no storage, no React. Everything it needs is passed in.

- **Availability** (`availability.ts`): salon open that weekday; 30-minute grid from opening; the whole service must
  finish by closing; stylist is bookable and works that weekday; junior stylists cannot take colour; a slot must start
  more than 30 minutes from now; no overlap with the stylist's non-cancelled appointments; "anyone" returns every free
  eligible stylist and picks the first.
- **Pricing** (`pricing.ts`): intermediate stylists are 25% off tiered services (cuts and colour); HST 13% on services
  and retail; tip is a percentage of services only and is not taxed.
- **Money** is integer cents everywhere. **Time** is stored as UTC ISO strings; the `America/Toronto` clock is applied
  only at the edges (`time.ts`, using `date-fns-tz`), including daylight saving.
- The mock repository re-checks availability at the moment of booking (Phase 2: a database exclusion constraint does it).

## Demo role gate (previews Phase 2 permissions)

`/admin` has no password: a role picker (Owner / Front desk / Stylist). See `lib/domain/permissions.ts`.

| Role       | Modules                                                                           |
| ---------- | --------------------------------------------------------------------------------- |
| Owner      | all, including reports, settings, prices                                          |
| Front desk | everything except reports and settings (services view-only)                       |
| Stylist    | Today, Calendar, Clients, Checkout, scoped to their own column, clients and sales |

Anything that would send a text or email logs to the **demo outbox** (`/admin/outbox`) and shows a toast: "Would send in
the full build."

## Security headers and CSP

`next.config.ts` sets HSTS, nosniff, Referrer-Policy, Permissions-Policy, frame protections. `proxy.ts` sets a CSP with a
per-request nonce and `strict-dynamic`, so all pages render per request (`await connection()` in the root layout).
`style-src-attr 'unsafe-inline'` is allowed for `style="..."` attributes only (calendar positions, bottle heights); it
does not allow `<style>` blocks or scripts. No third-party scripts; fonts are self-hosted by `next/font`.

## Accessibility

WCAG 2.2 AA. Landmarks and a skip link; one `h1` per page; focus moves to each booking step heading with a live
announcement; `aria-pressed` toggles, `aria-current="step"` stepper; native `<dialog>` modals; keyboard-scrollable table
regions; reduced-motion and both colour schemes. The concept's gray `#6c6c72` passes on bone (4.75:1); the warning colour
was darkened from `#a8701c` (4.2:1) to `#8f5e12`. axe checks (serious and critical must be zero) run on every public
page in light and dark, the booking steps and every admin module.

## Testing

`pnpm test` (Vitest: availability, pricing, ICS, permissions, mock repository), `pnpm test:e2e` (Playwright against a
production build: book then see it in the admin calendar, roles, checkout and stock, mobile menu, axe),
`pnpm screenshots` (docs/screenshots at 360, 768 and 1280 in light and dark).

## Phase 2 target (not built)

See [MIGRATION.md](MIGRATION.md) for the order of work, [SECURITY.md](SECURITY.md) for the plan and
[COSTS.md](COSTS.md) for running costs.

| Layer                  | Choice                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| Web, admin, API        | Next.js on Vercel Pro (Server Actions and Route Handlers)                                                |
| Database, auth, files  | Supabase Pro, Canada (Central) region if available: Postgres, Row Level Security, Auth with MFA, Storage |
| Email                  | Resend on `mail.salonrx.ca` (SPF, DKIM, DMARC)                                                           |
| SMS                    | Twilio Canadian long-code number                                                                         |
| Deposits               | Square (or Stripe) hosted checkout with signed webhooks (card data never touches us: SAQ A)              |
| In-salon card payments | Existing terminal; checkout records the sale and method                                                  |
| DNS, bot protection    | Cloudflare free plan and Turnstile on booking and contact forms                                          |
| Errors and uptime      | Sentry free and Better Stack or UptimeRobot free                                                         |
| Off-site backups       | Nightly `pg_dump` via GitHub Actions, encrypted with age, to Cloudflare R2, 30-day retention             |

### Data model (Postgres)

`staff`, `staff_roles`, `services`, `service_prices` (per staff level), `clients`, `client_notes` (formula history),
`client_consents` (email/SMS marketing consent with timestamp and source, required by CASL), `patch_tests`,
`appointments`, `appointment_services`, `payments`, `sales`, `sale_items`, `products`, `stock_movements`, `gift_cards`,
`message_log`, `settings`, `audit_log`.

- **No double bookings at the database level:** `appointments` has a `tstzrange` column `during` and
  `EXCLUDE USING gist (staff_id WITH =, during WITH &&)` (needs `btree_gist`), so two people clicking the same slot
  cannot both win. The mock's re-check in `createAppointment` mirrors this.
- Availability is a Postgres function called from an anonymous, rate-limited endpoint. The public never reads tables.
- Soft deletes and `audit_log` (who changed what, when) for clients, appointments, payments and settings.

### Roles enforced by RLS (not just the UI)

| Role               | Can see/do                                                                              |
| ------------------ | --------------------------------------------------------------------------------------- |
| Owner              | Everything, including reports, settings, staff, exports                                 |
| Manager (optional) | Everything except billing, staff pay and deleting data                                  |
| Front desk         | Calendar for all stylists, clients, checkout, inventory counts. No reports, no settings |
| Stylist            | Own calendar, own clients' cards and formulas, own sales                                |
| Social media       | Marketing templates and content only, no client personal data                           |
