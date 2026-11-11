"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  computeTotals,
  formatMoney,
  formatMoneyCompact,
  priceForLevel,
} from "@/lib/booking/pricing";
import { TIP_PRESETS } from "@/lib/domain/constants";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/domain/types";
import { useAdmin, useDemoSend } from "../AdminContext";
import { PageHead, Panel, ui } from "../primitives";
import styles from "./Checkout.module.css";

interface CartLine {
  key: string;
  kind: "service" | "product";
  refId: string;
  name: string;
  priceCents: number;
}

export function Checkout() {
  const { repo, toast, scopedStaffId, me, services, products, clients, staff, appointments } =
    useAdmin();
  const params = useSearchParams();
  const demoSend = useDemoSend();

  // Opened from the calendar ("Check out") or a client card ("Ring up")
  const apptParam = params.get("appointment");
  const fromAppt = apptParam ? appointments.find((a) => a.id === apptParam) : undefined;
  const fromService = fromAppt ? services.find((s) => s.id === fromAppt.serviceId) : undefined;

  const [cart, setCart] = useState<CartLine[]>(() =>
    fromAppt && fromService
      ? [
          {
            key: `appt-${fromAppt.id}`,
            kind: "service",
            refId: fromService.id,
            name: fromService.name,
            priceCents: fromAppt.priceCents,
          },
        ]
      : [],
  );
  const [clientId, setClientId] = useState<string>(
    fromAppt?.clientId ?? params.get("client") ?? "",
  );
  const [stylistId, setStylistId] = useState<string>(fromAppt?.staffId ?? scopedStaffId ?? "");
  const [tip, setTip] = useState<number>(15);
  const [retailQuery, setRetailQuery] = useState("");
  const [paying, setPaying] = useState(false);

  const stylist = staff.find((s) => s.id === stylistId);
  const totals = computeTotals(cart, tip);
  const clientChoices = clients.filter((c) => !scopedStaffId || c.stylistId === scopedStaffId);

  const retail = useMemo(
    () =>
      products.filter(
        (p) =>
          p.priceCents > 0 &&
          (!retailQuery ||
            `${p.brand} ${p.name}`.toLowerCase().includes(retailQuery.toLowerCase())),
      ),
    [products, retailQuery],
  );

  function addService(id: string) {
    const s = services.find((x) => x.id === id);
    if (!s) return;
    setCart((c) => [
      ...c,
      {
        key: `${id}-${c.length}-${Date.now()}`,
        kind: "service",
        refId: id,
        name: s.name,
        priceCents: priceForLevel(s, stylist?.level),
      },
    ]);
  }

  function addProduct(sku: string) {
    const p = products.find((x) => x.sku === sku);
    if (!p) return;
    if (cart.filter((l) => l.refId === sku).length >= p.stock) {
      toast(`Only ${p.stock} on hand`);
      return;
    }
    setCart((c) => [
      ...c,
      {
        key: `${sku}-${c.length}-${Date.now()}`,
        kind: "product",
        refId: sku,
        name: p.name,
        priceCents: p.priceCents,
      },
    ]);
  }

  function changeStylist(id: string) {
    setStylistId(id);
    const level = staff.find((s) => s.id === id)?.level;
    // re-price service lines for the chosen stylist (lines that came from an appointment keep their booked price)
    setCart((c) =>
      c.map((l) => {
        if (l.kind !== "service" || l.key.startsWith("appt-")) return l;
        const s = services.find((x) => x.id === l.refId);
        return s ? { ...l, priceCents: priceForLevel(s, level) } : l;
      }),
    );
  }

  async function pay(method: PaymentMethod) {
    setPaying(true);
    try {
      const sale = await repo.createSale({
        clientId: clientId || null,
        appointmentId: fromAppt?.id,
        paymentMethod: method,
        tipPercent: tip,
        lines: cart.map((l) =>
          l.kind === "service"
            ? { kind: "service" as const, serviceId: l.refId, staffId: stylistId || undefined }
            : { kind: "product" as const, sku: l.refId },
        ),
      });
      const client = clients.find((c) => c.id === clientId);
      if (client?.email) {
        await demoSend(
          {
            channel: "email",
            to: client.email,
            kind: "Receipt",
            subject: "Your Salon Rx receipt",
            body: `Thank you, ${client.name.split(" ")[0]}! ${sale.lines.map((l) => l.name).join(", ")}. Total ${formatMoney(sale.totalCents)} (${method}).`,
          },
          true,
        );
      }
      setCart([]);
      setClientId("");
      toast(
        `${method} · ${formatMoney(sale.totalCents)} paid. Receipt would send in the full build.`,
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not complete the sale");
    } finally {
      setPaying(false);
    }
  }

  return (
    <>
      <PageHead
        title="Checkout"
        sub="Services, retail and tips. Retail comes off inventory automatically."
      />
      <div className={styles.pos}>
        <Panel title="Services">
          <ul className={styles.pick}>
            {services
              .filter((s) => s.priceCents > 0)
              .map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => addService(s.id)}>
                    <b>{s.name}</b>
                    <span>
                      {formatMoneyCompact(priceForLevel(s, stylist?.level))}
                      {s.plus ? "+" : ""}
                    </span>
                  </button>
                </li>
              ))}
          </ul>
          <div className={`${ui.ph} ${styles.sub}`}>
            <h2 className={ui.panelTitle}>Retail</h2>
          </div>
          <input
            className={`${ui.inp} ${styles.search}`}
            type="search"
            placeholder="Search retail"
            aria-label="Search retail products"
            value={retailQuery}
            onChange={(e) => setRetailQuery(e.target.value)}
          />
          <ul className={styles.pick}>
            {retail.map((p) => (
              <li key={p.sku}>
                <button type="button" disabled={p.stock <= 0} onClick={() => addProduct(p.sku)}>
                  <b>{p.name}</b>
                  <span>
                    {p.brand} · {formatMoneyCompact(p.priceCents)} · {p.stock} left
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        <section className={styles.tkt} aria-label="Ticket">
          <div className={ui.ph}>
            <h2 className={ui.panelTitle}>Ticket</h2>
          </div>
          <div className={styles.who}>
            <div className={ui.fld}>
              <label htmlFor="co-client">Client</label>
              <select id="co-client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Walk-in</option>
                {clientChoices.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={ui.fld}>
              <label htmlFor="co-stylist">Stylist (sets the price level)</label>
              <select
                id="co-stylist"
                value={stylistId}
                onChange={(e) => changeStylist(e.target.value)}
                disabled={!!scopedStaffId}
              >
                <option value="">List price</option>
                {staff
                  .filter((s) => s.bookable)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          {cart.length ? (
            <ul className={ui.ls} aria-label="Items on the ticket">
              {cart.map((l, i) => (
                <li key={l.key} className={styles.ln} style={{ padding: "8px 0" }}>
                  <span>{l.name}</span>
                  <span>
                    {formatMoney(l.priceCents)}
                    <button
                      type="button"
                      aria-label={`Remove ${l.name}`}
                      onClick={() => setCart((c) => c.filter((_, j) => j !== i))}
                    >
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>Tap a service or product.</p>
          )}
          <div className={styles.tipLabel} id="tip-label" style={{ marginTop: 14 }}>
            Tip on services
          </div>
          <div className={styles.tips} role="group" aria-labelledby="tip-label">
            {TIP_PRESETS.map((p) => (
              <button key={p} type="button" aria-pressed={tip === p} onClick={() => setTip(p)}>
                {p ? `${p}%` : "None"}
              </button>
            ))}
          </div>
          <div className={styles.tot}>
            <span>Subtotal</span>
            <span>{formatMoney(totals.subtotalCents)}</span>
          </div>
          <div className={styles.tot}>
            <span>HST 13%</span>
            <span>{formatMoney(totals.taxCents)}</span>
          </div>
          <div className={styles.tot}>
            <span>Tip</span>
            <span>{formatMoney(totals.tipCents)}</span>
          </div>
          <div className={styles.grand}>
            <span>Total</span>
            <b>{formatMoney(totals.totalCents)}</b>
          </div>
          <div className={styles.pay}>
            {PAYMENT_METHODS.map((m, i) => (
              <Button
                key={m}
                size="sm"
                variant={i === 0 ? "blue" : "line"}
                disabled={!cart.length || paying}
                onClick={() => pay(m)}
              >
                {m}
              </Button>
            ))}
          </div>
          {me && (
            <p className={ui.muted} style={{ marginTop: 12, fontSize: 12.5 }}>
              Sales are recorded under {me.name}.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
