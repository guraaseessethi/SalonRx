"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import styles from "./Modal.module.css";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Native <dialog>: the browser handles focus trapping, Escape and returning focus. */
export function Modal({ open, title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.modal}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // a click on the backdrop lands on the dialog element itself
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {children}
        </>
      )}
    </dialog>
  );
}
