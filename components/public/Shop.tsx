"use client";

import { useMemo, useState } from "react";
import { Verify } from "@/components/providers/ReviewMode";
import { useRepoQuery, useRepository } from "@/components/providers/RepositoryProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ToggleGroup } from "@/components/ui/ToggleGroup";
import { useToast } from "@/components/ui/Toast";
import { formatMoneyCompact } from "@/lib/booking/pricing";
import { queries } from "@/lib/data/queries";
import type { Product, Reservation } from "@/lib/domain/types";
import styles from "./Shop.module.css";

const BRANDS = ["All", "Kérastase", "Moroccanoil", "Color Wow", "Schwarzkopf OSiS+", "KMS", "Salon Rx"] as const;
type Brand = (typeof BRANDS)[number];
const BRAND_OPTIONS = BRANDS.map((b) => ({ value: b, label: b === "Schwarzkopf OSiS+" ? "OSiS+" : b }));

function Stock({ stock }: { stock: number }) {
  if (stock <= 0) return <span className={`${styles.stk} ${styles.out}`}>Sold out</span>;
  if (stock <= 2) return <span className={`${styles.stk} ${styles.low}`}>{stock} left</span>;
  return <span className={`${styles.stk} ${styles.ok}`}>In stock</span>;
}

interface Props {
  initialProducts: Product[];
  /** Show only this many products on "All" (the home page teaser). */
  limit?: number;
}

export function Shop({ initialProducts, limit }: Props) {
  const repo = useRepository();
  const toast = useToast();
  const { data: products } = useRepoQuery(queries.products, initialProducts);
  const { data: reservations } = useRepoQuery(queries.reservations, [] as Reservation[]);
  const [brand, setBrand] = useState<Brand>("All");

  const list = useMemo(() => {
    const retail = products.filter((p) => p.type === "Retail" && (brand === "All" || p.brand === brand));
    return brand === "All" && limit ? retail.slice(0, limit) : retail;
  }, [products, brand, limit]);

  async function toggle(p: Product) {
    const reserved = await repo.toggleReservation(p.sku);
    toast(reserved ? "Reserved. We'll have it ready for curbside pickup." : "Reservation removed.");
  }

  return (
    <>
      <div className={styles.bar}>
        <ToggleGroup label="Filter by brand" options={BRAND_OPTIONS} value={brand} onChange={setBrand} />
      </div>
      <ul className={styles.grid}>
        {list.map((p) => {
          const reserved = reservations.some((r) => r.sku === p.sku);
          const height = 60 + ((p.priceCents / 100) % 5) * 8 + (p.priceCents > 8000 ? 18 : 0);
          return (
            <li key={p.sku} className={styles.prod}>
              <div className={styles.btl} aria-hidden="true">
                <i style={{ "--h": `${height}px`, "--c": p.color } as React.CSSProperties} />
              </div>
              <div className={styles.brand}>{p.brand}</div>
              <h3>{p.name}</h3>
              <div className={styles.ft}>
                <span className={styles.price}>
                  {formatMoneyCompact(p.priceCents)}
                  <Verify />
                </span>
                <Stock stock={p.stock} />
              </div>
              <Button
                size="sm"
                variant={reserved ? "blue" : "line"}
                aria-pressed={reserved}
                aria-label={`${reserved ? "Reserved" : "Reserve · curbside"}: ${p.name}`}
                disabled={p.stock <= 0 && !reserved}
                onClick={() => toggle(p)}
              >
                {reserved ? "Reserved" : "Reserve · curbside"}
              </Button>
            </li>
          );
        })}
      </ul>
      {limit && brand === "All" && (
        <p className={styles.more}>
          <ButtonLink href="/shop" variant="line">
            See the whole shelf
          </ButtonLink>
        </p>
      )}
    </>
  );
}
