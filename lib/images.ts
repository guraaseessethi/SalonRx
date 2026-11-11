/**
 * Every image slot on the site. `file` is a path inside public/images, or null while the slot still shows
 * the designed placeholder (initials portraits, drawn bottles, brand art).
 *
 * To use a real photo: drop it into public/images/ at the size listed in public/images/README.md,
 * then set `file` (and check the alt text). No other code changes are needed.
 * Never hotlink or scrape photos from Instagram, Facebook or Google: they belong to the salon or third parties.
 */
export interface ImageSlot {
  file: string | null;
  width: number;
  height: number;
  alt: string;
  /** Short label shown on the placeholder. */
  label: string;
}

export const IMAGE_SLOTS = {
  hero: { file: null, width: 1600, height: 1600, alt: "Hair colour in progress at Salon Rx", label: "Hero" },
  philosophy: { file: null, width: 1200, height: 1500, alt: "Tea and cookies at the Salon Rx styling stations", label: "Philosophy" },
  weddings: { file: null, width: 1400, height: 1600, alt: "Bridal hair styled for the wedding morning", label: "Weddings" },
  visit: { file: null, width: 1600, height: 1000, alt: "The Salon Rx floor on Bayfield Street", label: "Visit" },
} as const satisfies Record<string, ImageSlot>;

export type ImageSlotKey = keyof typeof IMAGE_SLOTS;
