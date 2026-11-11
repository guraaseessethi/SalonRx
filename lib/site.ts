/** Business facts used across the site. Everything marked [verify] in docs/CONTENT_TODO.md. */
export const SITE = {
  name: "Salon Rx",
  legalName: "Salon Rx",
  tagline: "your prescription to beauty",
  description:
    "Hair colour, cuts, extensions and wedding hair in Barrie, Ontario. Independent salon at 213 Bayfield Street, led by founder Allison Arksey.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://salonrx.ca",
  phone: "(705) 739-4044",
  phoneHref: "tel:+17057394044",
  phoneE164: "+1-705-739-4044",
  email: "salonrx@icloud.com",
  address: {
    street: "213 Bayfield Street",
    city: "Barrie",
    region: "ON",
    postal: "L4M 3B4",
    country: "CA",
  },
  /** Approximate. Confirm against Google Business Profile. */
  geo: { latitude: 44.3902, longitude: -79.6903 },
  priceRange: "$$",
  social: {
    instagram: "https://www.instagram.com/salon_rx",
    facebook: "https://www.facebook.com/SalonRxBarrie",
    tiktok: "https://vm.tiktok.com/ZMRrYNy7C/",
  },
  rating: { value: "4.9", count: 138 },
  credit: "Concept by Kooht Studio",
} as const;

export const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/weddings", label: "Weddings" },
  { href: "/team", label: "Team" },
  { href: "/shop", label: "Shop" },
  { href: "/visit", label: "Visit" },
] as const;
