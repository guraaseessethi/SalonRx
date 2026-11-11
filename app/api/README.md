# API routes (empty in Phase 1)

Phase 1 is a clickable mockup: all data goes through `lib/data` (`DataRepository`) and is stored in the browser, so
there are no API routes yet.

Phase 2 adds Server Actions and Route Handlers here (or beside the pages that use them):

- `POST /api/webhooks/square` and `/api/webhooks/twilio`: signature-verified, idempotent
- `GET /api/availability`: anonymous, rate-limited, calls the Postgres availability function
- `POST /api/bookings`: zod-validated, Turnstile-protected, rate-limited

See `docs/ARCHITECTURE.md` and `docs/SECURITY.md`.
