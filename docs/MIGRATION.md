# Migration and exit plan (Phase 1 mock to Phase 2 production)

## Accounts belong to the client

Create every account in the **client's name and email**, with Kooht added as a collaborator: GitHub, Vercel, Supabase,
Twilio, Resend, Cloudflare, Square, domain registrar. Handover is "remove Kooht", not "transfer ownership".

## No lock-in

Everything is standard: a Postgres dump, SQL migrations in the repo, and a Next.js app. It can move to any Postgres host
or a VPS with only environment-variable changes.

## What swaps, what stays

- **Stays:** every component, page, zod schema, the pure availability and pricing rules, the tests.
- **Swaps:** `lib/data/mock/*` is replaced by `lib/data/supabase/*` implementing the same `DataRepository`.
  `getRepository()` already switches on `NEXT_PUBLIC_DATA_SOURCE=mock|supabase` (throws a clear message for `supabase`
  until it exists).
- **Moves server-side:** the demo role gate becomes Supabase Auth with RLS; `createAppointment` becomes a Server Action
  that calls the Postgres availability function and relies on the exclusion constraint; the demo outbox becomes real
  Resend and Twilio sends logged in `message_log`.
- The `DataRepository` is async and returns snapshots, so the UI already copes with network latency and errors
  (`BookingError` codes: `paused`, `unavailable`, `validation`, `service-not-found`).

## Scripts (Phase 2)

- `scripts/import-clients.ts`: CSV import from whatever the salon uses today. Dedupe on phone and email, **preview
  before commit**, dry-run by default.
- `scripts/export-all.ts`: full CSV and JSON export the owner can download from Settings.
- `supabase/migrations/*.sql`: schema, RLS policies, `btree_gist` exclusion constraint, availability function, seed.

## Build order

1. Supabase schema, RLS and seed, then `SupabaseRepository` implementing the same interface.
2. Staff auth, roles and MFA.
3. Public booking against real availability, plus email confirmations.
4. Reminders (SMS and email) via a scheduled job; STOP and consent handling.
5. Deposits for colour and extensions, plus webhooks.
6. Checkout, inventory movements, gift cards, reports.
7. Backups, monitoring, security review, accessibility audit, client CSV import, staff training doc, go-live on
   `salonrx.ca`.

## Go-live checklist (Phase 2)

DNS on Cloudflare; `mail.salonrx.ca` SPF, DKIM and DMARC verified; Twilio number registered for Canadian A2P; privacy
policy and consent wording approved; real photos and verified content (see CONTENT_TODO.md); restore from backup
rehearsed; owner and staff trained; redirect old URLs.
