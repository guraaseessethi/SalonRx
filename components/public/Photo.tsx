import Image from "next/image";
import { IMAGE_SLOTS, type ImageSlotKey } from "@/lib/images";
import styles from "./Photo.module.css";

interface Props {
  slot: ImageSlotKey;
  /** CSS aspect-ratio, defaults to the slot's own. */
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Override the slot's alt text. */
  alt?: string;
}

/**
 * A photo slot. Shows the real image when lib/images.ts has a file for the slot, otherwise a designed placeholder.
 * Photos are shown in black-and-white to keep the editorial look.
 */
export function Photo({
  slot,
  ratio,
  sizes = "(max-width: 900px) 100vw, 50vw",
  priority,
  className = "",
  alt,
}: Props) {
  const s = IMAGE_SLOTS[slot];
  const aspectRatio = ratio ?? `${s.width} / ${s.height}`;
  return (
    <div className={`${styles.frame} ${className}`} style={{ aspectRatio }}>
      {s.file ? (
        <Image
          className={styles.img}
          src={`/images/${s.file}`}
          alt={alt ?? s.alt}
          fill
          sizes={sizes}
          priority={priority}
        />
      ) : (
        <div
          className={styles.placeholder}
          role="img"
          aria-label={`${alt ?? s.alt} (photo coming soon)`}
        >
          <span>{s.label} photo</span>
        </div>
      )}
    </div>
  );
}
