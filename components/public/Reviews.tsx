import { Verify } from "@/components/providers/ReviewMode";
import { SITE } from "@/lib/site";
import { SectionHead } from "./SectionHead";
import styles from "./Reviews.module.css";

/** [verify] Quotes and counts must come from the salon's real Google Business Profile, with the owner's OK. */
const QUOTES = [
  "Friendly staff, great service, reasonable price.",
  "They work well together for a relaxing experience.",
  "Cookies, tea, coffee and a fantastic hand massage.",
];

export function Reviews() {
  return (
    <section className={styles.sec} aria-labelledby="reviews-title">
      <div className="wrap">
        <SectionHead
          id="reviews-title"
          label={
            <>
              {SITE.rating.value} stars · {SITE.rating.count} reviews
              <Verify />
            </>
          }
          title={
            <>
              In their <i>words</i>
            </>
          }
        />
        <ul className={styles.revs}>
          {QUOTES.map((q) => (
            <li key={q} className={styles.rev}>
              <blockquote>
                {q}
                <Verify />
              </blockquote>
              <span>Google review</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
