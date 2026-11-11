"use client";

import styles from "./ToggleGroup.module.css";

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  /** Accessible name of the group. */
  label: string;
  options: readonly ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: "tabs" | "segment";
  className?: string;
}

/**
 * A row of mutually exclusive buttons. Uses aria-pressed (not role=tab) because it filters a list in
 * place rather than switching between separate panels.
 */
export function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  variant = "tabs",
  className = "",
}: Props<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`${variant === "tabs" ? styles.tabs : styles.segment} ${className}`}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
