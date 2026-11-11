"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Logo";
import { NAV_LINKS } from "@/lib/site";
import styles from "./Header.module.css";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Escape closes the menu and returns focus to its button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const current = (href: string) => (pathname === href ? "page" : undefined);

  return (
    <header className={styles.top}>
      <div className={`wrap ${styles.bar}`}>
        <Wordmark tagline size={26} />
        <nav className={styles.nav} aria-label="Main">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={current(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className={styles.right}>
          <Link className={styles.staff} href="/admin">
            Staff
          </Link>
          <ButtonLink size="sm" href="/book">
            Book
          </ButtonLink>
          <button
            ref={btnRef}
            type="button"
            className={styles.menuBtn}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className={styles.bars} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            Menu
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-menu" className={styles.panel} aria-label="Main (mobile)">
          <div className="wrap">
            <ul>
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} aria-current={current(l.href)} onClick={() => setOpen(false)}>
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/admin" onClick={() => setOpen(false)}>
                  Staff demo
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      )}
    </header>
  );
}
