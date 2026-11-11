import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "solid" | "line" | "blue" | "danger" | "link";
type Size = "md" | "sm";

interface Shared {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function buttonClass({ variant = "solid", size = "md", className = "" }: Omit<Shared, "children">): string {
  return [
    styles.btn,
    variant === "line" || variant === "danger" ? styles.line : "",
    variant === "blue" ? styles.blue : "",
    variant === "danger" ? styles.danger : "",
    variant === "link" ? styles.link : "",
    size === "sm" ? styles.sm : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  children,
  ...rest
}: Shared & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={buttonClass({ variant, size, className })} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  href,
  children,
  ...rest
}: Shared & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const external = /^(https?:|mailto:|tel:)/.test(href);
  const classes = buttonClass({ variant, size, className });
  if (external) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
