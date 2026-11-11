import { ShopSection } from "@/components/public/ShopSection";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Shop",
  description:
    "Kérastase, Moroccanoil, Color Wow, OSiS+ and KMS at Salon Rx. Reserve online for curbside pickup in Barrie.",
  path: "/shop",
});

export default function ShopPage() {
  return <ShopSection as="h1" />;
}
