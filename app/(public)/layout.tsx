import { DemoRibbon } from "@/components/public/DemoRibbon";
import { Footer } from "@/components/public/Footer";
import { Header } from "@/components/public/Header";
import { getRepository } from "@/lib/data";
import { hairSalonJsonLd, jsonLdString } from "@/lib/seo";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getRepository().getSettings();
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <DemoRibbon />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(hairSalonJsonLd(settings.hours)) }}
      />
    </>
  );
}
