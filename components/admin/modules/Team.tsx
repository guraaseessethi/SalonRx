"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Table, tableClasses as t } from "@/components/ui/Table";
import { formatMoneyCompact } from "@/lib/booking/pricing";
import { toDateKey, weekdayOf } from "@/lib/booking/time";
import { DAY_SHORT } from "@/lib/domain/constants";
import { useAdmin } from "../AdminContext";
import { Avatar, PageHead, Panel, Status, ui } from "../primitives";
import styles from "./Team.module.css";

const LEVEL: Record<string, string> = { owner: "Owner", senior: "Senior", intermediate: "Intermediate", junior: "Junior", desk: "Front desk", social: "Social" };
const RETAIL_SAMPLE: [string, number][] = [["Allison", 412], ["Josh", 298], ["Alana", 264], ["Nickie", 240], ["Tanya", 176]];

export function Team() {
  const { staff, appointments, settings, openDay } = useAdmin();
  const [approved, setApproved] = useState<string[]>([]);
  const weekday = weekdayOf(openDay);
  const hours = settings.hours[weekday];
  const TIME_OFF = ["Frank · Dec 24 – 27", "Josh · Jan 9"];

  return (
    <>
      <PageHead title="Team" sub="Who's in, how full their chair is, and what they've booked." />
      <Panel>
        <Table label="Team">
          <thead>
            <tr>
              <th>Name</th>
              <th>Level</th>
              <th>Works</th>
              <th className={t.num}>Chair booked</th>
              <th className={t.num}>Services</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => {
              const day = appointments.filter((a) => a.staffId === s.id && toDateKey(a.startsAt) === openDay && a.status !== "cancelled");
              const mins = day.reduce((sum, a) => sum + (new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime()) / 60_000, 0);
              const available = s.bookable && hours && s.workDays.includes(weekday) ? hours.closeMin - hours.openMin : 0;
              const revenue = day.reduce((sum, a) => sum + a.priceCents, 0);
              return (
                <tr key={s.id}>
                  <td>
                    <span className={ui.who}>
                      <Avatar name={s.name} />
                      <span>
                        {s.name}
                        <small>{s.role}</small>
                      </span>
                    </span>
                  </td>
                  <td>
                    <Status tone={s.level === "owner" || s.level === "senior" ? "rx" : "mute"}>{LEVEL[s.level]}</Status>
                  </td>
                  <td className={styles.days}>{s.workDays.length ? s.workDays.map((d) => DAY_SHORT[d]).join(" · ") : "Remote"}</td>
                  <td className={t.num}>{available ? `${Math.round((mins / available) * 100)}%` : "—"}</td>
                  <td className={t.num}>{s.bookable ? formatMoneyCompact(revenue) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Panel>
      <div className={`${ui.g} ${ui.g3} ${ui.top}`}>
        <Panel title="Time off">
          <ul className={ui.ls}>
            {TIME_OFF.map((r) => (
              <li key={r}>
                <span>{r}</span>
                {approved.includes(r) ? <Status tone="ok">Approved</Status> : <Button size="sm" onClick={() => setApproved((a) => [...a, r])}>Approve</Button>}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Retail this month">
          <div>
            {RETAIL_SAMPLE.map(([name, v]) => (
              <div key={name} className={styles.hb}>
                <span>{name}</span>
                <span className={styles.tr} aria-hidden="true">
                  <i style={{ "--w": `${(v / 412) * 100}%` } as React.CSSProperties} />
                </span>
                <span className={styles.n}>${v}</span>
              </div>
            ))}
          </div>
          <p className={styles.note}>Sample figures.</p>
        </Panel>
        <Panel title="Social queue">
          <p className={styles.note}>Kristie picks before-and-afters straight from tagged appointments.</p>
          <ul className={ui.ls}>
            <li>
              <span>Dana · the blue refresh</span>
              <Status tone="rx">Ready</Status>
            </li>
            <li>
              <span>Hannah · winter blonde</span>
              <Status tone="warn">Needs consent</Status>
            </li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
