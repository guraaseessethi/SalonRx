import { MIN_LEAD_MINUTES, SLOT_MINUTES } from "@/lib/domain/constants";
import {
  BLOCKING_STATUSES,
  type Appointment,
  type Service,
  type Staff,
  type WeekHours,
} from "@/lib/domain/types";
import { addDays, addMinutes, instantAt, weekdayOf, type DateKey } from "./time";

/**
 * Pure availability rules. No clock, no storage: everything is passed in, so the same code runs
 * in the browser mock today and behind the database function in Phase 2.
 *
 * Rules:
 *  - the salon must be open that weekday; slots sit on a 30 minute grid starting at opening
 *  - the whole service must finish by closing time
 *  - the stylist must be bookable and work that weekday
 *  - junior stylists cannot take colour
 *  - a slot must start more than 30 minutes from now
 *  - a slot cannot overlap the stylist's existing (non-cancelled) appointments
 */

export const ANY_STAFF = "any";

export type ServiceForSlots = Pick<Service, "id" | "category" | "durationMin">;
export type StaffForSlots = Pick<Staff, "id" | "level" | "workDays" | "bookable">;
export type AppointmentForSlots = Pick<Appointment, "staffId" | "startsAt" | "endsAt" | "status">;

export interface Slot {
  /** ISO instant the appointment would start. */
  startsAt: string;
  endsAt: string;
  /** Every eligible stylist who is free at this time. For a named stylist this has one entry. */
  staffIds: string[];
}

export interface SlotQuery {
  date: DateKey;
  service: ServiceForSlots;
  /** A staff id, or "any". */
  staffId: string;
  staff: StaffForSlots[];
  appointments: AppointmentForSlots[];
  hours: WeekHours;
  now: Date;
}

/** Can this person take this service at all? (Ignores the calendar.) */
export function canPerform(staff: Pick<StaffForSlots, "level" | "bookable">, service: Pick<Service, "category">): boolean {
  if (!staff.bookable) return false;
  if (staff.level === "junior" && service.category === "Colour") return false;
  return true;
}

/** Stylists a client may choose for this service, in display order. */
export function eligibleStaff<T extends StaffForSlots>(staff: T[], service: Pick<Service, "category">): T[] {
  return staff.filter((s) => canPerform(s, service));
}

export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function isStaffFree(
  staffId: string,
  startsAt: Date,
  endsAt: Date,
  appointments: AppointmentForSlots[],
): boolean {
  const s = startsAt.getTime();
  const e = endsAt.getTime();
  return !appointments.some(
    (a) =>
      a.staffId === staffId &&
      BLOCKING_STATUSES.includes(a.status) &&
      overlaps(s, e, new Date(a.startsAt).getTime(), new Date(a.endsAt).getTime()),
  );
}

export function getSlots(q: SlotQuery): Slot[] {
  const weekday = weekdayOf(q.date);
  const day = q.hours[weekday];
  if (!day) return [];

  const pool =
    q.staffId === ANY_STAFF
      ? eligibleStaff(q.staff, q.service)
      : eligibleStaff(
          q.staff.filter((s) => s.id === q.staffId),
          q.service,
        );
  const working = pool.filter((s) => s.workDays.includes(weekday));
  if (working.length === 0) return [];

  const earliest = q.now.getTime() + MIN_LEAD_MINUTES * 60_000;
  const slots: Slot[] = [];

  for (let t = day.openMin; t + q.service.durationMin <= day.closeMin; t += SLOT_MINUTES) {
    const start = instantAt(q.date, t);
    if (start.getTime() <= earliest) continue;
    const end = addMinutes(start, q.service.durationMin);
    const free = working.filter((s) => isStaffFree(s.id, start, end, q.appointments)).map((s) => s.id);
    if (free.length) {
      slots.push({ startsAt: start.toISOString(), endsAt: end.toISOString(), staffIds: free });
    }
  }
  return slots;
}

export interface OpenDaysQuery extends Omit<SlotQuery, "date"> {
  from: DateKey;
  days: number;
}

/** Number of open slots for each of the next `days` dates. */
export function getOpenDays(q: OpenDaysQuery): { date: DateKey; open: number }[] {
  const out: { date: DateKey; open: number }[] = [];
  for (let i = 0; i < q.days; i++) {
    const date = addDays(q.from, i);
    out.push({ date, open: getSlots({ ...q, date }).length });
  }
  return out;
}

/** Choose who takes an "anyone" booking: the first free stylist in display order. */
export function pickStaffForSlot(slot: Slot): string | null {
  return slot.staffIds[0] ?? null;
}
