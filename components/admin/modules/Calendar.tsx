"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatMoneyCompact } from "@/lib/booking/pricing";
import {
  addDays,
  formatDateKeyLong,
  formatMinutes,
  formatTime,
  instantAt,
  isDateKey,
  minutesOfDay,
  toDateKey,
  weekdayOf,
  type DateKey,
} from "@/lib/booking/time";
import { BookingError } from "@/lib/data/repository";
import { isScopedToOwnWork } from "@/lib/domain/permissions";
import type { Appointment } from "@/lib/domain/types";
import { useAdmin, useDemoSend } from "../AdminContext";
import { ApptStatus, Field, PageHead, ui } from "../primitives";
import styles from "./Calendar.module.css";

const START_HOUR = 8;
const END_HOUR = 20;
const PX = 56;

const TIME_OPTIONS = Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => (START_HOUR * 60) + i * 30);

export function Calendar() {
  const { repo, toast, role, scopedStaffId, staff, clients, services, appointments, settings, now, today, openDay } = useAdmin();
  const params = useSearchParams();
  const router = useRouter();
  const demoSend = useDemoSend();

  const paramDate = params.get("date");
  const [day, setDay] = useState<DateKey>(paramDate && isDateKey(paramDate) ? paramDate : openDay);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newClient, setNewClient] = useState<string | null>(params.get("new"));
  const [adding, setAdding] = useState(!!params.get("new"));

  const weekday = weekdayOf(day);
  const hours = settings.hours[weekday];
  const columns = staff.filter((s) => s.bookable && (!scopedStaffId || s.id === scopedStaffId));
  const list = appointments.filter((a) => a.status !== "cancelled" && toDateKey(a.startsAt) === day);
  const selected = selectedId ? appointments.find((a) => a.id === selectedId) : undefined;

  const svc = (id: string) => services.find((s) => s.id === id);
  const cli = (id: string) => clients.find((c) => c.id === id);
  const nowMin = minutesOfDay(now);
  const showNow = day === today && nowMin / 60 > START_HOUR && nowMin / 60 < END_HOUR;

  const clientChoices = clients.filter((c) => !scopedStaffId || c.stylistId === scopedStaffId || appointments.some((a) => a.clientId === c.id && a.staffId === scopedStaffId));

  async function setStatus(a: Appointment, status: Appointment["status"]) {
    await repo.setAppointmentStatus(a.id, status);
    setSelectedId(null);
    const c = cli(a.clientId);
    if (status === "confirmed" && c) {
      await demoSend({ channel: "sms", to: c.phone, kind: "Appointment confirmed", body: `Hi ${c.name.split(" ")[0]}, you're confirmed for ${formatTime(a.startsAt)}. See you at Salon Rx! Reply C to confirm.` });
    } else {
      toast("Updated");
    }
  }

  async function addAppointment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await repo.createStaffAppointment({
        clientId: String(f.get("client")),
        serviceId: String(f.get("service")),
        staffId: String(f.get("stylist")),
        startsAt: instantAt(day, Number(f.get("time"))).toISOString(),
      });
      setAdding(false);
      toast("Added to the calendar");
    } catch (err) {
      toast(err instanceof BookingError ? err.message : "Could not add that appointment");
    }
  }

  const canTouch = (a: Appointment) => !isScopedToOwnWork(role) || a.staffId === scopedStaffId;

  return (
    <>
      <PageHead
        title="Calendar"
        sub={
          <>
            {formatDateKeyLong(day)} · {hours ? `${formatMinutes(hours.openMin)} – ${formatMinutes(hours.closeMin)}` : "Salon closed"} · {list.filter((a) => !scopedStaffId || a.staffId === scopedStaffId).length} booked
          </>
        }
        actions={
          <>
            <Button size="sm" variant="line" aria-label="Previous day" onClick={() => setDay(addDays(day, -1))}>
              ‹
            </Button>
            <Button size="sm" variant="line" onClick={() => setDay(openDay)}>
              Today
            </Button>
            <Button size="sm" variant="line" aria-label="Next day" onClick={() => setDay(addDays(day, 1))}>
              ›
            </Button>
            <Button size="sm" onClick={() => setAdding(true)}>
              + Appointment
            </Button>
          </>
        }
      />
      <div className={styles.cw} role="region" aria-label={`Calendar for ${formatDateKeyLong(day)}`} tabIndex={0}>
        <div
          className={styles.cal}
          style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(118px, 1fr))`, "--px": `${PX}px`, "--hours": END_HOUR - START_HOUR } as React.CSSProperties}
        >
          <div className={styles.col} aria-hidden="true">
            <div className={styles.ch} />
            {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
              <div key={i} className={styles.tl}>
                {formatMinutes((START_HOUR + i) * 60)}
              </div>
            ))}
          </div>
          {columns.map((s) => {
            const off = !s.workDays.includes(weekday) || !hours;
            const mine = list.filter((a) => a.staffId === s.id);
            return (
              <div key={s.id} className={styles.col} role="group" aria-label={`${s.name}${off ? ", not working" : `, ${mine.length} appointments`}`}>
                <h2 className={styles.ch}>
                  {s.name.split(" ")[0]} <small>{s.level === "intermediate" ? "Int." : s.level === "junior" ? "Jr." : ""}</small>
                </h2>
                <div className={`${styles.sc} ${off ? styles.off : ""}`}>
                  {showNow && <div className={styles.nowl} style={{ "--top": `${(nowMin / 60 - START_HOUR) * PX}px` } as React.CSSProperties} />}
                  {mine.map((a) => {
                    const sv = svc(a.serviceId);
                    const c = cli(a.clientId);
                    const startMin = minutesOfDay(a.startsAt);
                    const dur = (new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime()) / 60_000;
                    const top = (startMin / 60 - START_HOUR) * PX;
                    const h = Math.max(26, (dur / 60) * PX - 3);
                    const cls = [styles.ap, sv?.category === "Colour" ? styles.colour : sv?.id === "t-ext" ? styles.ext : "", a.status === "new" ? styles.isnew : ""].join(" ");
                    return (
                      <button
                        key={a.id}
                        type="button"
                        className={cls}
                        style={{ "--top": `${top}px`, "--h": `${h}px` } as React.CSSProperties}
                        onClick={() => setSelectedId(a.id)}
                        aria-label={`${formatTime(a.startsAt)}, ${c?.name ?? "Client"}, ${sv?.name ?? ""}, ${dur} minutes${a.status === "new" ? ", new online booking" : ""}`}
                      >
                        {h < 44 ? (
                          <b>
                            {formatTime(a.startsAt)} {c?.name.split(" ")[0]}
                          </b>
                        ) : (
                          <>
                            <span className={styles.tm2}>
                              {formatTime(a.startsAt)} · {dur}m
                            </span>
                            <b>{c?.name}</b>
                            {sv?.name}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.legend}>
        <span>
          <i style={{ background: "var(--cobalt-soft)", borderLeft: "3px solid var(--cobalt)" }} />
          Colour
        </span>
        <span>
          <i style={{ background: "var(--bone)", borderLeft: "3px solid var(--gold)" }} />
          Extensions
        </span>
        <span>
          <i style={{ background: "var(--bone)", borderLeft: "3px solid var(--ink)" }} />
          Cut &amp; style
        </span>
        <span>
          <i style={{ outline: "1px dashed var(--cobalt)" }} />
          New online booking
        </span>
      </div>

      <Modal open={!!selected} title={cli(selected?.clientId ?? "")?.name ?? "Appointment"} onClose={() => setSelectedId(null)}>
        {selected && (
          <div className={styles.detail}>
            <p>
              {svc(selected.serviceId)?.name} · {formatTime(selected.startsAt)} · {(new Date(selected.endsAt).getTime() - new Date(selected.startsAt).getTime()) / 60_000} min · {formatMoneyCompact(selected.priceCents)}
            </p>
            <p className={styles.sub}>
              With {staff.find((s) => s.id === selected.staffId)?.name} · <ApptStatus status={selected.status} />
            </p>
            {selected.note && <p className={styles.sub}>Note: {selected.note}</p>}
            {cli(selected.clientId)?.allergy && <div className={styles.alert}>Allergy: {cli(selected.clientId)?.allergy}</div>}
            <div className={styles.fx}>{cli(selected.clientId)?.formula}</div>
            <p className={`script ${styles.tea}`}>Tea order: {cli(selected.clientId)?.teaOrder || "ask at the door"}</p>
            {canTouch(selected) && (
              <div className={styles.actions}>
                {(selected.status === "new" || selected.status === "pending") && (
                  <Button size="sm" variant="blue" onClick={() => setStatus(selected, "confirmed")}>
                    Confirm
                  </Button>
                )}
                <Button size="sm" variant="line" onClick={() => setStatus(selected, "arrived")}>
                  Check in
                </Button>
                <Button size="sm" onClick={() => router.push(`/admin/checkout?appointment=${selected.id}`)}>
                  Check out
                </Button>
                <Button size="sm" variant="line" onClick={() => setStatus(selected, "noshow")}>
                  No-show
                </Button>
                <Button size="sm" variant="danger" onClick={() => setStatus(selected, "cancelled")}>
                  Cancel
                </Button>
                <Button size="sm" variant="line" onClick={() => setSelectedId(null)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={adding} title="New appointment" onClose={() => setAdding(false)}>
        <form onSubmit={addAppointment}>
          <div className={ui.fg}>
            <Field id="na-c" label="Client" full>
              <select id="na-c" name="client" defaultValue={newClient ?? clientChoices[0]?.id}>
                {clientChoices.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="na-v" label="Service" full>
              <select id="na-v" name="service">
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.durationMin}m
                  </option>
                ))}
              </select>
            </Field>
            <Field id="na-s" label="Stylist">
              <select id="na-s" name="stylist" defaultValue={scopedStaffId ?? undefined}>
                {columns.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="na-t" label="Time">
              <select id="na-t" name="time" defaultValue={600}>
                {TIME_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {formatMinutes(m)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className={ui.bnav}>
            <Button variant="line" onClick={() => { setAdding(false); setNewClient(null); }}>
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
