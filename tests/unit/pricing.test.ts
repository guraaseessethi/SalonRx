import { describe, expect, it } from "vitest";
import { computeTotals, formatMoney, formatMoneyCompact, priceForLevel, priceLabel } from "@/lib/booking/pricing";
import { COLOUR, CUT } from "./fixtures";

describe("tier pricing", () => {
  it("charges intermediate stylists 25% less on tiered services, in whole cents", () => {
    expect(priceForLevel(CUT, "senior")).toBe(7500);
    expect(priceForLevel(CUT, "intermediate")).toBe(5625);
    expect(priceForLevel({ priceCents: 22500, tiered: true }, "intermediate")).toBe(16875);
    expect(priceForLevel({ priceCents: 11500, tiered: true }, "intermediate")).toBe(8625);
  });

  it("does not discount untiered services (blow dry, treatments, weddings)", () => {
    expect(priceForLevel({ priceCents: 5000, tiered: false }, "intermediate")).toBe(5000);
  });

  it("charges owner, senior and junior the list price", () => {
    for (const level of ["owner", "senior", "junior"] as const) {
      expect(priceForLevel(COLOUR, level)).toBe(10000);
    }
    expect(priceForLevel(CUT, null)).toBe(7500);
  });

  it("rounds odd prices to a whole cent", () => {
    expect(priceForLevel({ priceCents: 3333, tiered: true }, "intermediate")).toBe(2500);
  });
});

describe("totals", () => {
  it("adds 13% HST to services and retail, and tips on services only", () => {
    const t = computeTotals(
      [
        { kind: "service", priceCents: 20500 },
        { kind: "product", priceCents: 3500 },
      ],
      15,
    );
    expect(t.subtotalCents).toBe(24000);
    expect(t.taxCents).toBe(3120);
    expect(t.tipCents).toBe(3075);
    expect(t.totalCents).toBe(24000 + 3120 + 3075);
  });

  it("matches the concept's example ticket: $205 service + $35 retail, no tip = $271.20", () => {
    const t = computeTotals(
      [
        { kind: "service", priceCents: 20500 },
        { kind: "product", priceCents: 3500 },
      ],
      0,
    );
    expect(t.totalCents).toBe(27120);
  });

  it("gives no tip on a retail-only ticket", () => {
    const t = computeTotals([{ kind: "product", priceCents: 6000 }], 20);
    expect(t.tipCents).toBe(0);
    expect(t.totalCents).toBe(6780);
  });

  it("returns zeros for an empty ticket", () => {
    expect(computeTotals([], 18).totalCents).toBe(0);
  });

  it("rounds tax to the nearest cent", () => {
    expect(computeTotals([{ kind: "product", priceCents: 1999 }], 0).taxCents).toBe(260);
  });
});

describe("formatting", () => {
  it("formats cents as Canadian dollars", () => {
    expect(formatMoney(27120)).toBe("$271.20");
    expect(formatMoney(123456)).toBe("$1,234.56");
    expect(formatMoney(0)).toBe("$0.00");
  });

  it("drops the decimals for whole dollars", () => {
    expect(formatMoneyCompact(9000)).toBe("$90");
    expect(formatMoneyCompact(8625)).toBe("$86.25");
    expect(formatMoneyCompact(120000)).toBe("$1,200");
  });

  it("labels free and 'plus' prices for the public list", () => {
    expect(priceLabel({ priceCents: 0, plus: false })).toBe("Free");
    expect(priceLabel({ priceCents: 11500, plus: true })).toBe("$115+");
    expect(priceLabel({ priceCents: 11500, plus: true }, 8625)).toBe("$86.25+");
  });
});
