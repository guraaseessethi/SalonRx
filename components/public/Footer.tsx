import Link from "next/link";
import { Wordmark } from "@/components/ui/Logo";
import { SITE } from "@/lib/site";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.foot}>
      <div className={`wrap ${styles.grid}`}>
        <div>
          <Wordmark size={30} onDark className={styles.brand} />
          <p style={{ marginTop: 14 }}>
            More than just hair. Creating confidence, connection and a little self-care.
          </p>
        </div>
        <div>
          <h2>Visit</h2>
          <p>{SITE.address.street}</p>
          <p>
            {SITE.address.city}, {SITE.address.region} {SITE.address.postal}
          </p>
          <p>
            <a href={SITE.phoneHref}>{SITE.phone}</a>
          </p>
        </div>
        <div>
          <h2>Follow</h2>
          <p>
            <a href={SITE.social.instagram} target="_blank" rel="noopener noreferrer">
              Instagram<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
          <p>
            <a href={SITE.social.facebook} target="_blank" rel="noopener noreferrer">
              Facebook<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
          <p>
            <a href={SITE.social.tiktok} target="_blank" rel="noopener noreferrer">
              TikTok<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </div>
        <div>
          <h2>Join the team</h2>
          <p>Think you&apos;d be a good fit? We&apos;d love to meet you.</p>
          <p>
            <Link href="/visit">Get in touch</Link>
          </p>
        </div>
        <div className={styles.fine}>
          <span>© {new Date().getFullYear()} Salon Rx</span>
          <span>
            {SITE.credit} · <Link href="/admin">Staff login</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
