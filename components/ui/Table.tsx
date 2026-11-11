import type { ReactNode } from "react";
import styles from "./Table.module.css";

export const tableClasses = styles;

/** Horizontally scrollable table. The wrapper is focusable so keyboard users can scroll it. */
export function Table({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.scroll} role="region" aria-label={label} tabIndex={0}>
      <table className={styles.t}>{children}</table>
    </div>
  );
}
