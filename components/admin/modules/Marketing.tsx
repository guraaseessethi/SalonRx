"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatDayShort } from "@/lib/booking/time";
import { useAdmin, useDemoSend } from "../AdminContext";
import { Avatar, PageHead, Panel, Status, ui } from "../primitives";
import styles from "./Marketing.module.css";

const DAY_MS = 86_400_000;

export function Marketing() {
  const { clients, staff, now } = useAdmin();
  const demoSend = useDemoSend();
  const [sent, setSent] = useState<string[]>([]);

  const due = clients.filter((c) => c.lastVisitAt && now.getTime() - new Date(c.lastVisitAt).getTime() >= 42 * DAY_MS);
  const body = (first: string) => `Hi ${first}! It's been a while. Book your next visit: salonrx.ca/book. Reply STOP to opt out.`;

  async function remind(id: string) {
    const c = due.find((x) => x.id === id);
    if (!c) return;
    await demoSend({ channel: "sms", to: c.phone, kind: "Rebook nudge", body: body(c.name.split(" ")[0]) });
    setSent((s) => [...s, id]);
  }

  async function remindAll() {
    for (const c of due.filter((x) => !sent.includes(x.id))) {
      await demoSend({ channel: "sms", to: c.phone, kind: "Rebook nudge", body: body(c.name.split(" ")[0]) }, true);
    }
    setSent(due.map((c) => c.id));
    await demoSend({ channel: "sms", to: `${due.length} clients`, kind: "Bulk rebook nudge", body: "Rebook texts" }, true).catch(() => undefined);
  }

  return (
    <>
      <PageHead title="Marketing" sub="Reminders, rebooking nudges, reviews and gift cards." actions={<Link href="/admin/outbox" className={styles.num} style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>Demo outbox →</Link>} />
      <div className={`${ui.g} ${ui.g2}`}>
        <Panel
          title="Due to rebook"
          actions={
            <Button size="sm" disabled={due.every((c) => sent.includes(c.id))} onClick={async () => { await remindAll(); }}>
              Text all {due.length}
            </Button>
          }
        >
          <ul className={ui.ls}>
            {due.map((c) => (
              <li key={c.id}>
                <span className={ui.who}>
                  <Avatar name={c.name} />
                  <span>
                    {c.name}
                    <small>
                      Last in {formatDayShort(c.lastVisitAt!)} · {staff.find((s) => s.id === c.stylistId)?.name.split(" ")[0]}
                    </small>
                  </span>
                </span>
                {sent.includes(c.id) ? (
                  <Status tone="ok">Logged</Status>
                ) : (
                  <Button size="sm" variant="line" aria-label={`Send text to ${c.name}`} onClick={() => remind(c.id)}>
                    Send
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <p className={styles.note}>Nothing is sent in this demo. Messages are logged to the outbox. In the full build, nudges only go to clients who opted in (CASL), with STOP handling.</p>
        </Panel>
        <div className={`${ui.g} ${ui.start}`}>
          <Panel title="Automatic texts">
            <div className={styles.tmpl}>
              <small>Day before</small>Hi {"{first}"}! See you tomorrow at {"{time}"} with {"{stylist}"}. Reply C to confirm. Kettle&apos;s on.
            </div>
            <div className={styles.tmpl}>
              <small>6 weeks after colour</small>Your roots are coming back to haunt you. Book your refill: salonrx.ca/book
            </div>
            <div className={styles.tmpl}>
              <small>2 hours after visit</small>Loving it? A quick Google review means the world to our little salon.
            </div>
          </Panel>
          <Panel title="Gift cards">
            <ul className={ui.ls}>
              <li>
                <span>Sold this month</span>
                <span className={styles.num}>14 · $1,150</span>
              </li>
              <li>
                <span>Outstanding</span>
                <span className={styles.num}>$3,420</span>
              </li>
              <li>
                <span>Holiday offer</span>
                <Status tone="rx">Buy $100, get $20</Status>
              </li>
            </ul>
            <p className={styles.note}>Sample figures.</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
