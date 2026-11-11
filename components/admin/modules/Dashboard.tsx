"use client";

import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { ButtonLink } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { formatMoneyCompact } from "@/lib/booking/pricing";
import {
  formatDateKeyLong,
  formatMinutes,
  formatTime,
  toDateKey,
  weekdayOf,
} from "@/lib/booking/time";
import { TIMEZONE } from "@/lib/domain/constants";
import { canAccess } from "@/lib/domain/permissions";
import { useAdmin } from "../AdminContext";
import { ApptStatus, Avatar, Kpi, PageHead, Panel, Status, ui } from "../primitives";
import styles from "./Dashboard.module.css";

const DAY_MS = 86_400_000;

export function Dashboard() {
  const {
    role,
    me,
    scopedStaffId,
    appointments,
    clients,
    products,
    sales,
    reservations,
    staff,
    services,
    settings,
    now,
    openDay,
    today,
  } = useAdmin();

  const hour = Number(formatInTimeZone(now, TIMEZONE, "H"));
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const hours = settings.hours[weekdayOf(openDay)];
  const isToday = openDay === today;

  const dayAppts = appointments
    .filter(
      (a) =>
        toDateKey(a.startsAt) === openDay &&
        a.status !== "cancelled" &&
        (!scopedStaffId || a.staffId === scopedStaffId),
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const mySales = sales.filter(
    (s) => toDateKey(s.at) === today && (!scopedStaffId || s.staffId === scopedStaffId),
  );

  const booked = dayAppts.reduce((sum, a) => sum + a.priceCents, 0);
  const taken = mySales.reduce((sum, s) => sum + s.totalCents, 0);
  const retail = mySales.reduce((sum, s) => sum + s.retailCents, 0);

  const newOnline = appointments.filter(
    (a) => a.status === "new" && (!scopedStaffId || a.staffId === scopedStaffId),
  ).length;
  const lowStock = products.filter((p) => p.stock <= p.par).length;
  const visible = clients.filter(
    (c) =>
      !scopedStaffId ||
      c.stylistId === scopedStaffId ||
      appointments.some((a) => a.clientId === c.id && a.staffId === scopedStaffId),
  );
  const due = visible.filter(
    (c) => c.lastVisitAt && now.getTime() - new Date(c.lastVisitAt).getTime() >= 42 * DAY_MS,
  );
  const patchExpired = visible.filter(
    (c) => c.patchTestAt && now.getTime() - new Date(c.patchTestAt).getTime() > 180 * DAY_MS,
  );

  const teaClients = dayAppts
    .filter((a, i, arr) => arr.findIndex((x) => x.clientId === a.clientId) === i)
    .slice(0, 6);
  const clientById = (id: string) => clients.find((c) => c.id === id);
  const staffName = (id: string) => staff.find((s) => s.id === id)?.name.split(" ")[0] ?? "";
  const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? "";

  const canSee = (m: Parameters<typeof canAccess>[1]) => canAccess(role, m);

  return (
    <>
      <PageHead
        title={`Good ${greeting}${me ? `, ${me.name.split(" ")[0]}` : ""}`}
        sub={
          <>
            {isToday ? "Today, " : "Closed today. Next open: "}
            {formatDateKeyLong(openDay)}
            {hours ? ` · ${formatMinutes(hours.openMin)} – ${formatMinutes(hours.closeMin)}` : ""}
          </>
        }
        actions={
          <>
            <ButtonLink size="sm" href="/admin/checkout">
              New sale
            </ButtonLink>
            <ButtonLink size="sm" variant="line" href="/admin/calendar">
              Calendar
            </ButtonLink>
          </>
        }
      />
      <div className={`${ui.g} ${ui.g4}`}>
        <Kpi
          label="Booked"
          value={formatMoneyCompact(booked)}
          note={`${dayAppts.length} appointments`}
        />
        <Kpi label="Taken so far" value={formatMoneyCompact(taken)} note="incl. tips & HST" up />
        <Kpi label="Retail" value={formatMoneyCompact(retail)} note="goal $300" />
        <Kpi label="Rebooked" value="68%" note="+6% vs October (sample)" up />
      </div>
      <div className={`${ui.g} ${ui.g2} ${ui.top}`}>
        <Panel title={isToday ? "The day" : formatDateKeyLong(openDay)}>
          {dayAppts.length === 0 ? (
            <p className={ui.muted}>Nothing booked yet.</p>
          ) : (
            <Table label="Appointments for the day">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Client</th>
                  <th>Service</th>
                  <th>With</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dayAppts.map((a) => {
                  const c = clientById(a.clientId);
                  return (
                    <tr key={a.id}>
                      <td className={styles.num}>{formatTime(a.startsAt)}</td>
                      <td>
                        {c ? (
                          <Link className={styles.link} href={`/admin/clients?client=${c.id}`}>
                            {c.name}
                          </Link>
                        ) : (
                          "—"
                        )}{" "}
                        {c?.allergy && <Status tone="bad">Allergy</Status>}
                      </td>
                      <td>{serviceName(a.serviceId)}</td>
                      <td>{staffName(a.staffId)}</td>
                      <td>
                        <ApptStatus status={a.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Panel>
        <div className={`${ui.g} ${ui.start}`}>
          <Panel title="Needs you">
            <ul className={ui.ls}>
              {newOnline > 0 && (
                <li>
                  <span>
                    {newOnline} new online booking{newOnline > 1 ? "s" : ""}
                  </span>
                  <ButtonLink size="sm" variant="blue" href="/admin/calendar">
                    Review
                  </ButtonLink>
                </li>
              )}
              {canSee("inventory") && lowStock > 0 && (
                <li>
                  <span>{lowStock} products at or below par</span>
                  <ButtonLink size="sm" variant="line" href="/admin/inventory">
                    Reorder
                  </ButtonLink>
                </li>
              )}
              {canSee("marketing") ? (
                <li>
                  <span>{due.length} clients overdue to rebook</span>
                  <ButtonLink size="sm" variant="line" href="/admin/marketing">
                    Remind
                  </ButtonLink>
                </li>
              ) : (
                <li>
                  <span>{due.length} of your clients overdue to rebook</span>
                  <ButtonLink size="sm" variant="line" href="/admin/clients">
                    View
                  </ButtonLink>
                </li>
              )}
              {patchExpired.length > 0 && (
                <li>
                  <span>{patchExpired.length} patch test expired</span>
                  <ButtonLink size="sm" variant="line" href="/admin/clients">
                    View
                  </ButtonLink>
                </li>
              )}
              {reservations.length > 0 && canSee("inventory") && (
                <li>
                  <span>
                    {reservations.length} curbside pickup{reservations.length > 1 ? "s" : ""}{" "}
                    reserved online
                  </span>
                  <Status tone="rx">Front desk</Status>
                </li>
              )}
            </ul>
          </Panel>
          <Panel title="Tea & coffee orders">
            {teaClients.length === 0 ? (
              <p className={ui.muted}>No one booked.</p>
            ) : (
              <ul className={ui.ls}>
                {teaClients.map((a) => {
                  const c = clientById(a.clientId);
                  if (!c) return null;
                  return (
                    <li key={a.id}>
                      <span className={ui.who}>
                        <Avatar name={c.name} />
                        <span>
                          {c.name.split(" ")[0]}
                          <small>{formatTime(a.startsAt)}</small>
                        </span>
                      </span>
                      <span className={`script ${styles.tea}`}>
                        {c.teaOrder || "ask at the door"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
