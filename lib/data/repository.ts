import type {
  Appointment,
  AppointmentStatus,
  BookingInput,
  Client,
  DemoSession,
  NewClientInput,
  NewProductInput,
  OutboxMessage,
  Product,
  ReportsSummary,
  Reservation,
  Sale,
  SaleInput,
  Service,
  Settings,
  Staff,
  StaffAppointmentInput,
  ToggleSettingKey,
} from "@/lib/domain/types";
import type { Slot } from "@/lib/booking/availability";
import type { DateKey } from "@/lib/booking/time";

/**
 * The only door between the UI and data. Phase 1 implements it with seed data and browser storage
 * (lib/data/mock). Phase 2 adds a Supabase implementation with the same shape, so no component changes.
 *
 * Every method is async on purpose: a network database cannot be synchronous.
 * Returned objects are immutable snapshots; to change something, call a method.
 */

export interface AvailabilityQuery {
  serviceId: string;
  /** A staff id, or "any". */
  staffId: string;
  date: DateKey;
}

export interface OpenDaysQuery {
  serviceId: string;
  staffId: string;
  from: DateKey;
  days: number;
}

export interface DateRange {
  /** Inclusive, on the salon clock. */
  from?: DateKey;
  to?: DateKey;
}

export interface BookingResult {
  appointment: Appointment;
  client: Client;
  staff: Staff;
  service: Service;
}

export type BookingErrorCode = "paused" | "service-not-found" | "unavailable" | "validation";

export class BookingError extends Error {
  readonly code: BookingErrorCode;
  constructor(code: BookingErrorCode, message: string) {
    super(message);
    this.name = "BookingError";
    this.code = code;
  }
}

export interface DemoMessageInput {
  channel: "sms" | "email";
  to: string;
  kind: string;
  subject?: string;
  body: string;
}

export interface DataRepository {
  /** Called after any write, so queries can refetch. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;

  /* catalog */
  listServices(): Promise<Service[]>;
  updateService(
    id: string,
    patch: Partial<Pick<Service, "priceCents" | "durationMin">>,
  ): Promise<Service>;
  listStaff(): Promise<Staff[]>;
  getSettings(): Promise<Settings>;
  setSetting(key: ToggleSettingKey, value: boolean): Promise<Settings>;

  /* booking */
  getAvailability(query: AvailabilityQuery): Promise<Slot[]>;
  getOpenDays(query: OpenDaysQuery): Promise<{ date: DateKey; open: number }[]>;
  /** Public booking. Throws BookingError. */
  createAppointment(input: BookingInput): Promise<BookingResult>;
  /** Staff-entered appointment from the calendar. Throws BookingError("unavailable") on overlap. */
  createStaffAppointment(input: StaffAppointmentInput): Promise<Appointment>;
  listAppointments(range?: DateRange): Promise<Appointment[]>;
  setAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment>;

  /* clients */
  listClients(): Promise<Client[]>;
  createClient(input: NewClientInput): Promise<Client>;
  updateClient(id: string, patch: Partial<Pick<Client, "formula" | "notes">>): Promise<Client>;

  /* retail and inventory */
  listProducts(): Promise<Product[]>;
  createProduct(input: NewProductInput): Promise<Product>;
  adjustStock(sku: string, delta: number): Promise<Product>;
  receivePurchaseOrder(supplier: string): Promise<void>;
  listReservations(): Promise<Reservation[]>;
  /** Curbside reserve toggle. Returns true when the item is now reserved. */
  toggleReservation(sku: string): Promise<boolean>;

  /* sales */
  listSales(): Promise<Sale[]>;
  createSale(input: SaleInput): Promise<Sale>;
  getReports(): Promise<ReportsSummary>;

  /* demo only: texts and emails that would be sent in the full build */
  listOutbox(): Promise<OutboxMessage[]>;
  sendDemoMessage(input: DemoMessageInput): Promise<OutboxMessage>;

  /* demo only: role gate and reset */
  getSession(): Promise<DemoSession | null>;
  setSession(session: DemoSession | null): Promise<void>;
  resetDemoData(): Promise<void>;
}
