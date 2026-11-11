"use client";

import { formatDayShort, formatTime } from "@/lib/booking/time";
import { Table } from "@/components/ui/Table";
import { useAdmin } from "../AdminContext";
import { PageHead, Panel, Status, ui } from "../primitives";

export function Outbox() {
  const { outbox } = useAdmin();
  return (
    <>
      <PageHead title="Demo outbox" sub="Every text and email the full build would send. Nothing leaves this browser." />
      <Panel>
        {outbox.length === 0 ? (
          <p className={ui.muted}>Nothing yet. Make a booking on the website, confirm one in the calendar, or text a client from Marketing.</p>
        ) : (
          <Table label="Demo outbox">
            <thead>
              <tr>
                <th>When</th>
                <th>Type</th>
                <th>To</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {outbox.map((m) => (
                <tr key={m.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {formatDayShort(m.at)} {formatTime(m.at)}
                  </td>
                  <td>
                    <Status tone={m.channel === "sms" ? "rx" : "mute"}>{m.channel === "sms" ? "Text" : "Email"}</Status>
                    <div style={{ fontSize: 12, color: "var(--gray)" }}>{m.kind}</div>
                  </td>
                  <td>{m.to}</td>
                  <td style={{ whiteSpace: "pre-wrap", maxWidth: 420 }}>
                    {m.subject && <b>{m.subject}</b>}
                    {m.subject && <br />}
                    {m.body}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}
