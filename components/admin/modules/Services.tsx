"use client";

import { Table, tableClasses as t } from "@/components/ui/Table";
import { formatMoneyCompact, priceForLevel } from "@/lib/booking/pricing";
import { canEditCatalog } from "@/lib/domain/permissions";
import type { Service } from "@/lib/domain/types";
import { useAdmin } from "../AdminContext";
import { PageHead, Panel, Status, ui } from "../primitives";

function NumberCell({ value, step, min, label, width, onCommit }: { value: number; step: number; min: number; label: string; width: number; onCommit: (v: number) => void }) {
  return (
    <input
      // remount when the stored value changes so the field never shows stale text
      key={value}
      className={ui.inp}
      type="number"
      min={min}
      step={step}
      defaultValue={value}
      aria-label={label}
      style={{ width, textAlign: "right" }}
      onBlur={(e) => {
        const v = Number(e.target.value);
        if (Number.isFinite(v) && v !== value && v >= min) onCommit(v);
        else e.target.value = String(value);
      }}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
    />
  );
}

export function Services() {
  const { repo, toast, services, role } = useAdmin();
  const editable = canEditCatalog(role);

  async function update(s: Service, patch: Partial<Pick<Service, "priceCents" | "durationMin">>, message: string) {
    await repo.updateService(s.id, patch);
    toast(message);
  }

  return (
    <>
      <PageHead title="Services" sub="Edit a price here and the website's price list updates. Intermediate stylists are priced 25% off cut and colour automatically." />
      {!editable && (
        <p className={ui.muted} style={{ marginBottom: 14 }}>
          <Status tone="mute">View only</Status> Only the owner can change prices and durations.
        </p>
      )}
      <Panel>
        <Table label="Services and prices">
          <thead>
            <tr>
              <th>Service</th>
              <th>Category</th>
              <th className={t.num}>Minutes</th>
              <th className={t.num}>Senior</th>
              <th className={t.num}>Intermediate</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>
                  <Status tone="mute">{s.category}</Status>
                </td>
                <td className={t.num}>
                  {editable ? (
                    <NumberCell value={s.durationMin} min={15} step={15} width={76} label={`Minutes, ${s.name}`} onCommit={(v) => update(s, { durationMin: v }, "Duration updated")} />
                  ) : (
                    s.durationMin
                  )}
                </td>
                <td className={t.num}>
                  {editable ? (
                    <NumberCell value={s.priceCents / 100} min={0} step={5} width={84} label={`Price in dollars, ${s.name}`} onCommit={(v) => update(s, { priceCents: Math.round(v * 100) }, "Price updated on the website")} />
                  ) : (
                    formatMoneyCompact(s.priceCents)
                  )}
                </td>
                <td className={t.num} style={{ color: "var(--gray)" }}>
                  {s.tiered && s.priceCents ? formatMoneyCompact(priceForLevel(s, "intermediate")) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
