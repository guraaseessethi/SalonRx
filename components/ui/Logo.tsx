import Link from "next/link";
import { useId } from "react";
import styles from "./Logo.module.css";

/** The cobalt "O" of SALON. Self-contained so it can be used anywhere (no sprite needed). */
export function RxMark({ className = "", title }: { className?: string; title?: string }) {
  const gradient = `rxg${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg className={`${styles.mark} ${className}`} viewBox="0 0 100 100" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a7cc4" />
          <stop offset="1" stopColor="#0f3a73" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill={`url(#${gradient})`} />
      <path d="M50 1.5 C30 14 24 40 36 60 C46 76 66 90 82 95 A49 49 0 0 0 98.5 46 C96 22 76 4 50 1.5 Z" fill="#fff" />
      <path d="M50 1.5 C66 10 76 24 78 40 C70 30 60 24 48 22 C46 14 47 7 50 1.5 Z" fill={`url(#${gradient})`} />
      <path d="M48 22 C62 26 72 38 74 54" stroke={`url(#${gradient})`} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M61 77 q4.5 -3.5 9 0 q-4.5 4.5 -9 0 Z" fill="#1f5fa6" />
    </svg>
  );
}

interface Props {
  href?: string;
  size?: number;
  tagline?: boolean;
  onDark?: boolean;
  className?: string;
}

/** "SAL(mark)N-Rx" wordmark. */
export function Wordmark({ href = "/", size = 26, tagline = false, onDark = false, className = "" }: Props) {
  return (
    <Link href={href} className={`${styles.wordmark} ${onDark ? styles.onDark : ""} ${className}`} style={{ fontSize: size }}>
      <span className={styles.inner}>
        SAL
        <RxMark />
        <span className="sr-only">O</span>N<span className={styles.rx}>-Rx</span>
        {tagline && <small className={styles.small}>your prescription to beauty</small>}
      </span>
    </Link>
  );
}
