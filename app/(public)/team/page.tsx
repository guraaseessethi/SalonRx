import { TeamSection } from "@/components/public/TeamSection";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Meet the team",
  description:
    "The Salon Rx stylists in Barrie, led by founder Allison Arksey. Colour, cutting, extensions and wedding hair.",
  path: "/team",
});

export default function TeamPage() {
  return <TeamSection as="h1" />;
}
