import type { Role } from "./types";

/**
 * Demo permission model. It previews the Phase 2 rules, which will be enforced in the database
 * (Row Level Security) and not only in the UI.
 */

export const ADMIN_MODULES = [
  "dashboard",
  "calendar",
  "clients",
  "checkout",
  "inventory",
  "services",
  "staff",
  "reports",
  "marketing",
  "settings",
  "outbox",
] as const;
export type AdminModule = (typeof ADMIN_MODULES)[number];

export const MODULE_LABELS: Record<AdminModule, string> = {
  dashboard: "Today",
  calendar: "Calendar",
  clients: "Clients",
  checkout: "Checkout",
  inventory: "Inventory",
  services: "Services",
  staff: "Team",
  reports: "Reports",
  marketing: "Marketing",
  settings: "Settings",
  outbox: "Outbox",
};

const ACCESS: Record<Role, readonly AdminModule[]> = {
  owner: ADMIN_MODULES,
  // Front desk runs the floor: everything except reports and settings.
  frontdesk: [
    "dashboard",
    "calendar",
    "clients",
    "checkout",
    "inventory",
    "services",
    "staff",
    "marketing",
    "outbox",
  ],
  // A stylist sees their own day, their own clients and their own checkout.
  stylist: ["dashboard", "calendar", "clients", "checkout"],
};

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  frontdesk: "Front desk",
  stylist: "Stylist",
};

export const ROLE_BLURBS: Record<Role, string> = {
  owner: "Everything: reports, settings, team, prices.",
  frontdesk: "The whole calendar, clients, checkout and stock. No reports or settings.",
  stylist: "Your own calendar and your own clients only.",
};

export function visibleModules(role: Role): readonly AdminModule[] {
  return ACCESS[role];
}

export function canAccess(role: Role, module: AdminModule): boolean {
  return ACCESS[role].includes(module);
}

/** Stylists only see their own column and clients. Everyone else sees all of them. */
export function isScopedToOwnWork(role: Role): boolean {
  return role === "stylist";
}

/** Only the owner can change prices, durations and booking settings. */
export function canEditCatalog(role: Role): boolean {
  return role === "owner";
}
