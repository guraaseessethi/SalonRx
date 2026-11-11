import type { WeekHours } from "@/lib/domain/types";
import { addDays, minutesOfDay, todayKey, weekdayOf, type DateKey } from "./time";

/** First day the salon is open and not already closed for the day, within the next 8 days. */
export function nextOpenDay(now: Date, hours: WeekHours): DateKey {
  const today = todayKey(now);
  for (let i = 0; i < 8; i++) {
    const key = addDays(today, i);
    const day = hours[weekdayOf(key)];
    if (day && !(i === 0 && minutesOfDay(now) >= day.closeMin)) return key;
  }
  return today;
}
