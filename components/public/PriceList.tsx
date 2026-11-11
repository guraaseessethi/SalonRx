"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Verify } from "@/components/providers/ReviewMode";
import { useRepoQuery } from "@/components/providers/RepositoryProvider";
import { ToggleGroup } from "@/components/ui/ToggleGroup";
import { priceForLevel, priceLabel, formatMoneyCompact } from "@/lib/booking/pricing";
import { queries } from "@/lib/data/queries";
import { SERVICE_CATEGORIES, type Service, type ServiceCategory } from "@/lib/domain/types";
import styles from "./PriceList.module.css";

type Level = "senior" | "intermediate";

const CATEGORY_OPTIONS = SERVICE_CATEGORIES.map((c) => ({ value: c, label: c }));
const LEVEL_OPTIONS = [
  { value: "senior" as const, label: "Senior" },
  { value: "intermediate" as const, label: "Intermediate" },
];

function Row({ service, level }: { service: Service; level: Level }) {
  const discounted = level === "intermediate" && service.tiered && service.priceCents > 0;
  const cents = priceForLevel(service, level);
  return (
    <li className={styles.row}>
      <span className={styles.nm}>{service.name}</span>
      <span className={styles.dots} aria-hidden="true" />
      <span className={styles.pr}>
        {discounted ? (
          <>
            <s aria-hidden="true">{formatMoneyCompact(service.priceCents)}</s>
            <span className="sr-only">
              Senior price {formatMoneyCompact(service.priceCents)}, intermediate price{" "}
            </span>
            {priceLabel(service, cents)}
          </>
        ) : (
          priceLabel(service)
        )}
      </span>
      <Link
        className={styles.book}
        href={`/book?service=${service.id}`}
        aria-label={`Book ${service.name}`}
      >
        Book
      </Link>
    </li>
  );
}

export function PriceList({ initialServices }: { initialServices: Service[] }) {
  const { data: services } = useRepoQuery(queries.services, initialServices);
  const [category, setCategory] = useState<ServiceCategory>("Colour");
  const [level, setLevel] = useState<Level>("senior");

  const list = useMemo(() => services.filter((s) => s.category === category), [services, category]);
  const half = Math.ceil(list.length / 2);

  return (
    <>
      <div className={styles.bar}>
        <ToggleGroup
          label="Service category"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={setCategory}
        />
        <ToggleGroup
          label="Stylist level"
          variant="segment"
          options={LEVEL_OPTIONS}
          value={level}
          onChange={setLevel}
        />
      </div>
      <div className={styles.pl}>
        <ul className={styles.group} aria-label={`${category}, first half`}>
          {list.slice(0, half).map((s) => (
            <Row key={s.id} service={s} level={level} />
          ))}
        </ul>
        <ul className={styles.group} aria-label={`${category}, second half`}>
          {list.slice(half).map((s) => (
            <Row key={s.id} service={s} level={level} />
          ))}
        </ul>
      </div>
      <p className={styles.note}>
        Cancellations need 24 hours&apos; notice. Inside 24 hours, a $50 non-refundable charge
        applies to rebook.
        <Verify />
      </p>
    </>
  );
}

export { styles as priceListStyles };
