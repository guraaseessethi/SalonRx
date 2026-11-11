import type { ReactNode } from "react";
import { Verify } from "@/components/providers/ReviewMode";
import { ButtonLink } from "@/components/ui/Button";
import { formatMinutes, todayKey, weekdayOf } from "@/lib/booking/time";
import {
  CANCELLATION_NOTICE_HOURS,
  DAY_DISPLAY_ORDER,
  DAY_NAMES,
  LATE_CANCEL_FEE_CENTS,
  MAX_LAST_MINUTE_CANCELS,
} from "@/lib/domain/constants";
import type { WeekHours } from "@/lib/domain/types";
import { SITE } from "@/lib/site";
import { Photo } from "./Photo";
import styles from "./Visit.module.css";

export function HoursTable({ hours }: { hours: WeekHours }) {
  const today = weekdayOf(todayKey());
  return (
    <table className={styles.hrs}>
      <caption className="sr-only">Opening hours</caption>
      <tbody>
        {DAY_DISPLAY_ORDER.map((i) => {
          const h = hours[i];
          return (
            <tr
              key={i}
              className={i === today ? styles.today : undefined}
              aria-current={i === today ? "date" : undefined}
            >
              <th scope="row">{DAY_NAMES[i]}</th>
              <td>{h ? `${formatMinutes(h.openMin)} – ${formatMinutes(h.closeMin)}` : "Closed"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${SITE.address.street}, ${SITE.address.city}, ${SITE.address.region} ${SITE.address.postal}`,
)}`;

/** Hours, address, contact and the cancellation policy. `as` is the heading level of the section title. */
export function VisitInfo({
  hours,
  as: Tag = "h2",
  withPhoto = false,
  label = "Book & visit",
  heading = (
    <>
      Book in a <span className="script">minute</span>
    </>
  ),
}: {
  hours: WeekHours;
  as?: "h1" | "h2";
  withPhoto?: boolean;
  label?: string;
  heading?: ReactNode;
}) {
  return (
    <div className={styles.info}>
      <div className="lab">{label}</div>
      <Tag className={styles.title}>{heading}</Tag>
      <div className={styles.block}>
        <h3>Hours</h3>
        <HoursTable hours={hours} />
      </div>
      <div className={styles.block}>
        <h3>Find us</h3>
        <p className={styles.strong}>
          {SITE.address.street}
          <br />
          {SITE.address.city}, {SITE.address.region} {SITE.address.postal}
        </p>
        <p>
          <a href={SITE.phoneHref}>{SITE.phone}</a> ·{" "}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          <Verify />
        </p>
        <p>
          <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
            Get directions<span className="sr-only"> (opens Google Maps in a new tab)</span>
          </a>
        </p>
      </div>
      <div className={styles.block}>
        <h3>Cancellations</h3>
        <p>
          {CANCELLATION_NOTICE_HOURS} hours&apos; notice, please. Late cancellations carry a $
          {LATE_CANCEL_FEE_CENTS / 100} non-refundable rebooking charge. We don&apos;t rebook after{" "}
          {MAX_LAST_MINUTE_CANCELS} last-minute cancellations.
        </p>
      </div>
      {withPhoto && (
        <Photo slot="visit" className={styles.photo} sizes="(max-width: 900px) 90vw, 440px" />
      )}
    </div>
  );
}

export function VisitCta() {
  return (
    <p style={{ marginTop: 24 }}>
      <ButtonLink href="/book" variant="blue">
        Book an appointment
      </ButtonLink>
    </p>
  );
}

export { styles as visitStyles };
