import type { ReactNode } from "react";
import styles from "./SectionHead.module.css";

interface Props {
  label: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  /** Use "h1" when the section is the main content of its own page. */
  as?: "h1" | "h2";
  id?: string;
}

export function SectionHead({ label, title, lead, as: Tag = "h2", id }: Props) {
  return (
    <div className={styles.head}>
      <div>
        <div className="lab">{label}</div>
        <Tag className={styles.title} id={id}>
          {title}
        </Tag>
      </div>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
    </div>
  );
}
