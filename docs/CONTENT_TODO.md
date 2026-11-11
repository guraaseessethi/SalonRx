# Content to confirm with Salon Rx before launch

Everything below came from the approved concept or from public information and **must be checked with the client**.
Open any page with `?review=1` (for example `/?review=1`) to see a small dashed **verify** marker on each of these
on the page. `?review=0` turns it off. The marker is drawn by CSS, so it is never part of the real page content.

## Must verify

| #   | What                                               | Where it shows                                 | Action                                                                                                                                                                              |
| --- | -------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **"4.9 ★ from 138 Google reviews"**                | Home hero, reviews section heading             | Pull the live rating and count from the Google Business Profile with Allison's OK. Update `SITE.rating` in `lib/site.ts`.                                                           |
| 2   | **The three review quotes**                        | Reviews section                                | Replace with real quotes she is happy to show (check Google's display terms; consider linking to the profile instead of quoting). Edit `QUOTES` in `components/public/Reviews.tsx`. |
| 3   | **Every staff bio, role and booking day**          | Team, booking stylist step                     | Confirm names, spelling, levels, which days each person works, and who can be booked online. `lib/data/mock/seed.ts` (`SEED_STAFF`). "Tryla" has no surname.                        |
| 4   | **Every price and duration**                       | Price list, booking, wedding block             | Confirm all 32 services, which ones are "from" prices (+), durations, and the 25% intermediate discount on cuts and colour. `SEED_SERVICES` in the seed.                            |
| 5   | **Wedding pricing**                                | Weddings                                       | Bride $135, party $105 each, trial $130, travel quoted by distance.                                                                                                                 |
| 6   | **Opening hours**                                  | Everywhere                                     | Wed–Thu 10–8, Fri 10–4, Sat 8–2, closed Sun–Tue. `DEFAULT_HOURS`. Also holiday hours.                                                                                               |
| 7   | **Product list, prices, stock levels, par levels** | Shop, admin inventory                          | All illustrative. Confirm brands she actually carries and whether to show prices online. Back-bar (Goldwell, foils, extensions) is admin-only.                                      |
| 8   | **Email address `salonrx@icloud.com`**             | Visit page                                     | Recommend moving to `hello@salonrx.ca` in Phase 2 (Apple/iCloud addresses look informal and are hard to hand over).                                                                 |
| 9   | **Cancellation policy wording**                    | Price list note, visit page, booking, settings | 24 h notice, $50 non-refundable rebooking charge, no rebooking after 3 last-minute cancellations.                                                                                   |
| 10  | **Map position**                                   | `HairSalon` JSON-LD `geo`                      | Coordinates in `lib/site.ts` are approximate. Confirm against the Google Business Profile.                                                                                          |
| 11  | **Social links**                                   | Footer, JSON-LD `sameAs`                       | Instagram `salon_rx`, Facebook `SalonRxBarrie`, and the TikTok short link. Replace the short link with the profile URL.                                                             |
| 12  | **Address and phone**                              | Footer, visit, JSON-LD                         | 213 Bayfield Street, Barrie, ON L4M 3B4, (705) 739-4044.                                                                                                                            |
| 13  | **Philosophy claims**                              | Home                                           | "Hand & scalp massage with every wash", tea and cookies, Kérastase decalcifying treatments for hard water.                                                                          |
| 14  | **Founder and "10 stylists & staff"**              | Home hero                                      | Facts bar.                                                                                                                                                                          |
| 15  | **Hot Fusion and Tape-In extensions**              | Home hero, services                            | Confirm both methods and the consultation being free.                                                                                                                               |

## Photos

The four photos on the site are **free-licence stock** (Unsplash), not the salon. See `public/images/CREDITS.md`.
Replace with the salon's own photography and add team portraits (600 × 600, black and white). Slots and sizes:
`public/images/README.md`.

## Decisions for the client

- Online deposits for colour and extensions ($25 toggle exists in settings, not charged in Phase 1).
- Should the shop show prices, or "ask in salon"?
- Do front desk staff see the services editor, or owner only? (Phase 1: front desk can view, owner edits.)
- A privacy policy page and consent wording for texts (CASL) are needed before real bookings: Phase 2.
