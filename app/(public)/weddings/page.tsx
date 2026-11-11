import { WeddingsSection } from "@/components/public/WeddingsSection";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Wedding hair",
  description:
    "Bridal and wedding party hair in Barrie, in the salon or on location. Book a trial with Salon Rx.",
  path: "/weddings",
});

export default function WeddingsPage() {
  return <WeddingsSection as="h1" />;
}
