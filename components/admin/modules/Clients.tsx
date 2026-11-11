"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Table, tableClasses as t } from "@/components/ui/Table";
import { formatMoneyCompact } from "@/lib/booking/pricing";
import { formatDayShort, formatTime } from "@/lib/booking/time";
import { newClientSchema } from "@/lib/domain/types";
import { useAdmin } from "../AdminContext";
import { ApptStatus, Avatar, Field, PageHead, Panel, Status, ui } from "../primitives";
import styles from "./Clients.module.css";

const DAY_MS = 86_400_000;

function FormulaEditor({
  initial,
  onSave,
  actions,
}: {
  initial: string;
  onSave: (value: string) => void;
  actions: React.ReactNode;
}) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <textarea
        id="fx"
        className={styles.fx}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className={styles.btns}>
        <Button size="sm" onClick={() => onSave(value.trim())} disabled={value.trim() === initial}>
          Save formula
        </Button>
        {actions}
      </div>
    </>
  );
}

export function Clients() {
  const { repo, toast, scopedStaffId, clients, staff, appointments, sales, services, now } =
    useAdmin();
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(params.get("client"));
  const [adding, setAdding] = useState(false);

  const visible = useMemo(
    () =>
      clients.filter(
        (c) =>
          !scopedStaffId ||
          c.stylistId === scopedStaffId ||
          appointments.some((a) => a.clientId === c.id && a.staffId === scopedStaffId),
      ),
    [clients, appointments, scopedStaffId],
  );
  const list = visible.filter(
    (c) => !query || `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(query.toLowerCase()),
  );
  const client = visible.find((c) => c.id === selectedId) ?? visible[0];

  if (!client) {
    return (
      <>
        <PageHead title="Clients" sub="Formulas, history and the little things" />
        <Panel>
          <p className={ui.muted}>No clients yet.</p>
        </Panel>
      </>
    );
  }

  const stylist = staff.find((s) => s.id === client.stylistId);
  const patchAgeDays = client.patchTestAt
    ? Math.floor((now.getTime() - new Date(client.patchTestAt).getTime()) / DAY_MS)
    : null;
  const lastInDays = client.lastVisitAt
    ? Math.floor((now.getTime() - new Date(client.lastVisitAt).getTime()) / DAY_MS)
    : null;
  const svcName = (id: string) => services.find((s) => s.id === id)?.name ?? "";
  const appts = appointments
    .filter((a) => a.clientId === client.id && a.status !== "cancelled")
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const clientSales = sales
    .filter((s) => s.clientId === client.id)
    .sort((a, b) => b.at.localeCompare(a.at));

  async function addClient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = newClientSchema.safeParse({
      name: f.name,
      phone: f.phone,
      email: f.email,
      stylistId: f.stylist,
      teaOrder: f.tea,
      allergy: f.allergy,
    });
    if (!parsed.success) {
      toast(parsed.error.issues[0]?.message ?? "Check the details");
      return;
    }
    const created = await repo.createClient(parsed.data);
    setSelectedId(created.id);
    setAdding(false);
    toast("Client added");
  }

  return (
    <>
      <PageHead
        title="Clients"
        sub={`${visible.length} clients · formulas, history and the little things`}
        actions={
          <Button size="sm" onClick={() => setAdding(true)}>
            + Client
          </Button>
        }
      />
      <div className={styles.cg}>
        <Panel title="All clients">
          <input
            className={`${ui.inp} ${styles.search}`}
            type="search"
            placeholder="Search name, phone or email"
            aria-label="Search clients"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Table label="Clients">
            <thead>
              <tr>
                <th>Client</th>
                <th>Last in</th>
                <th className={t.num}>Lifetime</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const days = c.lastVisitAt
                  ? Math.floor((now.getTime() - new Date(c.lastVisitAt).getTime()) / DAY_MS)
                  : null;
                return (
                  <tr key={c.id} className={c.id === client.id ? t.selected : t.row}>
                    <td>
                      <button
                        type="button"
                        className={styles.pick}
                        aria-pressed={c.id === client.id}
                        onClick={() => setSelectedId(c.id)}
                      >
                        <span className={ui.who}>
                          <Avatar name={c.name} />
                          <span>
                            {c.name}
                            <small>
                              {staff.find((s) => s.id === c.stylistId)?.name.split(" ")[0]}&apos;s
                              client
                            </small>
                          </span>
                        </span>
                      </button>
                    </td>
                    <td>
                      {c.lastVisitAt ? (
                        <>
                          {formatDayShort(c.lastVisitAt)}{" "}
                          {days !== null && days >= 42 && <Status tone="warn">Due</Status>}
                        </>
                      ) : (
                        <Status tone="rx">New</Status>
                      )}
                    </td>
                    <td className={t.num}>{formatMoneyCompact(c.spendCents)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Panel>
        <div className={`${ui.g} ${ui.start}`}>
          <section className={styles.ccard} aria-label={`${client.name}, client card`}>
            <div className={styles.hd}>
              <div>
                <h2>{client.name}</h2>
                <div className={styles.since}>
                  Since {client.since} · {client.visits} visits ·{" "}
                  {formatMoneyCompact(client.spendCents)}
                </div>
              </div>
              <span className={styles.rxbig} aria-hidden="true">
                Rx
              </span>
            </div>
            <dl className={styles.dl}>
              <dt>Stylist</dt>
              <dd>{stylist?.name ?? "—"}</dd>
              <dt>Contact</dt>
              <dd>
                {client.phone}
                <br />
                {client.email}
              </dd>
              <dt>
                <label htmlFor="fx">Formula</label>
              </dt>
              <dd>
                {/* keyed so the editor resets when another client is chosen or the saved formula changes */}
                <FormulaEditor
                  key={`${client.id}:${client.formula}`}
                  initial={client.formula}
                  onSave={async (value) => {
                    await repo.updateClient(client.id, { formula: value });
                    toast("Formula saved");
                  }}
                  actions={
                    <>
                      <Button
                        size="sm"
                        variant="line"
                        onClick={() => router.push(`/admin/calendar?new=${client.id}`)}
                      >
                        Book next
                      </Button>
                      <Button
                        size="sm"
                        variant="line"
                        onClick={() => router.push(`/admin/checkout?client=${client.id}`)}
                      >
                        Ring up
                      </Button>
                    </>
                  }
                />
              </dd>
              <dt>Patch test</dt>
              <dd>
                {patchAgeDays === null ? (
                  <Status tone="warn">Not on file</Status>
                ) : patchAgeDays > 180 ? (
                  <Status tone="bad">Expired · {formatDayShort(client.patchTestAt!)}</Status>
                ) : (
                  <Status tone="ok">Valid · {formatDayShort(client.patchTestAt!)}</Status>
                )}
              </dd>
              <dt>Tea order</dt>
              <dd className={`script ${styles.tea}`}>{client.teaOrder || "—"}</dd>
              <dt>Notes</dt>
              <dd>{client.notes}</dd>
            </dl>
            {client.allergy && <div className={styles.alert}>Allergy: {client.allergy}</div>}
          </section>
          <Panel title="History">
            {appts.length + clientSales.length === 0 && lastInDays === null ? (
              <p className={ui.muted}>First visit coming up.</p>
            ) : (
              <ul className={styles.hist}>
                {appts.map((a) => (
                  <li key={a.id}>
                    <span>{formatDayShort(a.startsAt)}</span>
                    <span>
                      {svcName(a.serviceId)} · {formatTime(a.startsAt)} ·{" "}
                      {staff.find((s) => s.id === a.staffId)?.name.split(" ")[0]}
                    </span>
                    <ApptStatus status={a.status} />
                  </li>
                ))}
                {clientSales.map((s) => (
                  <li key={s.id}>
                    <span>{formatDayShort(s.at)}</span>
                    <span>Sale · {s.lines.map((l) => l.name).join(", ")}</span>
                    <span>{formatMoneyCompact(s.totalCents)}</span>
                  </li>
                ))}
                {client.lastVisitAt && (
                  <li>
                    <span>{formatDayShort(client.lastVisitAt)}</span>
                    <span>Last visit · {client.formula.split("\n")[0]}</span>
                    <span>
                      {client.visits
                        ? formatMoneyCompact(Math.round(client.spendCents / client.visits))
                        : ""}
                    </span>
                  </li>
                )}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <Modal open={adding} title="New client" onClose={() => setAdding(false)}>
        <form onSubmit={addClient}>
          <div className={ui.fg}>
            <Field id="nc-n" label="Name" full>
              <input id="nc-n" name="name" required />
            </Field>
            <Field id="nc-p" label="Mobile">
              <input id="nc-p" name="phone" type="tel" />
            </Field>
            <Field id="nc-e" label="Email">
              <input id="nc-e" name="email" type="email" />
            </Field>
            <Field id="nc-s" label="Stylist">
              <select id="nc-s" name="stylist" defaultValue={scopedStaffId ?? undefined}>
                {staff
                  .filter((s) => s.bookable && (!scopedStaffId || s.id === scopedStaffId))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field id="nc-t" label="Tea order">
              <input id="nc-t" name="tea" placeholder="Oat latte" />
            </Field>
            <Field id="nc-a" label="Allergies" full>
              <input id="nc-a" name="allergy" />
            </Field>
          </div>
          <div className={ui.bnav}>
            <Button variant="line" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
