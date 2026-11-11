import type { Metadata } from "next";
import { BookSection } from "@/components/public/BookSection";
import { Hero } from "@/components/public/Hero";
import { Philosophy } from "@/components/public/Philosophy";
import { Reviews } from "@/components/public/Reviews";
import { ServicesSection } from "@/components/public/ServicesSection";
import { ShopSection } from "@/components/public/ShopSection";
import { TeamSection } from "@/components/public/TeamSection";
import { WeddingsSection } from "@/components/public/WeddingsSection";

export const metadata: Metadata = {
  title: {
    absolute: "Salon Rx · Hair salon in Barrie, Ontario | Colour, cuts, extensions, weddings",
  },
  description:
    "Independent hair salon at 213 Bayfield Street, Barrie. Colour, cuts, Hot Fusion and Tape-In extensions, wedding hair and Kérastase. Book online.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Philosophy />
      <ServicesSection />
      <WeddingsSection />
      <TeamSection />
      <Reviews />
      <ShopSection limit={8} />
      <BookSection />
    </>
  );
}
