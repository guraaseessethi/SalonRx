"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useRepoQuery, useRepository } from "@/components/providers/RepositoryProvider";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Logo";
import { useToast } from "@/components/ui/Toast";
import { queries } from "@/lib/data/queries";
import { canAccess, MODULE_LABELS, ROLE_LABELS, visibleModules, type AdminModule } from "@/lib/domain/permissions";
import { AdminDataProvider, useAdmin } from "./AdminContext";
import { RoleGate } from "./RoleGate";
import { Panel, PageHead } from "./primitives";
import styles from "./AdminShell.module.css";

const ICONS: Record<AdminModule, string> = {
  dashboard: "M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z",
  calendar: "M3 4h18v17H3zM3 9h18M8 2v4M16 2v4",
  clients: "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 11a3 3 0 1 0 0-6M22 21a6 6 0 0 0-4-5.6",
  checkout: "M2 5h20v14H2zM2 10h20M6 15h4",
  inventory: "M21 8l-9-5-9 5 9 5zM3 8v8l9 5 9-5V8M12 13v8",
  services: "M6 3l12 18M18 3L6 21M7 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM21 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z",
  staff: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  reports: "M3 21h18M6 17V9M11 17V5M16 17v-6M21 17v-3",
  marketing: "M3 11l15-6v14L3 13zM7 13v5a2 2 0 0 0 4 0v-4",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  outbox: "M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z",
};

function moduleFromPath(pathname: string): AdminModule | null {
  const seg = pathname.split("/")[2];
  return (visibleModules("owner") as readonly string[]).includes(seg) ? (seg as AdminModule) : null;
}

function Console({ children }: { children: ReactNode }) {
  const { role, me, appointments, products, outbox } = useAdmin();
  const repo = useRepository();
  const toast = useToast();
  const pathname = usePathname();
  const current = moduleFromPath(pathname);
  const modules = visibleModules(role);

  const newCount = appointments.filter((a) => a.status === "new" && (role !== "stylist" || a.staffId === me?.id)).length;
  const lowCount = products.filter((p) => p.stock <= p.par).length;
  const badges: Partial<Record<AdminModule, number>> = { calendar: newCount, inventory: lowCount, outbox: outbox.length };

  async function reset() {
    await repo.resetDemoData();
    toast("Demo data reset");
  }
  async function switchRole() {
    await repo.setSession(null);
  }

  const allowed = current === null || canAccess(role, current);

  return (
    <div className={styles.adm}>
      <aside className={styles.side} aria-label="Admin">
        <Wordmark size={24} onDark className={styles.brand} />
        <nav aria-label="Admin sections" style={{ display: "contents" }}>
          {modules.map((m) => (
            <Link key={m} className={styles.nv} href={`/admin/${m}`} aria-current={current === m ? "page" : undefined}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d={ICONS[m]} />
              </svg>
              {MODULE_LABELS[m]}
              {badges[m] ? (
                <span className={styles.badge}>
                  {badges[m]}
                  <span className="sr-only"> {m === "calendar" ? "new" : m === "inventory" ? "low" : "messages"}</span>
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className={styles.grow} />
        <div className={styles.me}>
          <small>Signed in (demo)</small>
          {me ? `${me.name} · ` : ""}
          {ROLE_LABELS[role]}
          <button type="button" onClick={switchRole}>
            Switch role
          </button>
          <button type="button" onClick={reset}>
            Reset demo data
          </button>
          <Link href="/">View website →</Link>
        </div>
      </aside>
      <div style={{ minWidth: 0 }}>
        <nav className={styles.mnav} aria-label="Admin sections (mobile)">
          <Link href="/">Site</Link>
          {modules.map((m) => (
            <Link key={m} href={`/admin/${m}`} aria-current={current === m ? "page" : undefined}>
              {MODULE_LABELS[m]}
              {badges[m] ? ` · ${badges[m]}` : ""}
            </Link>
          ))}
          <button type="button" onClick={switchRole}>
            Role
          </button>
          <button type="button" onClick={reset}>
            Reset
          </button>
        </nav>
        <main id="main" tabIndex={-1} className={styles.main}>
          <p className={styles.demoBar}>
            <span>Demo</span>
            Sample data, saved in this browser only
          </p>
          {allowed ? (
            children
          ) : (
            <div className={styles.blocked}>
              <PageHead title="Not for this role" sub={`${ROLE_LABELS[role]} can't open ${current ? MODULE_LABELS[current] : "this page"}.`} />
              <Panel>
                <p style={{ margin: "0 0 16px" }}>
                  In the full build this is enforced in the database, not only in the menu. Switch role to see what the owner sees.
                </p>
                <Button onClick={switchRole}>Switch role</Button>
              </Panel>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { data: session, ready } = useRepoQuery(queries.session);
  const loading = (
    <div className={styles.loading} role="status">
      Loading the back office…
    </div>
  );
  if (!ready) return loading;
  if (!session) return <RoleGate />;
  return (
    <AdminDataProvider session={session} fallback={loading}>
      <Console>{children}</Console>
    </AdminDataProvider>
  );
}
