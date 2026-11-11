import Image from "next/image";
import { Verify } from "@/components/providers/ReviewMode";
import { ButtonLink } from "@/components/ui/Button";
import { IMAGE_SLOTS } from "@/lib/images";
import { SITE } from "@/lib/site";
import styles from "./Hero.module.css";

/** Thin gold starburst, like the salon's chandeliers. Computed once on the server. */
function burstLines() {
  const lines: { x1: number; y1: number; x2: number; y2: number; dot: boolean }[] = [];
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const r1 = 150;
    const r2 = i % 3 === 0 ? 198 : i % 3 === 1 ? 182 : 170;
    lines.push({
      x1: +(200 + Math.cos(a) * r1).toFixed(1),
      y1: +(200 + Math.sin(a) * r1).toFixed(1),
      x2: +(200 + Math.cos(a) * r2).toFixed(1),
      y2: +(200 + Math.sin(a) * r2).toFixed(1),
      dot: i % 3 === 0,
    });
  }
  return lines;
}

export function Hero() {
  const photo = IMAGE_SLOTS.hero;
  const lines = burstLines();
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={`wrap ${styles.grid}`}>
        <div>
          <h1 className={styles.h1} id="hero-title">
            <span className={styles.kicker}>Salon Rx · Barrie</span>
            your prescription
            <br />
            to <em>beauty</em>
          </h1>
          <p className={styles.copy}>
            Colour, cuts, extensions and wedding hair at 213 Bayfield Street. Come in for the hair,
            stay for the tea, the cookies and the hand massage.
          </p>
          <div className={styles.ctas}>
            <ButtonLink href="/book" variant="blue">
              Book an appointment
            </ButtonLink>
            <ButtonLink href="/services" variant="line">
              Price list
            </ButtonLink>
          </div>
        </div>
        <div className={styles.art}>
          <svg className={styles.burst} viewBox="0 0 400 400" aria-hidden="true" focusable="false">
            <g stroke="var(--gold)" strokeWidth="1" fill="none">
              {lines.map((l, i) => (
                <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
              ))}
            </g>
            {lines
              .filter((l) => l.dot)
              .map((l, i) => (
                <circle key={i} cx={l.x2} cy={l.y2} r="2.4" fill="var(--gold)" />
              ))}
            {!photo.file && (
              <>
                <defs>
                  <linearGradient id="hero-g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#3a7cc4" />
                    <stop offset="1" stopColor="#0f3a73" />
                  </linearGradient>
                </defs>
                <circle cx="200" cy="200" r="128" fill="url(#hero-g)" />
                <path
                  d="M214 76 C170 104 160 170 186 222 C204 258 240 290 282 300"
                  stroke="#fff"
                  strokeWidth="2"
                  fill="none"
                  opacity=".85"
                />
                <path
                  d="M226 80 C190 112 184 168 206 212 C222 244 254 270 292 282"
                  stroke="#fff"
                  strokeWidth="1"
                  fill="none"
                  opacity=".5"
                />
              </>
            )}
          </svg>
          {photo.file && (
            <div className={styles.disc}>
              <Image
                src={`/images/${photo.file}`}
                alt={photo.alt}
                fill
                sizes="(max-width: 900px) 70vw, 300px"
                priority
                fetchPriority="high"
              />
            </div>
          )}
          <div className={styles.tag}>
            <b>{SITE.rating.value} ★</b>
            <span>
              from {SITE.rating.count} Google reviews
              <Verify />
            </span>
          </div>
        </div>
      </div>
      <div className="wrap">
        <ul className={styles.facts}>
          <li>
            <b>10</b>
            <span>stylists &amp; staff</span>
          </li>
          <li>
            <b>2</b>
            <span>extension methods: Hot Fusion &amp; Tape-In</span>
          </li>
          <li>
            <b>Kérastase</b>
            <span>in the chair &amp; to take home</span>
          </li>
          <li>
            <b>Wed–Sat</b>
            <span>early Saturdays from 8 am</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
