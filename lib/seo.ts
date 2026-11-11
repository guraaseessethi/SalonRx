import type { Metadata } from "next";
import { DAY_NAMES } from "@/lib/domain/constants";
import type { WeekHours } from "@/lib/domain/types";
import { SITE } from "@/lib/site";

/** Per-page metadata with canonical URL and Open Graph. */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} · Salon Rx Barrie`, description, url: path },
  };
}

const to24h = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** schema.org HairSalon for local search. */
export function hairSalonJsonLd(hours: WeekHours) {
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": `${SITE.url}/#salon`,
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    telephone: SITE.phoneE164,
    email: SITE.email,
    priceRange: SITE.priceRange,
    image: `${SITE.url}/opengraph-image`,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.region,
      postalCode: SITE.address.postal,
      addressCountry: SITE.address.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: SITE.geo.latitude, longitude: SITE.geo.longitude },
    openingHoursSpecification: hours.flatMap((h, i) =>
      h
        ? [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: DAY_NAMES[i],
              opens: to24h(h.openMin),
              closes: to24h(h.closeMin),
            },
          ]
        : [],
    ),
    sameAs: [SITE.social.instagram, SITE.social.facebook, SITE.social.tiktok],
    founder: { "@type": "Person", name: "Allison Arksey" },
    potentialAction: {
      "@type": "ReserveAction",
      target: `${SITE.url}/book`,
      name: "Book an appointment",
    },
  };
}

/** JSON for a <script type="application/ld+json"> tag, safe against "</script>" injection. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
