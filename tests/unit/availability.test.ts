import { describe, expect, it } from "vitest";
import {
  ANY_STAFF,
  canPerform,
  eligibleStaff,
  getOpenDays,
  getSlots,
  pickStaffForSlot,
} from "@/lib/booking/availability";
import { minutesOfDay } from "@/lib/booking/time";
import { appt, COLOUR, CUT, FRI, HOURS, LONG_AGO, SAT, SHORT, STAFF, SUN, WED } from "./fixtures";

const base = { staff: STAFF, appointments: [], hours: HOURS, now: LONG_AGO };
const times = (slots: { startsAt: string }[]) => slots.map((s) => minutesOfDay(s.startsAt));

describe("opening hours and the 30 minute grid", () => {
  it("offers 30 minute starts from opening until the service still fits", () => {
    const slots = getSlots({ ...base, date: WED, service: CUT, staffId: "senior" });
    const t = times(slots);
    expect(t[0]).toBe(10 * 60);
    expect(t[1]).toBe(10 * 60 + 30);
    // 60 minute cut must finish by 8 pm, so the last start is 7 pm
    expect(t.at(-1)).toBe(19 * 60);
    expect(t.every((m) => m % 30 === 0)).toBe(true);
  });

  it("uses the longer Saturday morning hours (8 am to 2 pm)", () => {
    const t = times(getSlots({ ...base, date: SAT, service: CUT, staffId: "senior" }));
    expect(t[0]).toBe(8 * 60);
    expect(t.at(-1)).toBe(13 * 60);
  });

  it("closes early on Friday (4 pm)", () => {
    const t = times(getSlots({ ...base, date: FRI, service: CUT, staffId: "senior" }));
    expect(t.at(-1)).toBe(15 * 60);
  });

  it("returns nothing on closed days", () => {
    expect(getSlots({ ...base, date: SUN, service: CUT, staffId: "senior" })).toEqual([]);
    expect(getSlots({ ...base, date: "2026-11-17", service: CUT, staffId: ANY_STAFF })).toEqual([]);
  });

  it("respects service duration: a 2 hour colour ends by closing time", () => {
    const t = times(getSlots({ ...base, date: FRI, service: COLOUR, staffId: "senior" }));
    expect(t.at(-1)).toBe(14 * 60);
  });

  it("handles durations that are not a multiple of 30 minutes", () => {
    const slots = getSlots({ ...base, date: WED, service: SHORT, staffId: "senior" });
    expect(minutesOfDay(slots[0].endsAt)).toBe(10 * 60 + 45);
    expect(times(slots).at(-1)).toBe(19 * 60);
  });

  it("converts salon-clock times to the right UTC instant (EST, UTC-5)", () => {
    const [first] = getSlots({ ...base, date: WED, service: CUT, staffId: "senior" });
    expect(first.startsAt).toBe("2026-11-18T15:00:00.000Z");
  });
});

describe("who can be booked", () => {
  it("only offers stylists on the days they work", () => {
    // junior does not work Wednesday
    expect(getSlots({ ...base, date: WED, service: CUT, staffId: "junior" })).toEqual([]);
    expect(
      getSlots({ ...base, date: FRI, service: CUT, staffId: "junior" }).length,
    ).toBeGreaterThan(0);
    // intermediate does not work Friday
    expect(getSlots({ ...base, date: FRI, service: CUT, staffId: "inter" })).toEqual([]);
  });

  it("junior stylists cannot take colour", () => {
    expect(getSlots({ ...base, date: FRI, service: COLOUR, staffId: "junior" })).toEqual([]);
    expect(canPerform(STAFF[2], COLOUR)).toBe(false);
    expect(canPerform(STAFF[2], CUT)).toBe(true);
    expect(eligibleStaff(STAFF, COLOUR).map((s) => s.id)).toEqual(["senior", "inter"]);
  });

  it("never offers staff who are not bookable online (front desk)", () => {
    expect(getSlots({ ...base, date: WED, service: CUT, staffId: "desk" })).toEqual([]);
    const slots = getSlots({ ...base, date: WED, service: CUT, staffId: ANY_STAFF });
    expect(slots.every((s) => !s.staffIds.includes("desk"))).toBe(true);
  });

  it("'anyone' lists every free eligible stylist and picks the first", () => {
    const [first] = getSlots({ ...base, date: WED, service: CUT, staffId: ANY_STAFF });
    expect(first.staffIds).toEqual(["senior", "inter"]);
    expect(pickStaffForSlot(first)).toBe("senior");
  });
});

describe("overlaps", () => {
  const taken = appt("senior", "2026-11-18T16:00:00.000Z", "2026-11-18T17:00:00.000Z"); // 11:00-12:00 local

  it("removes slots that overlap an existing appointment", () => {
    const t = times(
      getSlots({ ...base, appointments: [taken], date: WED, service: CUT, staffId: "senior" }),
    );
    expect(t).not.toContain(10 * 60 + 30); // 10:30-11:30 overlaps
    expect(t).not.toContain(11 * 60);
    expect(t).not.toContain(11 * 60 + 30);
    expect(t).toContain(10 * 60); // 10:00-11:00 ends exactly when the other starts
    expect(t).toContain(12 * 60); // starts exactly when the other ends
  });

  it("only blocks the stylist who is busy", () => {
    const slots = getSlots({
      ...base,
      appointments: [taken],
      date: WED,
      service: CUT,
      staffId: ANY_STAFF,
    });
    const eleven = slots.find((s) => minutesOfDay(s.startsAt) === 11 * 60);
    expect(eleven?.staffIds).toEqual(["inter"]);
  });

  it("frees the slot when the appointment is cancelled", () => {
    const cancelled = { ...taken, status: "cancelled" as const };
    const t = times(
      getSlots({ ...base, appointments: [cancelled], date: WED, service: CUT, staffId: "senior" }),
    );
    expect(t).toContain(11 * 60);
  });

  it("treats a no-show as still having held the time", () => {
    const noshow = { ...taken, status: "noshow" as const };
    const t = times(
      getSlots({ ...base, appointments: [noshow], date: WED, service: CUT, staffId: "senior" }),
    );
    expect(t).not.toContain(11 * 60);
  });
});

describe("no booking within 30 minutes of now", () => {
  // Wed 2026-11-18, 10:00 local = 15:00Z
  const at = (iso: string) => new Date(iso);

  it("hides slots starting within 30 minutes, including the boundary", () => {
    const now = at("2026-11-18T15:10:00Z"); // 10:10 local
    const t = times(getSlots({ ...base, now, date: WED, service: CUT, staffId: "senior" }));
    expect(t[0]).toBe(11 * 60); // 10:30 is exactly 20 minutes away, 11:00 is 50
  });

  it("allows a slot that is just over 30 minutes away", () => {
    const now = at("2026-11-18T15:29:00Z"); // 10:29, 10:30 is 1 minute away; 11:00 is 31
    const t = times(getSlots({ ...base, now, date: WED, service: CUT, staffId: "senior" }));
    expect(t[0]).toBe(11 * 60);
  });

  it("hides a slot exactly 30 minutes away", () => {
    const now = at("2026-11-18T15:30:00Z"); // 10:30 local, 11:00 is exactly 30 min away
    const t = times(getSlots({ ...base, now, date: WED, service: CUT, staffId: "senior" }));
    expect(t[0]).toBe(11 * 60 + 30);
  });

  it("returns nothing for a day that is already over", () => {
    const now = at("2026-11-19T02:00:00Z");
    expect(getSlots({ ...base, now, date: WED, service: CUT, staffId: ANY_STAFF })).toEqual([]);
  });
});

describe("getOpenDays", () => {
  it("counts open slots per date and shows closed days as zero", () => {
    const days = getOpenDays({
      ...base,
      from: "2026-11-16",
      days: 7,
      service: CUT,
      staffId: "senior",
    });
    expect(days.map((d) => d.date)).toEqual([
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
    ]);
    expect(days[0].open).toBe(0);
    expect(days[1].open).toBe(0);
    expect(days[2].open).toBeGreaterThan(0);
    expect(days[6].open).toBe(0);
  });
});
