import { VisitCta, VisitInfo, visitStyles } from "@/components/public/Visit";
import { getRepository } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Hours & location",
  description: "Salon Rx is at 213 Bayfield Street, Barrie. Open Wednesday to Saturday, with early Saturdays from 8 am.",
  path: "/visit",
});

export default async function VisitPage() {
  const settings = await getRepository().getSettings();
  return (
    <section className={visitStyles.sec} aria-label="Hours and location">
      <div className={`wrap ${visitStyles.single}`}>
        <VisitInfo hours={settings.hours} as="h1" label="Visit" heading={<>Find <span className="script">us</span></>} withPhoto />
        <VisitCta />
      </div>
    </section>
  );
}
