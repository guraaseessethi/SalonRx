import { Verify } from "@/components/providers/ReviewMode";
import { getRepository } from "@/lib/data";
import { PriceList } from "./PriceList";
import { SectionHead } from "./SectionHead";
import styles from "./PriceList.module.css";

export async function ServicesSection({ as = "h2" }: { as?: "h1" | "h2" }) {
  const services = await getRepository().listServices();
  return (
    <section className={styles.sec} id="menu" aria-labelledby="services-title">
      <div className="wrap">
        <SectionHead
          as={as}
          id="services-title"
          label={
            <>
              The price list
              <Verify />
            </>
          }
          title={
            <>
              Services <i>&amp;</i> pricing
            </>
          }
          lead="Longer or thicker hair and specialty techniques may cost more. Intermediate stylists are 25% off cuts and colour, so switch the list to see their prices."
        />
        <PriceList initialServices={services} />
      </div>
    </section>
  );
}
