import { Verify } from "@/components/providers/ReviewMode";
import { getRepository } from "@/lib/data";
import { SectionHead } from "./SectionHead";
import { Shop } from "./Shop";
import styles from "./Shop.module.css";

export async function ShopSection({ as = "h2", limit }: { as?: "h1" | "h2"; limit?: number }) {
  const products = (await getRepository().listProducts()).filter((p) => p.type === "Retail");
  return (
    <section className={styles.sec} id="shop" aria-labelledby="shop-title">
      <div className="wrap">
        <SectionHead
          as={as}
          id="shop-title"
          label={
            <>
              Shop
              <Verify />
            </>
          }
          title={
            <>
              Take it <i>home</i>
            </>
          }
          lead="The same products we use in the chair. Reserve online for curbside pickup or grab it at your next visit."
        />
        <Shop initialProducts={products} limit={limit} />
      </div>
    </section>
  );
}
