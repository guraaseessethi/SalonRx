import type { AppointmentStatus } from "@/lib/domain/types";
import type { ReactNode } from "react";
import styles from "./primitives.module.css";

export { styles as ui };

export function PageHead({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className={styles.head}>
      <div>
        <h1>{title}</h1>
        {sub && <div className={styles.sub}>{sub}</div>}
      </div>
      {actions && <div className={styles.acts}>{actions}</div>}
    </div>
  );
}

export function Panel({ title, actions, children, className = "", headingLevel: H = "h2" }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; headingLevel?: "h2" | "h3" }) {
  return (
    <section className={`${styles.panel} ${className}`}>
      {(title || actions) && (
        <div className={styles.ph}>
          {title ? <H className={styles.panelTitle}>{title}</H> : <span />}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, note, up }: { label: string; value: ReactNode; note?: ReactNode; up?: boolean }) {
  return (
    <div className={`${styles.panel} ${styles.kpi}`}>
      <div className={styles.k}>{label}</div>
      <div className={styles.v}>{value}</div>
      {note && <div className={`${styles.d} ${up ? styles.up : ""}`}>{note}</div>}
    </div>
  );
}

type Tone = "ok" | "warn" | "bad" | "rx" | "mute";
export function Status({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`${styles.st} ${styles[tone]}`}>{children}</span>;
}

const APPT_STATUS: Record<AppointmentStatus, { tone: Tone; label: string }> = {
  confirmed: { tone: "rx", label: "Confirmed" },
  arrived: { tone: "ok", label: "In the chair" },
  pending: { tone: "warn", label: "Unconfirmed" },
  new: { tone: "warn", label: "New · online" },
  done: { tone: "ok", label: "Paid" },
  noshow: { tone: "bad", label: "No-show" },
  cancelled: { tone: "mute", label: "Cancelled" },
};

export function ApptStatus({ status }: { status: AppointmentStatus }) {
  const s = APPT_STATUS[status];
  return <Status tone={s.tone}>{s.label}</Status>;
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2);
  return (
    <span className={styles.av} aria-hidden="true">
      {initials}
    </span>
  );
}

export function Field({ id, label, children, full }: { id: string; label: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={`${styles.fld} ${full ? styles.full : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}
