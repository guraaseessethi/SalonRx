"use client";

import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { formatMinutes } from "@/lib/booking/time";
import { CANCELLATION_NOTICE_HOURS, DAY_DISPLAY_ORDER, DAY_NAMES, LATE_CANCEL_FEE_CENTS } from "@/lib/domain/constants";
import type { ToggleSettingKey } from "@/lib/domain/types";
import { useAdmin } from "../AdminContext";
import { PageHead, Panel, ui } from "../primitives";

const TOGGLES: { key: ToggleSettingKey; label: string; description: string }[] = [
  { key: "acceptOnlineBookings", label: "Accept online bookings", description: "Pauses the booking form on the website." },
  { key: "depositRequired", label: "$25 deposit", description: "For colour and extension appointments." },
  { key: "patchTestPrompt", label: "Patch test prompt", description: "New colour clients book a test 48 hours before." },
  { key: "dayBeforeTexts", label: "Day-before texts", description: "Cuts no-shows and late cancels." },
  { key: "rebookNudges", label: "Rebook nudges", description: "6 weeks after colour." },
  { key: "reviewRequests", label: "Ask for a Google review", description: "2 hours after checkout." },
];

export function Settings() {
  const { repo, toast, settings } = useAdmin();
  return (
    <>
      <PageHead title="Settings" sub="Booking rules and policies." />
      <div className={`${ui.g} ${ui.g2}`}>
        <Panel title="Online booking">
          {TOGGLES.map((t) => (
            <Switch
              key={t.key}
              label={t.label}
              description={t.description}
              checked={settings[t.key]}
              onChange={async (v) => {
                await repo.setSetting(t.key, v);
                toast("Saved");
              }}
            />
          ))}
        </Panel>
        <div className={`${ui.g} ${ui.start}`}>
          <Panel title="Cancellation policy">
            <p style={{ fontSize: 14 }}>
              {CANCELLATION_NOTICE_HOURS} hours&apos; notice. Late cancellations: ${LATE_CANCEL_FEE_CENTS / 100} non-refundable rebooking charge. Clients with 3+ last-minute cancellations are not rebooked.
            </p>
          </Panel>
          <Panel title="Hours">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <caption className="sr-only">Opening hours</caption>
              <tbody>
                {DAY_DISPLAY_ORDER.map((i) => {
                  const h = settings.hours[i];
                  return (
                    <tr key={i}>
                      <th scope="row" style={{ textAlign: "left", fontWeight: 300, padding: "5px 0", fontSize: 14.5 }}>
                        {DAY_NAMES[i]}
                      </th>
                      <td style={{ textAlign: "right", fontFamily: "var(--head)", letterSpacing: "0.06em" }}>{h ? `${formatMinutes(h.openMin)} – ${formatMinutes(h.closeMin)}` : "Closed"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
          <Panel title="Demo data">
            <p className={ui.muted} style={{ marginBottom: 12, fontSize: 13.5 }}>
              Clients, sales and stock here are samples saved in this browser only.
            </p>
            <Button
              size="sm"
              variant="line"
              onClick={async () => {
                await repo.resetDemoData();
                toast("Demo data reset");
              }}
            >
              Reset demo data
            </Button>
          </Panel>
        </div>
      </div>
    </>
  );
}
