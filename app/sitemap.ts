import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Public pages only. The /admin tree is noindex and deliberately left out.
const PATHS = ["/", "/services", "/weddings", "/team", "/shop", "/visit", "/book"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({
    url: `${SITE.url}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" || path === "/services" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/book" ? 0.9 : 0.7,
  }));
}
