/** Everything the salon calendar does happens in this timezone. */
export const TIMEZONE = "America/Toronto";

/** Ontario HST. Applied to services and retail, not to tips. */
export const HST_RATE_PERCENT = 13;

/** Booking grid. */
export const SLOT_MINUTES = 30;

/** Online bookings must start more than this many minutes from now. */
export const MIN_LEAD_MINUTES = 30;

/** Intermediate stylists are this much cheaper on tiered services (cuts and colour). */
export const INTERMEDIATE_DISCOUNT_PERCENT = 25;

/** Optional online deposit, in cents (Settings toggle, colour and extensions only in the full build). */
export const DEPOSIT_CENTS = 2500;

/** Late-cancellation rebooking charge, in cents. */
export const LATE_CANCEL_FEE_CENTS = 5000;

export const CANCELLATION_NOTICE_HOURS = 24;
export const MAX_LAST_MINUTE_CANCELS = 3;

export const TIP_PRESETS = [0, 15, 18, 20] as const;

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Public hours list starts on Wednesday, the first open day. */
export const DAY_DISPLAY_ORDER = [3, 4, 5, 6, 0, 1, 2] as const;
