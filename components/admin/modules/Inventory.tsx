"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Table, tableClasses as t } from "@/components/ui/Table";
import { ToggleGroup } from "@/components/ui/ToggleGroup";
import { formatMoney, formatMoneyCompact } from "@/lib/booking/pricing";
import { newProductSchema, PRODUCT_TYPES, type Product } from "@/lib/domain/types";
import { useAdmin } from "../AdminContext";
import { Field, Kpi, PageHead, Panel, ui } from "../primitives";
import styles from "./Inventory.module.css";

type Filter = "All" | "Retail" | "Back bar" | "Extensions" | "Low";
const FILTERS = (["All", "Retail", "Back bar", "Extensions", "Low"] as const).map((f) => ({
  value: f,
  label: f === "Low" ? "Low stock" : f,
}));

export function Inventory() {
  const { repo, toast, products, reservations } = useAdmin();
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const q = query.toLowerCase();
  const list = products.filter(
    (p) =>
      (filter === "All" || (filter === "Low" ? p.stock <= p.par : p.type === filter)) &&
      (!q || `${p.brand} ${p.name} ${p.sku}`.toLowerCase().includes(q)),
  );
  const cost = products.reduce((s, p) => s + p.costCents * p.stock, 0);
  const shelf = products.reduce((s, p) => s + p.priceCents * p.stock, 0);
  const low = products.filter((p) => p.stock <= p.par);
  const orders = low.reduce<Record<string, Product[]>>(
    (acc, p) => ((acc[p.supplier] ??= []).push(p), acc),
    {},
  );

  async function addProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = newProductSchema.safeParse({
      name: f.name,
      brand: f.brand,
      type: f.type,
      costCents: Math.round(Number(f.cost || 0) * 100),
      priceCents: Math.round(Number(f.price || 0) * 100),
      stock: Math.max(0, Math.round(Number(f.stock || 0))),
      par: Math.max(0, Math.round(Number(f.par || 2))),
    });
    if (!parsed.success) {
      toast(parsed.error.issues[0]?.message ?? "Check the details");
      return;
    }
    await repo.createProduct(parsed.data);
    setAdding(false);
    toast("Product added");
  }

  return (
    <>
      <PageHead
        title="Inventory"
        sub="Retail shelf, Goldwell back bar and extension hair."
        actions={
          <Button size="sm" onClick={() => setAdding(true)}>
            + Product
          </Button>
        }
      />
      <div className={`${ui.g} ${ui.g4}`}>
        <Kpi
          label="Stock at cost"
          value={formatMoneyCompact(cost)}
          note={`${products.length} SKUs`}
        />
        <Kpi label="Shelf value" value={formatMoneyCompact(shelf)} note="retail price" />
        <Kpi label="At / below par" value={String(low.length)} note="reorder suggested" />
        <Kpi label="Curbside holds" value={String(reservations.length)} note="reserved online" />
      </div>
      <div className={`${ui.g} ${ui.g2} ${ui.top}`}>
        <Panel title="Stock">
          <div className={styles.tools}>
            <ToggleGroup
              label="Filter"
              variant="segment"
              options={FILTERS}
              value={filter}
              onChange={setFilter}
            />
            <input
              className={ui.inp}
              type="search"
              placeholder="Search"
              aria-label="Search inventory"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Table label="Inventory">
            <thead>
              <tr>
                <th>Product</th>
                <th>On hand</th>
                <th className={t.num}>Cost</th>
                <th className={t.num}>Retail</th>
                <th>
                  <span className="sr-only">Adjust</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const pct = Math.min(100, (p.stock / Math.max(1, p.par * 2)) * 100);
                const color =
                  p.stock <= 0 ? "var(--bad)" : p.stock <= p.par ? "var(--warn)" : "var(--ok)";
                return (
                  <tr key={p.sku}>
                    <td className={styles.name}>
                      {p.name}
                      <small>
                        {p.brand} · {p.type}
                      </small>
                    </td>
                    <td className={styles.onhand}>
                      {p.stock} <span>/ {p.par}</span>
                      {p.stock <= p.par && <span className="sr-only"> (at or below par)</span>}
                      <div className={styles.bar} aria-hidden="true">
                        <i style={{ "--w": `${pct}%`, "--c": color } as React.CSSProperties} />
                      </div>
                    </td>
                    <td className={t.num}>{formatMoney(p.costCents)}</td>
                    <td className={t.num}>{p.priceCents ? formatMoney(p.priceCents) : "—"}</td>
                    <td className={styles.adj}>
                      <Button
                        size="sm"
                        variant="line"
                        aria-label={`Use one ${p.name}`}
                        onClick={() => repo.adjustStock(p.sku, -1)}
                      >
                        −
                      </Button>{" "}
                      <Button
                        size="sm"
                        variant="line"
                        aria-label={`Receive one ${p.name}`}
                        onClick={() => repo.adjustStock(p.sku, 1)}
                      >
                        +
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Panel>
        <Panel title="Purchase orders" className={ui.start}>
          {Object.keys(orders).length ? (
            Object.entries(orders).map(([supplier, items]) => {
              const total = items.reduce((a, p) => a + (p.par * 2 - p.stock) * p.costCents, 0);
              return (
                <div key={supplier} className={styles.po}>
                  <small>{supplier}</small>
                  {items.map((p) => (
                    <div key={p.sku} className={styles.poLine}>
                      <span>{p.name}</span>
                      <span style={{ fontFamily: "var(--head)" }}>× {p.par * 2 - p.stock}</span>
                    </div>
                  ))}
                  <div className={styles.poFoot}>
                    <span>{formatMoney(total)}</span>
                    <Button
                      size="sm"
                      onClick={async () => {
                        await repo.receivePurchaseOrder(supplier);
                        toast(`Received from ${supplier}`);
                      }}
                    >
                      Mark received
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className={ui.muted}>All above par.</p>
          )}
        </Panel>
      </div>
      <Modal open={adding} title="Add product" onClose={() => setAdding(false)}>
        <form onSubmit={addProduct}>
          <div className={ui.fg}>
            <Field id="np-n" label="Product" full>
              <input id="np-n" name="name" required />
            </Field>
            <Field id="np-b" label="Brand">
              <input id="np-b" name="brand" />
            </Field>
            <Field id="np-ty" label="Type">
              <select id="np-ty" name="type">
                {PRODUCT_TYPES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field id="np-c" label="Cost">
              <input id="np-c" name="cost" type="number" step="0.01" min="0" />
            </Field>
            <Field id="np-p" label="Retail">
              <input id="np-p" name="price" type="number" step="0.01" min="0" />
            </Field>
            <Field id="np-s" label="On hand">
              <input id="np-s" name="stock" type="number" min="0" />
            </Field>
            <Field id="np-r" label="Reorder at">
              <input id="np-r" name="par" type="number" min="0" />
            </Field>
          </div>
          <div className={ui.bnav}>
            <Button variant="line" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
