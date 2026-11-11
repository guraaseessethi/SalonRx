import { Photo } from "./Photo";
import styles from "./Philosophy.module.css";

const ITEMS = [
  { n: "i.", title: "Tea, coffee & cookies", text: "Something warm while your colour processes. Tell us your order once and we'll remember it." },
  { n: "ii.", title: "Hand & scalp massage", text: "Part of every wash. Not an add-on, not an upsell." },
  { n: "iii.", title: "Barrie water, handled", text: "Hard water dulls colour and brasses blondes. Kérastase decalcifying treatments lift the buildup." },
  { n: "iv.", title: "Relationships, not rush jobs", text: "Your formula and history stay on file, so every visit picks up where the last one ended." },
];

export function Philosophy() {
  return (
    <section className={styles.sec} aria-labelledby="philosophy-title">
      <div className={`wrap ${styles.hp}`}>
        <div>
          <h2 id="philosophy-title" className="sr-only">
            The Salon Rx philosophy
          </h2>
          <blockquote className={styles.quote}>
            Your stylist listens first. Every appointment comes with a hairapist.
            <small>The Salon Rx philosophy</small>
          </blockquote>
          <Photo slot="philosophy" className={styles.photo} sizes="(max-width: 900px) 90vw, 380px" />
        </div>
        <ul className={styles.list}>
          {ITEMS.map((i) => (
            <li key={i.n}>
              <span className={styles.n} aria-hidden="true">
                {i.n}
              </span>
              <div>
                <h3>{i.title}</h3>
                <p>{i.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
