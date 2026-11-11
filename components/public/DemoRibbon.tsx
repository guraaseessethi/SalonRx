import styles from "./DemoRibbon.module.css";

/** Persistent but unobtrusive: this is a concept preview running on demo data. */
export function DemoRibbon() {
  return (
    <div className={styles.ribbon}>
      <span className="sr-only">Notice: </span>
      Concept preview · demo data
    </div>
  );
}
