import { getRepository } from "@/lib/data";
import { Booker } from "./Booker";
import { VisitInfo } from "./Visit";
import styles from "./Visit.module.css";

/** Hours + the booking flow side by side. Used on the home page and at /book. */
export async function BookSection({
  as = "h2",
  initialServiceId,
}: {
  as?: "h1" | "h2";
  initialServiceId?: string;
}) {
  const repo = getRepository();
  const [services, staff, settings] = await Promise.all([repo.listServices(), repo.listStaff(), repo.getSettings()]);
  return (
    <section className={styles.sec} id="book" aria-label="Book and visit">
      <div className={`wrap ${styles.layout}`}>
        <div id="visit">
          <VisitInfo hours={settings.hours} as={as} />
        </div>
        <Booker
          initialServices={services}
          initialStaff={staff}
          initialSettings={settings}
          initialServiceId={initialServiceId}
          headingLevel={as === "h1" ? "h2" : "h3"}
        />
      </div>
    </section>
  );
}
