# Security

## Phase 1 (this mockup)

- No real personal data anywhere in the repo. Seed clients are obviously fictional (`example.com` emails,
  `705-555-01xx` numbers). Demo data lives only in the visitor's own browser.
- No secrets. `.env.example` only; `.env*` is git-ignored. Nothing in the app reads a secret.
- Security headers in `next.config.ts` (HSTS with preload, `X-Content-Type-Options`, `Referrer-Policy:
strict-origin-when-cross-origin`, `Permissions-Policy`, `X-Frame-Options: DENY`, COOP) and a **nonce-based CSP** in
  `proxy.ts` (`default-src 'self'`, `strict-dynamic`, `frame-ancestors 'none'`, `object-src 'none'`,
  `form-action 'self'`, `upgrade-insecure-requests`). No third-party scripts. Inline `style=""` attributes are the one
  allowance (`style-src-attr`).
- `/admin` is `noindex, nofollow`, excluded from `sitemap.xml` and disallowed in `robots.txt`. **It is not protected in
  Phase 1**: the role picker is a demo, anyone can open it, and that is fine because it holds only sample data.
- zod validates every form and every data shape. The mock repository validates again on write, as a server would.
- Dependabot and `pnpm audit` run in CI.

## Phase 2 plan

**Staff login.** Supabase Auth, email and password, **mandatory TOTP MFA** for owner, manager and front desk;
invite-only accounts; idle session timeout on the shared front-desk device.

**Database.** Row Level Security on every table. The service-role key is used only on the server. Separate keys for
preview and production; Vercel preview deployments use a separate Supabase project with fake data.

**Input and abuse.** zod on every Server Action and Route Handler. Rate limiting on booking, login and contact
endpoints. Cloudflare Turnstile on public forms. Webhooks (payments, Twilio) verified by signature, with idempotency
keys on payment handling.

**Frontend.** CSP with nonces (already in place), HSTS preload, no third-party scripts except the payment provider's
hosted checkout.

**Supply chain.** Dependabot, `pnpm audit` in CI, branch protection on `main`, required checks, signed commits optional.

**Encryption.** TLS everywhere; Postgres encryption at rest (provider default); backups encrypted (age) before upload to
a second provider.

**Privacy (PIPEDA).** Privacy policy; data export and deletion for a client on request; minimal retention for message
logs. Treat patch-test and allergy notes as sensitive (owner and the assigned stylist only). Keep data in Canada where the
provider allows it.

**CASL.** Reminders about a booked appointment are transactional. Rebook nudges, review asks, promotions and gift-card
blasts need recorded consent (`client_consents`: timestamp, source, wording) and a working unsubscribe or STOP.

**Payments.** Square or Stripe hosted checkout only. Card numbers never touch our servers (PCI SAQ A).

**Monitoring.** Sentry and an uptime monitor alert Kooht and the owner. Audit log reviewed monthly.

**Honest note for the client.** No system is unbreachable. This design makes a breach hard, limits what any one
account can see, and lets us restore within hours.

## Reporting a problem

Email Kooht Studio. Do not post security issues in public.
