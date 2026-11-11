/**
 * Every image slot on the site. `file` is a path inside public/images, or null while the slot still shows
 * the designed placeholder (initials portraits, drawn bottles, brand art).
 *
 * To use a real photo: drop it into public/images/ at the size listed in public/images/README.md,
 * then set `file` (and check the alt text). No other code changes are needed.
 * The photos currently in place are free-licence stock (see public/images/CREDITS.md), standing in until the
 * salon's own photography is ready.
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

export type ImageSlotKey = "hero" | "philosophy" | "weddings" | "visit";

export const IMAGE_SLOTS: Record<ImageSlotKey, ImageSlot> = {
  hero: { file: "hero.jpg", width: 1200, height: 1200, alt: "A stylist blow-drying and brushing a client's hair", label: "Hero" },
  philosophy: { file: "philosophy.jpg", width: 1000, height: 1250, alt: "A client having her hair rinsed at the basin", label: "Philosophy" },
  weddings: { file: "weddings.jpg", width: 1000, height: 1250, alt: "Bridal hair worn loose and waved with a pearl hair vine", label: "Weddings" },
  visit: { file: "visit.jpg", width: 1600, height: 1067, alt: "Styling chairs facing a long mirror in a bright salon", label: "Visit" },
};

