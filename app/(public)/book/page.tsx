import { BookSection } from "@/components/public/BookSection";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Book an appointment",
  description:
    "Book your Salon Rx appointment online in Barrie: pick a service, a stylist and a time.",
  path: "/book",
});

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  return (
    <BookSection as="h1" initialServiceId={typeof service === "string" ? service : undefined} />
  );
}
