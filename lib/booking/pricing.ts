import { HST_RATE_PERCENT, INTERMEDIATE_DISCOUNT_PERCENT } from "@/lib/domain/constants";
import type { Service, StaffLevel } from "@/lib/domain/types";

/** Price of a service for a stylist of the given level. Integer cents. */
export function priceForLevel(
  service: Pick<Service, "priceCents" | "tiered">,
  level: StaffLevel | null | undefined,
): number {
  if (service.tiered && level === "intermediate") {
    return Math.round((service.priceCents * (100 - INTERMEDIATE_DISCOUNT_PERCENT)) / 100);
  }
  return service.priceCents;
}

export interface TotalsLine {
  kind: "service" | "product";
  priceCents: number;
}

export interface Totals {
  serviceCents: number;
  retailCents: number;
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
}

/** HST applies to services and retail. The tip is a percentage of the services only and is not taxed. */
export function computeTotals(lines: TotalsLine[], tipPercent: number): Totals {
  const serviceCents = lines
    .filter((l) => l.kind === "service")
    .reduce((s, l) => s + l.priceCents, 0);
  const retailCents = lines
    .filter((l) => l.kind === "product")
    .reduce((s, l) => s + l.priceCents, 0);
  const subtotalCents = serviceCents + retailCents;
  const taxCents = Math.round((subtotalCents * HST_RATE_PERCENT) / 100);
  const tipCents = Math.round((serviceCents * tipPercent) / 100);
  return {
    serviceCents,
    retailCents,
    subtotalCents,
    taxCents,
    tipCents,
    totalCents: subtotalCents + taxCents + tipCents,
  };
}

/** "$1,234.50" */
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" })
    .format(cents / 100)
    .replace("CA$", "$");
}

/** "$90" when whole dollars, "$86.25" otherwise. */
export function formatMoneyCompact(cents: number): string {
  const dollars = cents / 100;
  const whole = cents % 100 === 0;
  return (
    "$" +
    dollars.toLocaleString("en-CA", {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}

/** Price label for the public list: "Free" for $0, "+" when the service has extras. */
export function priceLabel(
  service: Pick<Service, "priceCents" | "plus">,
  cents: number = service.priceCents,
): string {
  if (cents === 0) return "Free";
  return formatMoneyCompact(cents) + (service.plus ? "+" : "");
}
