import type { Appointment, Service, Staff, WeekHours } from "@/lib/domain/types";

/** Wed-Thu 10-8, Fri 10-4, Sat 8-2, closed Sun-Tue. */
export const HOURS: WeekHours = [
  null,
  null,
  null,
  { openMin: 600, closeMin: 1200 },
  { openMin: 600, closeMin: 1200 },
  { openMin: 600, closeMin: 960 },
  { openMin: 480, closeMin: 840 },
];

export const STAFF: Staff[] = [
  { id: "senior", name: "Sen Ior", level: "senior", role: "Senior stylist", bio: "", workDays: [3, 4, 5, 6], bookable: true },
  { id: "inter", name: "Inter Med", level: "intermediate", role: "Intermediate stylist", bio: "", workDays: [3, 4, 6], bookable: true },
  { id: "junior", name: "Jun Ior", level: "junior", role: "Junior stylist", bio: "", workDays: [4, 5, 6], bookable: true },
  { id: "desk", name: "Front Desk", level: "desk", role: "Front desk", bio: "", workDays: [3, 4, 5, 6], bookable: false },
];

export const CUT: Service = { id: "cut", category: "Cut", name: "Cut & style", priceCents: 7500, durationMin: 60, tiered: true, plus: false };
export const COLOUR: Service = { id: "col", category: "Colour", name: "All over", priceCents: 10000, durationMin: 120, tiered: true, plus: true };
export const SHORT: Service = { id: "short", category: "Cut", name: "Men's cut", priceCents: 4500, durationMin: 45, tiered: true, plus: false };

/** A Wednesday, a Friday, a Saturday and a Sunday in November 2026 (Toronto is on EST, UTC-5). */
export const WED = "2026-11-18";
export const FRI = "2026-11-20";
export const SAT = "2026-11-21";
export const SUN = "2026-11-22";

/** A moment well before every test date, so the "30 minutes from now" rule does not interfere. */
export const LONG_AGO = new Date("2026-11-01T12:00:00Z");

export function appt(staffId: string, startsAt: string, endsAt: string, status: Appointment["status"] = "confirmed"): Appointment {
  return {
    id: `${staffId}-${startsAt}`,
    staffId,
    clientId: "c",
    serviceId: "cut",
    startsAt,
    endsAt,
    status,
    source: "seed",
    priceCents: 0,
    note: "",
    createdAt: "2026-11-01T12:00:00Z",
  };
}
