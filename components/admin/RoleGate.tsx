"use client";

import Link from "next/link";
import { useState } from "react";
import { useRepoQuery, useRepository } from "@/components/providers/RepositoryProvider";
import { Wordmark } from "@/components/ui/Logo";
import { queries } from "@/lib/data/queries";
import { ROLE_BLURBS, ROLE_LABELS } from "@/lib/domain/permissions";
import { ROLES, type Role, type Staff } from "@/lib/domain/types";
import styles from "./RoleGate.module.css";

/**
 * Demo gate: pick a role, no password. It previews the Phase 2 permission model.
 * Real staff login (invite-only, email + password, mandatory MFA) comes in the full build.
 */
export function RoleGate({ onDone, initialStaff }: { onDone?: () => void; initialStaff?: Staff[] }) {
  const repo = useRepository();
  const { data: staff } = useRepoQuery(queries.staff, initialStaff ?? ([] as Staff[]));
  const stylists = staff.filter((s) => s.bookable);
  const [stylistId, setStylistId] = useState("tanya");

  async function enter(role: Role) {
    await repo.setSession(role === "stylist" ? { role, staffId: stylistId } : { role });
    onDone?.();
  }

  return (
    <main className={styles.gate} id="main" tabIndex={-1}>
      <div className={styles.card}>
        <Wordmark size={28} href="/" />
        <h1>Staff back office</h1>
        <span className={styles.demo}>Demo</span>
        <p className={styles.lead} style={{ marginTop: 14 }}>
          Demo. Real staff login comes in the full build. For now, pick who you want to be and see what that person would see.
        </p>
        <ul className={styles.roles}>
          {ROLES.map((role) => (
            <li key={role}>
              <button type="button" className={styles.role} onClick={() => enter(role)}>
                <span>
                  <b>{ROLE_LABELS[role]}</b>
                  <small>{ROLE_BLURBS[role]}</small>
                </span>
                <span className={styles.go}>Enter →</span>
              </button>
              {role === "stylist" && (
                <div className={styles.stylist}>
                  <label htmlFor="gate-stylist">Signed in as</label>
                  <select id="gate-stylist" value={stylistId} onChange={(e) => setStylistId(e.target.value)}>
                    {stylists.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className={styles.foot}>
          <span>Everything here is sample data saved in this browser only.</span>
          <Link href="/">← Back to the website</Link>
        </div>
      </div>
    </main>
  );
}
