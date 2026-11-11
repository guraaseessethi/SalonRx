import type { DataRepository } from "./repository";

/**
 * Named, stable query functions for useRepoQuery. Defined once at module level so React can
 * compare them by reference. Parameterised queries are built with the helpers below.
 */
export const queries = {
  services: (r: DataRepository) => r.listServices(),
  staff: (r: DataRepository) => r.listStaff(),
  settings: (r: DataRepository) => r.getSettings(),
  clients: (r: DataRepository) => r.listClients(),
  appointments: (r: DataRepository) => r.listAppointments(),
  products: (r: DataRepository) => r.listProducts(),
  reservations: (r: DataRepository) => r.listReservations(),
  sales: (r: DataRepository) => r.listSales(),
  reports: (r: DataRepository) => r.getReports(),
  outbox: (r: DataRepository) => r.listOutbox(),
  session: (r: DataRepository) => r.getSession(),
};
