import { z } from "zod";
import {
  ANY_STAFF,
  getOpenDays,
  getSlots,
  isStaffFree,
  pickStaffForSlot,
  type Slot,
} from "@/lib/booking/availability";
import { computeTotals, formatMoney, priceForLevel } from "@/lib/booking/pricing";
import {
  addMinutes,
  formatDayShort,
  formatTime,
  toDateKey,
} from "@/lib/booking/time";
import {
  appointmentSchema,
  bookingInputSchema,
  clientSchema,
  newClientSchema,
  newProductSchema,
  outboxMessageSchema,
  productSchema,
  reservationSchema,
  saleInputSchema,
  saleSchema,
  serviceSchema,
  settingsSchema,
  staffAppointmentInputSchema,
  staffSchema,
  demoSessionSchema,
  type Appointment,
  type AppointmentStatus,
  type BookingInput,
  type Client,
  type DemoSession,
  type NewClientInput,
  type NewProductInput,
  type OutboxMessage,
  type Product,
  type ReportsSummary,
  type Reservation,
  type Sale,
  type SaleInput,
  type SaleLine,
  type Service,
  type Settings,
  type Staff,
  type StaffAppointmentInput,
  type ToggleSettingKey,
} from "@/lib/domain/types";
import { SITE } from "@/lib/site";
import {
  BookingError,
  type AvailabilityQuery,
  type BookingResult,
  type DataRepository,
  type DateRange,
  type DemoMessageInput,
  type OpenDaysQuery,
} from "../repository";
import { createSeedState, nextOpenDay, sampleReports, buildSeedAppointments, DEFAULT_HOURS } from "./seed";
import type { StorageAdapter } from "./storage";

export const STATE_KEY = "salonrx-demo-v4";
export const SESSION_KEY = "salonrx-demo-session-v1";

const stateSchema = z.object({
  seedDay: z.string(),
  staff: z.array(staffSchema),
  services: z.array(serviceSchema),
  clients: z.array(clientSchema),
  appointments: z.array(appointmentSchema),
  products: z.array(productSchema),
  reservations: z.array(reservationSchema),
  sales: z.array(saleSchema),
  settings: settingsSchema,
  outbox: z.array(outboxMessageSchema),
});
type State = z.infer<typeof stateSchema>;

export interface MockRepositoryOptions {
  /** Persistent store for demo data (localStorage in the browser). */
  data: StorageAdapter;
  /** Per-tab store for the demo role (sessionStorage in the browser). */
  session: StorageAdapter;
  /** Injectable clock, for tests. */
  now?: () => Date;
  /** Listen for changes made in other tabs. */
  watchOtherTabs?: boolean;
}

function newId(prefix: string): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${uuid}`;
}

const digits = (s: string) => s.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");

export class MockRepository implements DataRepository {
  private state: State | null = null;
  private listeners = new Set<() => void>();
  private readonly dataStore: StorageAdapter;
  private readonly sessionStore: StorageAdapter;
  private readonly clock: () => Date;

  constructor(options: MockRepositoryOptions) {
    this.dataStore = options.data;
    this.sessionStore = options.session;
    this.clock = options.now ?? (() => new Date());
    if (options.watchOtherTabs && typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === STATE_KEY) {
          this.state = null;
          this.notify();
        }
      });
    }
  }

  /* ---------- plumbing ---------- */

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const l of this.listeners) l();
  }

  private load(): State {
    const now = this.clock();
    if (!this.state) {
      this.state = this.read() ?? createSeedState(now);
    }
    // The seeded "today" moves forward every day, so the demo always has a busy first open day.
    const currentSeedDay = nextOpenDay(now, this.state.settings.hours ?? DEFAULT_HOURS);
    if (this.state.seedDay !== currentSeedDay) {
      this.state = {
        ...this.state,
        seedDay: currentSeedDay,
        appointments: [
          ...buildSeedAppointments(now, this.state.settings.hours),
          // keep anything a person added, as long as it is not in the past
          ...this.state.appointments.filter(
            (a) => a.source !== "seed" && new Date(a.endsAt).getTime() >= now.getTime(),
          ),
        ],
      };
      this.persist();
    }
    return this.state;
  }

  private read(): State | null {
    const raw = this.dataStore.getItem(STATE_KEY);
    if (!raw) return null;
    try {
      const parsed = stateSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  private persist() {
    if (this.state) this.dataStore.setItem(STATE_KEY, JSON.stringify(this.state));
  }

  /** Apply a change, save it, tell subscribers. */
  private commit(change: (s: State) => State) {
    this.state = change(this.load());
    this.persist();
    this.notify();
  }

  private findService(id: string, s = this.load()): Service {
    const svc = s.services.find((x) => x.id === id);
    if (!svc) throw new BookingError("service-not-found", "That service no longer exists.");
    return svc;
  }

  /* ---------- catalog ---------- */

  async listServices() {
    return this.load().services;
  }

  async updateService(id: string, patch: Partial<Pick<Service, "priceCents" | "durationMin">>) {
    const current = this.findService(id);
    const next = serviceSchema.parse({ ...current, ...patch });
    this.commit((s) => ({ ...s, services: s.services.map((x) => (x.id === id ? next : x)) }));
    return next;
  }

  async listStaff() {
    return this.load().staff;
  }

  async getSettings() {
    return this.load().settings;
  }

  async setSetting(key: ToggleSettingKey, value: boolean) {
    this.commit((s) => ({ ...s, settings: { ...s.settings, [key]: value } }));
    return this.load().settings;
  }

  /* ---------- booking ---------- */

  async getAvailability(q: AvailabilityQuery): Promise<Slot[]> {
    const s = this.load();
    const service = s.services.find((x) => x.id === q.serviceId);
    if (!service) return [];
    return getSlots({
      date: q.date,
      service,
      staffId: q.staffId,
      staff: s.staff,
      appointments: s.appointments,
      hours: s.settings.hours,
      now: this.clock(),
    });
  }

  async getOpenDays(q: OpenDaysQuery) {
    const s = this.load();
    const service = s.services.find((x) => x.id === q.serviceId);
    if (!service) return [];
    return getOpenDays({
      from: q.from,
      days: q.days,
      service,
      staffId: q.staffId,
      staff: s.staff,
      appointments: s.appointments,
      hours: s.settings.hours,
      now: this.clock(),
    });
  }

  async createAppointment(input: BookingInput): Promise<BookingResult> {
    const parsed = bookingInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new BookingError("validation", parsed.error.issues[0]?.message ?? "Please check your details.");
    }
    const data = parsed.data;
    const state = this.load();
    if (!state.settings.acceptOnlineBookings) {
      throw new BookingError("paused", `Online booking is paused. Please call ${SITE.phone}.`);
    }
    const service = this.findService(data.serviceId, state);

    // Re-check availability at the moment of booking. The database does this with an exclusion constraint in Phase 2.
    const slots = await this.getAvailability({
      serviceId: service.id,
      staffId: data.staffId,
      date: toDateKey(data.startsAt),
    });
    const slot = slots.find((x) => new Date(x.startsAt).getTime() === new Date(data.startsAt).getTime());
    if (!slot) throw new BookingError("unavailable", "Sorry, that time was just taken. Please choose another.");
    const staffId = data.staffId === ANY_STAFF ? pickStaffForSlot(slot) : data.staffId;
    const staff = state.staff.find((x) => x.id === staffId);
    if (!staff) throw new BookingError("unavailable", "Sorry, that time was just taken. Please choose another.");

    const now = this.clock();
    const phoneDigits = digits(data.phone);
    let client = state.clients.find(
      (c) => (phoneDigits && digits(c.phone) === phoneDigits) || c.name.toLowerCase() === data.name.toLowerCase(),
    );
    let isNewClient = false;
    if (!client) {
      isNewClient = true;
      client = {
        id: newId("client"),
        name: data.name,
        phone: data.phone,
        email: data.email,
        stylistId: staff.id,
        since: String(toDateKey(now).slice(0, 4)),
        visits: 0,
        spendCents: 0,
        lastVisitAt: null,
        teaOrder: "",
        allergy: "",
        patchTestAt: null,
        formula: "—",
        notes: data.note || "New client · booked online",
      };
    }
    const appointment: Appointment = {
      id: newId("appt"),
      staffId: staff.id,
      clientId: client.id,
      serviceId: service.id,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      status: "new",
      source: "online",
      priceCents: priceForLevel(service, staff.level),
      note: data.note,
      createdAt: now.toISOString(),
    };

    const savedClient = client;
    this.commit((s) => ({
      ...s,
      clients: isNewClient ? [savedClient, ...s.clients] : s.clients,
      appointments: [...s.appointments, appointment],
    }));

    const when = `${formatDayShort(appointment.startsAt)} at ${formatTime(appointment.startsAt)}`;
    const first = data.name.split(" ")[0];
    await this.sendDemoMessage({
      channel: "sms",
      to: data.phone,
      kind: "Booking confirmation",
      body: `Hi ${first}! You're booked: ${service.name} with ${staff.name.split(" ")[0]}, ${when}. Reply C to confirm. 24 hours' notice to change. Kettle's on. 213 Bayfield St.`,
    });
    if (data.email) {
      await this.sendDemoMessage({
        channel: "email",
        to: data.email,
        kind: "Booking confirmation",
        subject: `You're booked at Salon Rx, ${when}`,
        body: `Hi ${first},\n\n${service.name} with ${staff.name} on ${when}.\nEstimated price: ${formatMoney(appointment.priceCents)}.\n\n213 Bayfield Street, Barrie. 24 hours' notice to change or cancel.\n\nSee you soon,\nSalon Rx`,
      });
    }

    return { appointment, client: savedClient, staff, service };
  }

  async createStaffAppointment(input: StaffAppointmentInput): Promise<Appointment> {
    const data = staffAppointmentInputSchema.parse(input);
    const state = this.load();
    const service = this.findService(data.serviceId, state);
    const staff = state.staff.find((x) => x.id === data.staffId);
    if (!staff) throw new BookingError("validation", "Choose a stylist.");
    const start = new Date(data.startsAt);
    const end = addMinutes(start, service.durationMin);
    if (!isStaffFree(staff.id, start, end, state.appointments)) {
      throw new BookingError("unavailable", `${staff.name.split(" ")[0]} already has something at that time.`);
    }
    const appointment: Appointment = {
      id: newId("appt"),
      staffId: staff.id,
      clientId: data.clientId,
      serviceId: service.id,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      status: "confirmed",
      source: "staff",
      priceCents: priceForLevel(service, staff.level),
      note: "",
      createdAt: this.clock().toISOString(),
    };
    this.commit((s) => ({ ...s, appointments: [...s.appointments, appointment] }));
    return appointment;
  }

  async listAppointments(range?: DateRange): Promise<Appointment[]> {
    const all = this.load().appointments;
    if (!range?.from && !range?.to) return all;
    return all.filter((a) => {
      const key = toDateKey(a.startsAt);
      return (!range.from || key >= range.from) && (!range.to || key <= range.to);
    });
  }

  async setAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    const current = this.load().appointments.find((a) => a.id === id);
    if (!current) throw new Error("Appointment not found");
    const next = { ...current, status };
    this.commit((s) => ({ ...s, appointments: s.appointments.map((a) => (a.id === id ? next : a)) }));
    return next;
  }

  /* ---------- clients ---------- */

  async listClients() {
    return this.load().clients;
  }

  async createClient(input: NewClientInput): Promise<Client> {
    const data = newClientSchema.parse(input);
    const state = this.load();
    const client: Client = {
      id: newId("client"),
      name: data.name,
      phone: data.phone,
      email: data.email,
      stylistId: data.stylistId || state.staff.find((s) => s.bookable)?.id || "",
      since: toDateKey(this.clock()).slice(0, 4),
      visits: 0,
      spendCents: 0,
      lastVisitAt: null,
      teaOrder: data.teaOrder,
      allergy: data.allergy,
      patchTestAt: null,
      formula: "—",
      notes: data.notes,
    };
    this.commit((s) => ({ ...s, clients: [client, ...s.clients] }));
    return client;
  }

  async updateClient(id: string, patch: Partial<Pick<Client, "formula" | "notes">>): Promise<Client> {
    const current = this.load().clients.find((c) => c.id === id);
    if (!current) throw new Error("Client not found");
    const next = { ...current, ...patch };
    this.commit((s) => ({ ...s, clients: s.clients.map((c) => (c.id === id ? next : c)) }));
    return next;
  }

  /* ---------- retail ---------- */

  async listProducts() {
    return this.load().products;
  }

  async createProduct(input: NewProductInput): Promise<Product> {
    const data = newProductSchema.parse(input);
    const product: Product = {
      sku: `NEW-${Date.now().toString(36).toUpperCase().slice(-5)}`,
      brand: data.brand || "—",
      name: data.name,
      type: data.type,
      costCents: data.costCents,
      priceCents: data.priceCents,
      stock: data.stock,
      par: data.par,
      supplier: data.brand || "Supplier",
      color: "#9aa3b8",
    };
    this.commit((s) => ({ ...s, products: [...s.products, product] }));
    return product;
  }

  async adjustStock(sku: string, delta: number): Promise<Product> {
    const current = this.load().products.find((p) => p.sku === sku);
    if (!current) throw new Error("Product not found");
    const next = { ...current, stock: Math.max(0, current.stock + delta) };
    this.commit((s) => ({ ...s, products: s.products.map((p) => (p.sku === sku ? next : p)) }));
    return next;
  }

  async receivePurchaseOrder(supplier: string): Promise<void> {
    this.commit((s) => ({
      ...s,
      products: s.products.map((p) => (p.supplier === supplier && p.stock <= p.par ? { ...p, stock: p.par * 2 } : p)),
    }));
  }

  async listReservations(): Promise<Reservation[]> {
    return this.load().reservations;
  }

  async toggleReservation(sku: string): Promise<boolean> {
    const state = this.load();
    const product = state.products.find((p) => p.sku === sku);
    if (!product) throw new Error("Product not found");
    const exists = state.reservations.some((r) => r.sku === sku);
    if (!exists && product.stock <= 0) return false;
    this.commit((s) => ({
      ...s,
      reservations: exists
        ? s.reservations.filter((r) => r.sku !== sku)
        : [...s.reservations, { sku, at: this.clock().toISOString() }],
    }));
    return !exists;
  }

  /* ---------- sales ---------- */

  async listSales() {
    return this.load().sales;
  }

  async createSale(input: SaleInput): Promise<Sale> {
    const data = saleInputSchema.parse(input);
    const state = this.load();

    const lines: SaleLine[] = [];
    const stockUse = new Map<string, number>();
    let staffId: string | null = null;

    const appointment = data.appointmentId ? state.appointments.find((a) => a.id === data.appointmentId) : undefined;
    if (appointment) staffId = appointment.staffId;

    for (const line of data.lines) {
      if (line.kind === "service") {
        const service = this.findService(line.serviceId, state);
        const stylist = state.staff.find((x) => x.id === (line.staffId ?? appointment?.staffId));
        if (stylist && !staffId) staffId = stylist.id;
        lines.push({
          kind: "service",
          refId: service.id,
          name: service.name,
          priceCents: priceForLevel(service, stylist?.level),
        });
      } else {
        const product = state.products.find((p) => p.sku === line.sku);
        if (!product) throw new Error("Product not found");
        const used = (stockUse.get(product.sku) ?? 0) + 1;
        if (used > product.stock) throw new Error(`Only ${product.stock} of ${product.name} on hand.`);
        stockUse.set(product.sku, used);
        lines.push({ kind: "product", refId: product.sku, name: product.name, priceCents: product.priceCents });
      }
    }

    const totals = computeTotals(lines, data.tipPercent);
    const now = this.clock().toISOString();
    const sale: Sale = {
      id: newId("sale"),
      at: now,
      clientId: data.clientId,
      staffId,
      paymentMethod: data.paymentMethod,
      lines,
      serviceCents: totals.serviceCents,
      retailCents: totals.retailCents,
      taxCents: totals.taxCents,
      tipCents: totals.tipCents,
      totalCents: totals.totalCents,
    };

    this.commit((s) => ({
      ...s,
      sales: [...s.sales, sale],
      products: s.products.map((p) => (stockUse.has(p.sku) ? { ...p, stock: p.stock - (stockUse.get(p.sku) ?? 0) } : p)),
      reservations: s.reservations.filter((r) => !stockUse.has(r.sku)),
      clients: s.clients.map((c) =>
        c.id === data.clientId
          ? { ...c, spendCents: c.spendCents + totals.subtotalCents, visits: c.visits + 1, lastVisitAt: now }
          : c,
      ),
      appointments: s.appointments.map((a) => (a.id === data.appointmentId ? { ...a, status: "done" as const } : a)),
    }));
    return sale;
  }

  async getReports(): Promise<ReportsSummary> {
    return sampleReports();
  }

  /* ---------- demo outbox ---------- */

  async listOutbox() {
    return this.load().outbox;
  }

  async sendDemoMessage(input: DemoMessageInput): Promise<OutboxMessage> {
    const message: OutboxMessage = { id: newId("msg"), at: this.clock().toISOString(), ...input };
    this.commit((s) => ({ ...s, outbox: [message, ...s.outbox].slice(0, 100) }));
    return message;
  }

  /* ---------- demo session ---------- */

  async getSession(): Promise<DemoSession | null> {
    const raw = this.sessionStore.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const parsed = demoSessionSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  async setSession(session: DemoSession | null): Promise<void> {
    if (session) this.sessionStore.setItem(SESSION_KEY, JSON.stringify(session));
    else this.sessionStore.removeItem(SESSION_KEY);
    this.notify();
  }

  async resetDemoData(): Promise<void> {
    this.state = createSeedState(this.clock());
    this.persist();
    this.notify();
  }
}
