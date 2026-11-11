"use client";

import { Verify } from "@/components/providers/ReviewMode";
import { useRepoQuery } from "@/components/providers/RepositoryProvider";
import { ButtonLink } from "@/components/ui/Button";
import { formatMoneyCompact } from "@/lib/booking/pricing";
import { queries } from "@/lib/data/queries";
import type { Service } from "@/lib/domain/types";
import { Photo } from "./Photo";
import styles from "./Weddings.module.css";

const ROWS = [
  { id: "w-bride", label: "Bride" },
  { id: "w-party", label: "Wedding party, each" },
  { id: "w-trial", label: "Trial" },
];

export function Weddings({ initialServices, as: Tag = "h2" }: { initialServices: Service[]; as?: "h1" | "h2" }) {
  const { data: services } = useRepoQuery(queries.services, initialServices);
  return (
    <section className={styles.sec} id="weddings" aria-labelledby="weddings-title">
      <div className="wrap">
        <div className={styles.wed}>
          <div className={styles.dark}>
            <div className="lab">Weddings</div>
            <Tag id="weddings-title">The morning of.</Tag>
            <p>
              Hair for the bride and the whole party, in the salon or on location. Book a trial and we&apos;ll plan the
              look and the timeline together.
            </p>
            <p className={styles.cta}>
              <ButtonLink href="/book?service=w-trial" variant="blue">
                Book a trial
              </ButtonLink>
            </p>
            <Photo slot="weddings" className={styles.photo} sizes="320px" />
          </div>
          <dl className={styles.prices}>
            {ROWS.map((r) => {
              const svc = services.find((s) => s.id === r.id);
              return (
                <div key={r.id}>
                  <dt>{r.label}</dt>
                  <dd>
                    {svc ? formatMoneyCompact(svc.priceCents) : ""}
                    <Verify />
                  </dd>
                </div>
              );
            })}
            <div className={styles.quoted}>
              <dt>Travel to venue</dt>
              <dd>quoted by distance</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
