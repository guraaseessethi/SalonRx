"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useRepoQuery, useRepository } from "@/components/providers/RepositoryProvider";
import { useToast } from "@/components/ui/Toast";
import { nextOpenDay } from "@/lib/booking/schedule";
import { toDateKey, type DateKey } from "@/lib/booking/time";
import { queries } from "@/lib/data/queries";
import type { DataRepository } from "@/lib/data/repository";
import { isScopedToOwnWork } from "@/lib/domain/permissions";
import type {
  Appointment,
  Client,
  DemoSession,
  OutboxMessage,
  Product,
  Reservation,
  Role,
  Sale,
  Service,
  Settings,
  Staff,
} from "@/lib/domain/types";

export interface AdminContextValue {
  repo: DataRepository;
  toast: (message: string) => void;
  role: Role;
  /** The signed-in stylist, for the stylist role. */
  me: Staff | null;
  /** When set, only this stylist's calendar, clients and sales are shown. */
  scopedStaffId: string | null;
  services: Service[];
  staff: Staff[];
  clients: Client[];
  appointments: Appointment[];
  products: Product[];
  sales: Sale[];
  reservations: Reservation[];
  settings: Settings;
  outbox: OutboxMessage[];
  /** Fixed when the console opened. */
  now: Date;
  today: DateKey;
  /** The first open day that has not finished yet: "today" for the salon. */
  openDay: DateKey;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside the admin console");
  return ctx;
}

/** Loads everything the console needs once, then renders children. */
export function AdminDataProvider({
  session,
  children,
  fallback,
}: {
  session: DemoSession;
  children: ReactNode;
  fallback: ReactNode;
}) {
  const repo = useRepository();
  const toast = useToast();
  const services = useRepoQuery(queries.services);
  const staff = useRepoQuery(queries.staff);
  const clients = useRepoQuery(queries.clients);
  const appointments = useRepoQuery(queries.appointments);
  const products = useRepoQuery(queries.products);
  const sales = useRepoQuery(queries.sales);
  const reservations = useRepoQuery(queries.reservations);
  const settings = useRepoQuery(queries.settings);
  const outbox = useRepoQuery(queries.outbox);
  const [now] = useState(() => new Date());

  const ready = [
    services,
    staff,
    clients,
    appointments,
    products,
    sales,
    reservations,
    settings,
    outbox,
  ].every((q) => q.ready);

  const value = useMemo<AdminContextValue | null>(() => {
    if (!ready) return null;
    const staffList = staff.data!;
    const me =
      session.role === "stylist" ? (staffList.find((s) => s.id === session.staffId) ?? null) : null;
    return {
      repo,
      toast,
      role: session.role,
      me,
      scopedStaffId: isScopedToOwnWork(session.role) ? (me?.id ?? null) : null,
      services: services.data!,
      staff: staffList,
      clients: clients.data!,
      appointments: appointments.data!,
      products: products.data!,
      sales: sales.data!,
      reservations: reservations.data!,
      settings: settings.data!,
      outbox: outbox.data!,
      now,
      today: toDateKey(now),
      openDay: nextOpenDay(now, settings.data!.hours),
    };
  }, [
    ready,
    repo,
    toast,
    session,
    now,
    services.data,
    staff.data,
    clients.data,
    appointments.data,
    products.data,
    sales.data,
    reservations.data,
    settings.data,
    outbox.data,
  ]);

  if (!value) return <>{fallback}</>;
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

/**
 * Texts and emails are not sent in the mockup. This logs them to the demo outbox and tells the user so.
 */
export function useDemoSend() {
  const { repo, toast } = useAdmin();
  return async (message: Parameters<DataRepository["sendDemoMessage"]>[0], quiet = false) => {
    await repo.sendDemoMessage(message);
    if (!quiet) toast("Would send in the full build. Logged in the demo outbox.");
  };
}
