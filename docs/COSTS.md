# Running costs (estimate)

> **These are planning estimates in USD, not quotes.** Vendor prices change. Confirm each on the vendor's pricing page
> before sending anything to the client. Taxes (HST) extra where applicable.

## Phase 1 (this mockup)

| Item                                            | Cost                                                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| GitHub private repo                             | Free                                                                                                                |
| Vercel Hobby preview                            | Free. **Hobby is for non-commercial use**: fine for showing a concept to the owner, not for the live business site. |
| Domain `salonrx.ca` (already held by the salon) | Existing                                                                                                            |

## Phase 2 (live business)

| Service                     | Plan                      | Approx. monthly                | Notes                                                                                                                                 |
| --------------------------- | ------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel                      | Pro                       | $20 per seat                   | Commercial use allowed; one seat is usually enough                                                                                    |
| Supabase                    | Pro                       | $25                            | Postgres, Auth with MFA, Storage, daily backups; Canada (Central) region if available when the project is created                     |
| Resend                      | Free to start             | $0 (then about $20)            | Booking confirmations, receipts, staff invites                                                                                        |
| Twilio                      | Canadian long-code number | about $1 plus per-message fees | Day-before reminders and replies; SMS is billed per segment, so budget by volume (for example 400 reminders a month is a few dollars) |
| Square (or Stripe)          | Online deposits           | no monthly fee                 | Per-transaction processing fee, only on deposits taken online                                                                         |
| Cloudflare                  | Free plan and Turnstile   | $0                             | DNS, CDN, WAF basics, invisible CAPTCHA                                                                                               |
| Sentry                      | Free                      | $0                             | Error alerts                                                                                                                          |
| Better Stack or UptimeRobot | Free                      | $0                             | Uptime alerts                                                                                                                         |
| Cloudflare R2               | Free tier                 | $0                             | Encrypted nightly backups, 30 days                                                                                                    |
| Domain renewal `.ca`        |                           | about $1.50                    | About $15 to $20 a year                                                                                                               |

**Typical running cost: roughly $50 to $65 per month (USD)**, mostly Vercel Pro and Supabase Pro, plus SMS usage and
card-processing fees that scale with business volume. Kooht Studio's own build and support fees are separate.

## Ways to spend less

- Start on Resend and Cloudflare free tiers (already assumed).
- Turn off SMS reminders and use email only, if the salon prefers.
- Self-host on a VPS with managed Postgres: cheaper at scale, but the salon (or Kooht) then owns patching and uptime.
