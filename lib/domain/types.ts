import { z } from "zod";

/**
 * Domain model. Zod schemas are the single source of truth; TypeScript types are inferred.
 * Rules that hold across the whole app:
 *  - money is an integer number of cents
 *  - instants are ISO 8601 strings in UTC; the Toronto timezone is applied only when displaying
 *    or when turning a "date + time on the salon clock" into an instant (lib/booking/time.ts)
 */

const isoInstant = z.iso.datetime();
const id = z.string().min(1);
const cents = z.number().int().nonnegative();

/* ---------- Staff ---------- */

export const staffLevelSchema = z.enum([
  "owner",
  "senior",
  "intermediate",
  "junior",
  "desk",
  "social",
]);
export type StaffLevel = z.infer<typeof staffLevelSchema>;

export const staffSchema = z.object({
  id,
  name: z.string().min(1),
  level: staffLevelSchema,
  role: z.string().min(1),
  bio: z.string(),
  /** 0 = Sunday ... 6 = Saturday */
  workDays: z.array(z.number().int().min(0).max(6)),
  /** Can clients book this person online? */
  bookable: z.boolean(),
});
export type Staff = z.infer<typeof staffSchema>;

/* ---------- Services ---------- */

export const SERVICE_CATEGORIES = ["Blow dry", "Cut", "Colour", "Treatments", "Weddings"] as const;
export const serviceCategorySchema = z.enum(SERVICE_CATEGORIES);
export type ServiceCategory = z.infer<typeof serviceCategorySchema>;

export const serviceSchema = z.object({
  id,
  category: serviceCategorySchema,
  name: z.string().min(1),
  /** Senior price. */
  priceCents: cents,
  durationMin: z.number().int().positive().or(z.literal(0)),
  /** Intermediate stylists are 25% off when true (cuts and colour). */
  tiered: z.boolean(),
  /** Show "+" after the price (toner extra, longer hair, etc.). */
  plus: z.boolean(),
});
export type Service = z.infer<typeof serviceSchema>;

/* ---------- Clients ---------- */

export const clientSchema = z.object({
  id,
  name: z.string().min(1),
  phone: z.string(),
  email: z.string(),
  stylistId: z.string(),
  /** Year they first came in. */
  since: z.string(),
  visits: z.number().int().nonnegative(),
  spendCents: cents,
  lastVisitAt: isoInstant.nullable(),
  teaOrder: z.string(),
  /** Sensitive. Phase 2: visible to owner and the assigned stylist only. */
  allergy: z.string(),
  patchTestAt: isoInstant.nullable(),
  formula: z.string(),
  notes: z.string(),
});
export type Client = z.infer<typeof clientSchema>;

export const newClientSchema = z.object({
  name: z.string().trim().min(2, "Add a name"),
  phone: z.string().trim().default(""),
  email: z.union([z.literal(""), z.email("Enter a valid email address")]).default(""),
  stylistId: z.string().default(""),
  teaOrder: z.string().trim().default(""),
  allergy: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});
export type NewClientInput = z.input<typeof newClientSchema>;

/* ---------- Appointments ---------- */

export const appointmentStatusSchema = z.enum([
  "new",
  "pending",
  "confirmed",
  "arrived",
  "done",
  "noshow",
  "cancelled",
]);
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

export const appointmentSchema = z.object({
  id,
  staffId: id,
  clientId: id,
  serviceId: id,
  startsAt: isoInstant,
  endsAt: isoInstant,
  status: appointmentStatusSchema,
  source: z.enum(["online", "staff", "seed"]),
  /** Price at the time of booking (depends on the stylist's level). */
  priceCents: cents,
  note: z.string().default(""),
  createdAt: isoInstant,
});
export type Appointment = z.infer<typeof appointmentSchema>;

/** Statuses that hold the stylist's time. Cancelled appointments free the slot. */
export const BLOCKING_STATUSES: readonly AppointmentStatus[] = [
  "new",
  "pending",
  "confirmed",
  "arrived",
  "done",
  "noshow",
];

/* ---------- Booking (public) ---------- */

const phoneField = z
  .string()
  .trim()
  .min(1, "Add a mobile number so we can confirm")
  .refine((v) => {
    const digits = v.replace(/\D/g, "");
    return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
  }, "Enter a 10-digit mobile number, like 705 555 0123");

export const bookingInputSchema = z.object({
  serviceId: id,
  /** A staff id, or "any" for the first available stylist. */
  staffId: id,
  startsAt: isoInstant,
  name: z
    .string()
    .trim()
    .min(2, "Add your name so we know who to expect")
    .max(80, "That name is a bit long"),
  phone: phoneField,
  email: z.union([z.literal(""), z.email("That email doesn't look right")]).default(""),
  note: z.string().trim().max(500, "Please keep notes under 500 characters").default(""),
});
export type BookingInput = z.input<typeof bookingInputSchema>;
export type ParsedBookingInput = z.output<typeof bookingInputSchema>;

export const staffAppointmentInputSchema = z.object({
  clientId: id,
  serviceId: id,
  staffId: id,
  startsAt: isoInstant,
});
export type StaffAppointmentInput = z.infer<typeof staffAppointmentInputSchema>;

/* ---------- Retail and inventory ---------- */

export const PRODUCT_TYPES = ["Retail", "Back bar", "Extensions"] as const;
export const productTypeSchema = z.enum(PRODUCT_TYPES);
export type ProductType = z.infer<typeof productTypeSchema>;

export const productSchema = z.object({
  sku: id,
  brand: z.string(),
  name: z.string().min(1),
  type: productTypeSchema,
  costCents: cents,
  /** 0 for back-bar stock that is never sold. */
  priceCents: cents,
  stock: z.number().int().nonnegative(),
  par: z.number().int().nonnegative(),
  supplier: z.string(),
  /** Swatch used by the drawn product bottle placeholder. */
  color: z.string(),
});
export type Product = z.infer<typeof productSchema>;

export const newProductSchema = z.object({
  name: z.string().trim().min(1, "Add a product name"),
  brand: z.string().trim().default(""),
  type: productTypeSchema.default("Retail"),
  costCents: cents.default(0),
  priceCents: cents.default(0),
  stock: z.number().int().nonnegative().default(0),
  par: z.number().int().nonnegative().default(2),
});
export type NewProductInput = z.input<typeof newProductSchema>;

export const reservationSchema = z.object({ sku: id, at: isoInstant });
export type Reservation = z.infer<typeof reservationSchema>;

/* ---------- Sales ---------- */

export const PAYMENT_METHODS = ["Card", "Cash", "Gift card"] as const;
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const saleLineInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("service"), serviceId: id, staffId: z.string().optional() }),
  z.object({ kind: z.literal("product"), sku: id }),
]);
export type SaleLineInput = z.infer<typeof saleLineInputSchema>;

export const saleInputSchema = z.object({
  clientId: z.string().nullable(),
  appointmentId: z.string().optional(),
  paymentMethod: paymentMethodSchema,
  tipPercent: z.number().int().min(0).max(100),
  lines: z.array(saleLineInputSchema).min(1, "Add a service or product first"),
});
export type SaleInput = z.infer<typeof saleInputSchema>;

export const saleLineSchema = z.object({
  kind: z.enum(["service", "product"]),
  refId: id,
  name: z.string(),
  priceCents: cents,
});
export type SaleLine = z.infer<typeof saleLineSchema>;

export const saleSchema = z.object({
  id,
  at: isoInstant,
  clientId: z.string().nullable(),
  staffId: z.string().nullable(),
  paymentMethod: paymentMethodSchema,
  lines: z.array(saleLineSchema),
  serviceCents: cents,
  retailCents: cents,
  taxCents: cents,
  tipCents: cents,
  totalCents: cents,
});
export type Sale = z.infer<typeof saleSchema>;

/* ---------- Settings ---------- */

export const dayHoursSchema = z.object({
  /** Minutes after midnight on the salon clock. */
  openMin: z.number().int().min(0).max(1440),
  closeMin: z.number().int().min(0).max(1440),
});
export type DayHours = z.infer<typeof dayHoursSchema>;

/** Index 0 = Sunday ... 6 = Saturday. null = closed. */
export const weekHoursSchema = z.array(dayHoursSchema.nullable()).length(7);
export type WeekHours = z.infer<typeof weekHoursSchema>;

export const settingsSchema = z.object({
  acceptOnlineBookings: z.boolean(),
  depositRequired: z.boolean(),
  patchTestPrompt: z.boolean(),
  dayBeforeTexts: z.boolean(),
  rebookNudges: z.boolean(),
  reviewRequests: z.boolean(),
  hours: weekHoursSchema,
});
export type Settings = z.infer<typeof settingsSchema>;

export type ToggleSettingKey = Exclude<keyof Settings, "hours">;

/* ---------- Demo outbox ---------- */

export const outboxMessageSchema = z.object({
  id,
  at: isoInstant,
  channel: z.enum(["sms", "email"]),
  to: z.string(),
  kind: z.string(),
  subject: z.string().optional(),
  body: z.string(),
});
export type OutboxMessage = z.infer<typeof outboxMessageSchema>;

/* ---------- Demo session (role gate) ---------- */

export const ROLES = ["owner", "frontdesk", "stylist"] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

export const demoSessionSchema = z.object({
  role: roleSchema,
  /** For the stylist role: which stylist is "signed in". */
  staffId: z.string().optional(),
});
export type DemoSession = z.infer<typeof demoSessionSchema>;

/* ---------- Reports (sample figures in Phase 1) ---------- */

export interface ReportsSummary {
  weeks: { label: string; servicesCents: number; retailCents: number }[];
  kpis: {
    revenue8wCents: number;
    revenueChangePercent: number;
    avgTicketCents: number;
    avgTicketChangeCents: number;
    newClients: number;
    onlineNewClients: number;
    lateCancelPercent: number;
    lateFeesCollected: number;
  };
  mix: { label: string; percent: number }[];
  /** True while the figures are samples (Phase 1). */
  isSample: boolean;
}
