import { describe, expect, it } from "vitest";
import { buildIcs } from "@/lib/booking/ics";
import { canAccess, visibleModules } from "@/lib/domain/permissions";
import { isDateKey, addDays, weekdayOf, formatMinutes, toDateKey } from "@/lib/booking/time";

describe("ics", () => {
  const ics = buildIcs({
    uid: "abc@salonrx",
    startsAt: "2026-11-18T15:00:00.000Z",
    endsAt: "2026-11-18T16:00:00.000Z",
    summary: "Cut & style, Salon Rx",
    description: "With Tanya; bring inspo, photos",
    location: "213 Bayfield Street, Barrie, ON",
  });

  it("is a valid calendar with CRLF line endings and UTC times", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261118T150000Z");
    expect(ics).toContain("DTEND:20261118T160000Z");
    expect(ics).not.toMatch(/[^\r]\n/);
  });

  it("escapes commas and semicolons", () => {
    expect(ics).toContain("DESCRIPTION:With Tanya\\; bring inspo\\, photos");
    expect(ics).toContain("LOCATION:213 Bayfield Street\\, Barrie\\, ON");
  });

  it("folds long lines at 75 octets", () => {
    const long = buildIcs({ uid: "x", startsAt: "2026-11-18T15:00:00Z", endsAt: "2026-11-18T16:00:00Z", summary: "a".repeat(200) });
    for (const line of long.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});

describe("permissions", () => {
  it("owner sees everything", () => {
    expect(canAccess("owner", "reports")).toBe(true);
    expect(canAccess("owner", "settings")).toBe(true);
  });
  it("front desk has no reports or settings", () => {
    expect(canAccess("frontdesk", "reports")).toBe(false);
    expect(canAccess("frontdesk", "settings")).toBe(false);
    expect(canAccess("frontdesk", "checkout")).toBe(true);
    expect(canAccess("frontdesk", "inventory")).toBe(true);
  });
  it("stylists only get their own day, clients and checkout", () => {
    expect([...visibleModules("stylist")]).toEqual(["dashboard", "calendar", "clients", "checkout"]);
  });
});

describe("salon clock helpers", () => {
  it("validates date keys", () => {
    expect(isDateKey("2026-11-18")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("nope")).toBe(false);
  });
  it("adds days across month and year ends", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("finds the weekday", () => {
    expect(weekdayOf("2026-11-18")).toBe(3);
    expect(weekdayOf("2026-11-22")).toBe(0);
  });
  it("formats minutes like the price list", () => {
    expect(formatMinutes(600)).toBe("10 am");
    expect(formatMinutes(14 * 60 + 30)).toBe("2:30 pm");
    expect(formatMinutes(12 * 60)).toBe("12 pm");
    expect(formatMinutes(0)).toBe("12 am");
  });
  it("uses the Toronto date, not the UTC date, late in the evening", () => {
    // 9 pm EST on Nov 18 is already Nov 19 in UTC
    expect(toDateKey("2026-11-19T02:00:00Z")).toBe("2026-11-18");
  });
  it("handles the daylight saving change (Mar 8, 2026)", () => {
    // After the spring change Toronto is on EDT, UTC-4
    expect(toDateKey("2026-03-09T03:30:00Z")).toBe("2026-03-08");
  });
});
