"use client";

import { useRepoQuery } from "@/components/providers/RepositoryProvider";
import { Button } from "@/components/ui/Button";
import { Table, tableClasses as t } from "@/components/ui/Table";
import { formatMoneyCompact } from "@/lib/booking/pricing";
import { queries } from "@/lib/data/queries";
import { useAdmin } from "../AdminContext";
import { Kpi, PageHead, Panel, ui } from "../primitives";
import styles from "./Reports.module.css";

const W = 640;
const H = 240;
const PD = 40;
const MAX = 8000;

export function Reports() {
  const { toast } = useAdmin();
  const { data: r } = useRepoQuery(queries.reports);
  if (!r) return <PageHead title="Reports" sub="Last 8 weeks." />;

  const bw = (W - PD - 8) / r.weeks.length;
  const y0 = H - 26;
  const scale = (cents: number) => (cents / 100 / MAX) * (H - 44);
  const last = r.weeks.at(-1)!;

  return (
    <>
      <PageHead
        title="Reports"
        sub="Last 8 weeks."
        actions={
          <Button
            size="sm"
            variant="line"
            onClick={() => toast("In the live system this downloads a CSV")}
          >
            Export for bookkeeper
          </Button>
        }
      />
      <div className={`${ui.g} ${ui.g4}`}>
        <Kpi
          label="Revenue · 8 wks"
          value={formatMoneyCompact(r.kpis.revenue8wCents)}
          note={`+${r.kpis.revenueChangePercent}% vs prior 8`}
          up
        />
        <Kpi
          label="Average ticket"
          value={formatMoneyCompact(r.kpis.avgTicketCents)}
          note={`+${formatMoneyCompact(r.kpis.avgTicketChangeCents)}`}
          up
        />
        <Kpi
          label="New clients"
          value={String(r.kpis.newClients)}
          note={`${r.kpis.onlineNewClients} booked online`}
          up
        />
        <Kpi
          label="Late cancels"
          value={`${r.kpis.lateCancelPercent}%`}
          note={`$50 fee collected ${r.kpis.lateFeesCollected}×`}
        />
      </div>
      <div className={`${ui.g} ${ui.g2} ${ui.top}`}>
        <Panel
          title="Weekly revenue"
          actions={r.isSample ? <span className={styles.demo}>Sample figures</span> : undefined}
          className={styles.chart}
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`Weekly revenue over 8 weeks, rising from about ${formatMoneyCompact(r.weeks[0].servicesCents + r.weeks[0].retailCents)} to ${formatMoneyCompact(last.servicesCents + last.retailCents)}`}
          >
            {[0, 2000, 4000, 6000, 8000].map((v) => {
              const y = y0 - (v / MAX) * (H - 44);
              return (
                <g key={v}>
                  <line x1={PD} x2={W - 4} y1={y} y2={y} stroke="var(--rule)" />
                  <text
                    x={PD - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="var(--gray)"
                    fontFamily="var(--head)"
                  >
                    {v ? `$${v / 1000}k` : "0"}
                  </text>
                </g>
              );
            })}
            {r.weeks.map((w, i) => {
              const x = PD + 8 + i * bw;
              const hs = scale(w.servicesCents);
              const hr = scale(w.retailCents);
              const total = w.servicesCents + w.retailCents;
              return (
                <g key={w.label}>
                  <rect x={x} y={y0 - hs} width={bw - 16} height={hs} fill="var(--ink)" />
                  <rect x={x} y={y0 - hs - hr} width={bw - 16} height={hr} fill="var(--cobalt)" />
                  {i === r.weeks.length - 1 && (
                    <text
                      x={x + (bw - 16) / 2}
                      y={y0 - hs - hr - 7}
                      textAnchor="middle"
                      fontSize="12"
                      fill="var(--ink)"
                      fontFamily="var(--head)"
                    >
                      ${(total / 100000).toFixed(1)}k
                    </text>
                  )}
                  <text
                    x={x + (bw - 16) / 2}
                    y={H - 8}
                    textAnchor="middle"
                    fontSize="10.5"
                    fill="var(--gray)"
                    fontFamily="var(--head)"
                  >
                    {w.label}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className={styles.legend}>
            <span>
              <i style={{ background: "var(--ink)" }} />
              Services
            </span>
            <span>
              <i style={{ background: "var(--cobalt)" }} />
              Retail
            </span>
          </div>
          <details className={styles.details}>
            <summary>View as a table</summary>
            <Table label="Weekly revenue figures">
              <thead>
                <tr>
                  <th>Week</th>
                  <th className={t.num}>Services</th>
                  <th className={t.num}>Retail</th>
                </tr>
              </thead>
              <tbody>
                {r.weeks.map((w) => (
                  <tr key={w.label}>
                    <td>{w.label}</td>
                    <td className={t.num}>{formatMoneyCompact(w.servicesCents)}</td>
                    <td className={t.num}>{formatMoneyCompact(w.retailCents)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </details>
        </Panel>
        <Panel title="Service mix">
          {r.mix.map((m, i) => (
            <div key={m.label} className={styles.hb}>
              <span>{m.label}</span>
              <span className={styles.tr} aria-hidden="true">
                <i
                  className={i === 0 ? "b" : undefined}
                  style={
                    {
                      "--w": `${(m.percent / r.mix[0].percent) * 100}%`,
                      background: i === 0 ? "var(--cobalt)" : undefined,
                    } as React.CSSProperties
                  }
                />
              </span>
              <span className={styles.n}>{m.percent}%</span>
            </div>
          ))}
        </Panel>
      </div>
    </>
  );
}
