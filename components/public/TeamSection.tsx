import { Verify } from "@/components/providers/ReviewMode";
import { getRepository } from "@/lib/data";
import { SectionHead } from "./SectionHead";
import styles from "./Team.module.css";

const initials = (name: string) =>
  name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2);

export async function TeamSection({ as = "h2" }: { as?: "h1" | "h2" }) {
  const staff = await getRepository().listStaff();
  return (
    <section className={styles.sec} id="team" aria-labelledby="team-title">
      <div className="wrap">
        <SectionHead
          as={as}
          id="team-title"
          label="The team"
          title={
            <>
              Meet your <i>hairapists</i>
            </>
          }
          lead="Led by founder Allison Arksey. Book someone specific, or tell us what you want and we'll match you."
        />
        <ul className={styles.team}>
          {staff.map((s) => (
            <li key={s.id} className={styles.tm}>
              {/* Portrait placeholder: swap for a 600x600 black-and-white photo (see public/images/README.md) */}
              <div className={styles.port} aria-hidden="true">
                {initials(s.name)}
              </div>
              <h3>{s.name}</h3>
              <div className={styles.role}>{s.role}</div>
              <p className={styles.bio}>
                {s.bio}
                <Verify />
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
