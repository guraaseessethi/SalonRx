import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { TIMEZONE } from "@/lib/domain/constants";

/**
 * Salon-clock helpers. A "date key" is a calendar date on the Toronto clock, "yyyy-MM-dd".
 * Instants are stored as UTC ISO strings and only converted at the edges.
 */

export type DateKey = string;

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDateKey(value: string): boolean {
  const m = DATE_KEY_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(y, mo - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === mo - 1 && probe.getUTCDate() === d;
}

/** Calendar date on the salon clock for an instant. */
export function toDateKey(instant: Date | string): DateKey {
  return formatInTimeZone(instant, TIMEZONE, "yyyy-MM-dd");
}

/** The instant at which the salon clock reads `minutes` after midnight on `dateKey`. */
export function instantAt(dateKey: DateKey, minutes: number): Date {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return fromZonedTime(`${dateKey}T${h}:${m}:00`, TIMEZONE);
}

/** 0 = Sunday ... 6 = Saturday, for a calendar date (timezone independent). */
export function weekdayOf(dateKey: DateKey): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDays(dateKey: DateKey, days: number): DateKey {
  const [y, m, d] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}

/** Minutes after midnight on the salon clock. */
export function minutesOfDay(instant: Date | string): number {
  const h = Number(formatInTimeZone(instant, TIMEZONE, "H"));
  const m = Number(formatInTimeZone(instant, TIMEZONE, "m"));
  return h * 60 + m;
}

export function addMinutes(instant: Date | string, minutes: number): Date {
  return new Date(new Date(instant).getTime() + minutes * 60_000);
}

/** "10 am", "2:30 pm". Takes minutes after midnight. */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h >= 12 && h < 24 ? "pm" : "am";
  const hour12 = h % 12 || 12;
  return `${hour12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${suffix}`;
}

/** "10 am", "2:30 pm" for an instant, on the salon clock. */
export function formatTime(instant: Date | string): string {
  return formatMinutes(minutesOfDay(instant));
}

/** "Wednesday, November 12" */
export function formatDayLong(instant: Date | string): string {
  return formatInTimeZone(instant, TIMEZONE, "EEEE, MMMM d");
}

/** "Nov 12" */
export function formatDayShort(instant: Date | string): string {
  return formatInTimeZone(instant, TIMEZONE, "MMM d");
}

/** Format a date key for display, e.g. "Wednesday, November 12". */
export function formatDateKeyLong(dateKey: DateKey): string {
  return formatInTimeZone(instantAt(dateKey, 12 * 60), TIMEZONE, "EEEE, MMMM d");
}

export function dayOfMonth(dateKey: DateKey): number {
  return Number(dateKey.slice(8, 10));
}

/** Today's date key on the salon clock. */
export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now);
}
