"use client";

import { useId } from "react";
import styles from "./Switch.module.css";

interface Props {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ label, description, checked, onChange }: Props) {
  const id = useId();
  const descId = `${id}-d`;
  return (
    <label className={styles.row} htmlFor={id}>
      <span className={styles.text}>
        {label}
        {description && <small id={descId}>{description}</small>}
      </span>
      <input
        id={id}
        className={styles.input}
        type="checkbox"
        role="switch"
        checked={checked}
        aria-describedby={description ? descId : undefined}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
