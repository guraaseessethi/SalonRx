import { ServicesSection } from "@/components/public/ServicesSection";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Services & price list",
  description:
    "Salon Rx price list in Barrie: blow dry, cuts, colour, balayage, extension consultations, treatments and wedding hair.",
  path: "/services",
});

export default function ServicesPage() {
  return <ServicesSection as="h1" />;
}
