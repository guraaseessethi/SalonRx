# Image slots

Every photo on the site is a **slot** defined in [`lib/images.ts`](../../lib/images.ts). To use a real photo, drop the
file into this folder at the size below, set the slot's `file` name in `lib/images.ts` (and tweak the `alt` text).
Set `file` to `null` to bring back the designed placeholder. No other code changes are needed.

Photos are shown in **black and white** by the site's CSS, so colour originals are fine, but they should look good in
monochrome (strong contrast, soft backgrounds). Export as JPG, quality 80, under 400 KB. `next/image` makes the
smaller AVIF/WebP versions automatically.

| Slot | Where it appears | Size (px) | Ratio | Notes |
|---|---|---|---|---|
| `hero` | Home page, inside the gold starburst circle | 1600 × 1600 | 1:1 | Subject centred: it is cropped to a circle |
| `philosophy` | Home page, under the "hairapist" quote | 1200 × 1500 | 4:5 | The tea, cookies or hand massage moment |
| `weddings` | Weddings panel (dark side) | 1200 × 1500 | 4:5 | A finished bridal style, or the morning-of |
| `visit` | `/visit` page | 1600 × 1067 | 3:2 | The floor, the front window, the chandelier |

## Team portraits (not wired yet)

The team grid shows initials in a circle (like the concept). To add real portraits, the slot will be
`team-<id>.jpg`, **600 × 600, square, black and white** (ids: allison, tanya, frank, nickie, josh, kim, alana,
tryla, hillary, kristie), and `TeamSection` swaps the circle for the photo. Tell Kooht when the photos are ready.

## Product photos

The shop uses drawn bottles (colour from the product record) until the salon supplies product shots,
**800 × 800, white or transparent background**.

## Social / search image

`app/opengraph-image.tsx` generates the 1200 × 630 share image from the wordmark. `app/icon.svg` is the favicon.

## Rules

- Do not scrape or hotlink images from Instagram, Facebook, Google or any directory. They belong to the salon or to
  third parties. Use photos the salon owns or has written permission for.
- Get consent before using photos of clients.
