import { priceForLevel, computeTotals } from "@/lib/booking/pricing";
import { addDays, addMinutes, instantAt, minutesOfDay, todayKey, weekdayOf, type DateKey } from "@/lib/booking/time";
import type {
  Appointment,
  AppointmentStatus,
  Client,
  Product,
  ProductType,
  ReportsSummary,
  Sale,
  Service,
  ServiceCategory,
  Settings,
  Staff,
  WeekHours,
} from "@/lib/domain/types";

/**
 * Seed data for the Phase 1 clickable mockup.
 * EVERYTHING HERE IS ILLUSTRATIVE and must be confirmed with the salon (see docs/CONTENT_TODO.md).
 * Clients are fictional: example.com emails and 705-555-01xx numbers.
 */

export const DEFAULT_HOURS: WeekHours = [
  null, // Sun
  null, // Mon
  null, // Tue
  { openMin: 10 * 60, closeMin: 20 * 60 }, // Wed
  { openMin: 10 * 60, closeMin: 20 * 60 }, // Thu
  { openMin: 10 * 60, closeMin: 16 * 60 }, // Fri
  { openMin: 8 * 60, closeMin: 14 * 60 }, // Sat
];

export const DEFAULT_SETTINGS: Settings = {
  acceptOnlineBookings: true,
  depositRequired: false,
  patchTestPrompt: true,
  dayBeforeTexts: true,
  rebookNudges: true,
  reviewRequests: true,
  hours: DEFAULT_HOURS,
};

export const SEED_STAFF: Staff[] = [
  { id: "allison", name: "Allison Arksey", level: "owner", role: "Founder & owner", bio: "Colour and creative cutting, with a long-standing clientele.", workDays: [3, 4, 5, 6], bookable: true },
  { id: "tanya", name: "Tanya Noland", level: "senior", role: "Senior stylist", bio: "Creative colour, blondes, and men's and women's styling.", workDays: [3, 4, 6], bookable: true },
  { id: "frank", name: "Frank Zanotti", level: "senior", role: "Senior stylist", bio: "Listens first and teaches you to style it at home.", workDays: [3, 4, 5], bookable: true },
  { id: "nickie", name: "Nickie Pynn", level: "senior", role: "Senior stylist", bio: "Hot Fusion and Tape-In extensions, wearable everyday looks.", workDays: [4, 5, 6], bookable: true },
  { id: "josh", name: "Josh Henderson", level: "senior", role: "Senior stylist", bio: "Lived-in blonde specialist who loves long hair and blowouts.", workDays: [3, 4, 5, 6], bookable: true },
  { id: "kim", name: "Kim Garcia", level: "intermediate", role: "Intermediate stylist", bio: "Balayage, textured cuts and men's cuts.", workDays: [3, 4, 6], bookable: true },
  { id: "alana", name: "Alana Ruscio", level: "junior", role: "Junior stylist", bio: "Your go-to for hair care and product knowledge.", workDays: [4, 5, 6], bookable: true },
  { id: "tryla", name: "Tryla", level: "junior", role: "Junior stylist", bio: "Recent graduate bringing fresh energy to every appointment.", workDays: [3, 5, 6], bookable: true },
  { id: "hillary", name: "Hillary Calder", level: "desk", role: "Front desk", bio: "The friendly face at the door and the voice on the phone.", workDays: [3, 4, 5, 6], bookable: false },
  { id: "kristie", name: "Kristie Stoodley", level: "social", role: "Social media", bio: "Years in fashion and publishing, now behind our feed.", workDays: [], bookable: false },
];

/** [id, category, name, price $, minutes, tiered (25% off for intermediate), plus] */
type ServiceRow = [string, ServiceCategory, string, number, number, 0 | 1, ("+" | "")?];

const SERVICE_ROWS: ServiceRow[] = [
  ["bd-reg", "Blow dry", "Blow dry & finish · regular", 50, 45, 0],
  ["bd-long", "Blow dry", "Blow dry & finish · long hair", 60, 60, 0],
  ["bd-formal", "Blow dry", "Formal style", 85, 60, 0],
  ["bd-updo", "Blow dry", "Updo", 105, 75, 0],
  ["cut-sr", "Cut", "Cut & style", 75, 60, 1],
  ["cut-long", "Cut", "Cut & style · long hair", 90, 75, 1],
  ["cut-m", "Cut", "Men's cut", 45, 30, 1],
  ["cut-g", "Cut", "Girls (under 10)", 50, 45, 1],
  ["cut-b", "Cut", "Boys (under 10)", 35, 30, 1],
  ["c-cheat", "Colour", "Cheater (10 foils)", 90, 75, 1],
  ["c-half", "Colour", "Half head foils (toner extra)", 115, 120, 1, "+"],
  ["c-full", "Colour", "Full head foils (toner extra)", 150, 150, 1, "+"],
  ["c-basefull", "Colour", "Base + full head", 205, 180, 1, "+"],
  ["c-base10", "Colour", "Base + 10 foils", 145, 120, 1, "+"],
  ["c-basehalf", "Colour", "Base + half head", 170, 150, 1, "+"],
  ["c-pre", "Colour", "Pre-lighten", 90, 90, 1],
  ["c-roots", "Colour", "Roots", 75, 90, 1],
  ["c-all", "Colour", "All over", 100, 120, 1, "+"],
  ["c-elumen", "Colour", "Elumen", 165, 150, 1, "+"],
  ["c-bal", "Colour", "Full balayage", 225, 180, 1, "+"],
  ["c-balr", "Colour", "Full balayage + roots", 280, 210, 1],
  ["c-ref", "Colour", "Balayage refresh", 175, 150, 1],
  ["c-refr", "Colour", "Balayage refresh + roots", 230, 180, 1],
  ["c-toner", "Colour", "Toner", 30, 30, 1],
  ["c-melt", "Colour", "Hair melt / root tap", 60, 45, 1],
  ["t-deluxe", "Treatments", "Deluxe treatment", 30, 20, 0, "+"],
  ["t-fusio", "Treatments", "Kérastase Fusio", 25, 15, 0],
  ["t-perm", "Treatments", "Texture perm", 140, 150, 0],
  ["t-ext", "Treatments", "Extension consultation", 0, 30, 0],
  ["w-bride", "Weddings", "Bride", 135, 90, 0],
  ["w-party", "Weddings", "Wedding party, each", 105, 60, 0],
  ["w-trial", "Weddings", "Wedding trial", 130, 90, 0],
];

export const SEED_SERVICES: Service[] = SERVICE_ROWS.map(([id, category, name, price, durationMin, tiered, plus]) => ({
  id,
  category,
  name,
  priceCents: price * 100,
  durationMin,
  tiered: tiered === 1,
  plus: plus === "+",
}));

/* ---------- products ---------- */

const BRAND_PREFIX: Record<string, string> = {
  "Kérastase": "KER",
  Moroccanoil: "MOR",
  "Color Wow": "CWW",
  "Schwarzkopf OSiS+": "OSI",
  KMS: "KMS",
  "Salon Rx": "SRX",
  Goldwell: "GLD",
  Supplies: "SUP",
  Extensions: "EXT",
};

const counters: Record<string, number> = {};
function sku(brand: string): string {
  const prefix = BRAND_PREFIX[brand] ?? brand.slice(0, 3).toUpperCase();
  counters[prefix] = (counters[prefix] ?? 0) + 1;
  return `${prefix}-${String(counters[prefix]).padStart(3, "0")}`;
}

function retail(brand: string, name: string, price: number, stock: number, par: number, color: string): Product {
  return {
    sku: sku(brand),
    brand,
    name,
    type: "Retail",
    costCents: Math.round(price * 50),
    priceCents: price * 100,
    stock,
    par,
    supplier: brand === "Salon Rx" ? "In-house" : brand,
    color,
  };
}

function backBar(brand: string, name: string, type: ProductType, cost: number, stock: number, par: number, supplier: string): Product {
  return { sku: sku(brand), brand, name, type, costCents: cost * 100, priceCents: 0, stock, par, supplier, color: "#9aa3b8" };
}

function buildProducts(): Product[] {
  for (const k of Object.keys(counters)) delete counters[k];
  return [
    retail("Kérastase", "Bain Décalcifiant Réparateur Shampoo", 60, 8, 4, "#f1efe9"),
    retail("Kérastase", "Concentré Décalcifiant Ultra-Réparateur", 89, 6, 3, "#f1efe9"),
    retail("Kérastase", "Masque Filler Réparateur", 100, 4, 3, "#e9e4f2"),
    retail("Kérastase", "Serum Filler Fondamental", 89, 5, 3, "#e9e4f2"),
    retail("Kérastase", "Nectar Thermique Heat Protector", 65, 7, 4, "#2b2b2b"),
    retail("Kérastase", "8H Magic Night Serum", 89, 5, 3, "#5a4d8c"),
    retail("Kérastase", "Elixir Ultime Original Hair Oil", 74, 6, 4, "#d8b46a"),
    retail("Kérastase", "Chroma Absolu Bain Chroma Respect", 60, 9, 4, "#7b2633"),
    retail("Kérastase", "Chroma Absolu Masque Vert", 68, 1, 3, "#3f6b4f"),
    retail("Kérastase", "Bain Extentioniste Shampoo", 60, 6, 3, "#e7e2d8"),
    retail("Kérastase", "Extentioniste Scalp & Hair Serum", 78, 5, 2, "#e7e2d8"),
    retail("Kérastase", "Fresh Affair Dry Shampoo", 56, 0, 3, "#cfd7de"),
    retail("Kérastase", "Bain Ultra-Violet Shampoo", 60, 6, 4, "#6b55a6"),
    retail("Kérastase", "Curl Manifesto Gelée Curl Contour", 65, 4, 2, "#c79a5a"),
    retail("Moroccanoil", "Treatment Original 100 ml", 55, 9, 6, "#2b8a8a"),
    retail("Moroccanoil", "Treatment Original Light 100 ml", 55, 7, 4, "#3aa0a0"),
    retail("Moroccanoil", "Hydrating Styling Cream 300 ml", 40, 5, 3, "#2b8a8a"),
    retail("Moroccanoil", "Luminous Hairspray · Strong", 30, 2, 4, "#2b8a8a"),
    retail("Moroccanoil", "Dry Shampoo · Light Tones 205 ml", 36, 6, 3, "#c27b4e"),
    retail("Moroccanoil", "Ceramic 45 mm Round Brush", 36, 4, 2, "#1b1b1b"),
    retail("Color Wow", "Dream Coat Anti-Frizz 200 ml", 32, 11, 6, "#d9a3c0"),
    retail("Color Wow", "Dream Coat for Curly Hair", 29, 6, 3, "#c78bb0"),
    retail("Color Wow", "Dream Cocktail Carb-Infused", 34, 5, 3, "#e2b8cf"),
    retail("Schwarzkopf OSiS+", "Session Extreme Hold Hairspray 500 ml", 21, 8, 4, "#1b1b1b"),
    retail("Schwarzkopf OSiS+", "Sparkler Shine Spray", 19, 2, 3, "#1b1b1b"),
    retail("KMS", "Head Remedy Deep Cleanse Shampoo 300 ml", 30, 5, 3, "#6c7d88"),
    retail("Salon Rx", "Toner Kit", 25, 6, 4, "#1f5fa6"),
    retail("Salon Rx", "Root Kit", 60, 5, 4, "#1f5fa6"),
    // Back bar and extensions never appear on the public shop.
    backBar("Goldwell", "Topchic 7N, 60 ml", "Back bar", 12, 14, 8, "Goldwell"),
    backBar("Goldwell", "Topchic 6RB, 60 ml", "Back bar", 12, 5, 6, "Goldwell"),
    backBar("Goldwell", "Elumen GB@6, 200 ml", "Back bar", 38, 4, 2, "Goldwell"),
    backBar("Goldwell", "Oxycur Platin lightener 500 g", "Back bar", 46, 5, 3, "Goldwell"),
    backBar("Goldwell", "Topchic developer 6%, 1 L", "Back bar", 16, 5, 4, "Goldwell"),
    backBar("Supplies", 'Foil roll 5"', "Back bar", 24, 2, 3, "Salon supply"),
    backBar("Extensions", 'Hot Fusion bonds, 22" (pack)', "Extensions", 150, 4, 2, "Extension supplier"),
    backBar("Extensions", 'Tape-In wefts, 20" (pack)', "Extensions", 95, 1, 3, "Extension supplier"),
  ];
}

/* ---------- clients ---------- */

function daysAgo(now: Date, n: number | null): string | null {
  return n == null ? null : new Date(now.getTime() - n * 86_400_000).toISOString();
}

function buildClients(now: Date): Client[] {
  const c = (
    id: string,
    name: string,
    phone: string,
    stylistId: string,
    since: string,
    visits: number,
    spend: number,
    lastDays: number | null,
    teaOrder: string,
    allergy: string,
    patchDays: number | null,
    formula: string,
    notes: string,
  ): Client => ({
    id,
    name,
    phone,
    email: `${name.split(" ")[0].toLowerCase()}.${name.split(" ")[1][0].toLowerCase()}@example.com`,
    stylistId,
    since,
    visits,
    spendCents: spend * 100,
    lastVisitAt: daysAgo(now, lastDays),
    teaOrder,
    allergy,
    patchTestAt: daysAgo(now, patchDays),
    formula,
    notes,
  });

  return [
    c("c1", "Megan Doyle", "705-555-0142", "allison", "2017", 44, 6120, 27, "Oat latte, chocolate chip cookie", "", 40, "Base: Topchic 7N + 7G 1:1 · 6% · 35 min\nFoils: Oxycur Platin + 6%, babylights\nToner: 9V + 9N 1:1 · 20 min", "Soft at the hairline. Hard water at home, add decalcifying treatment."),
    c("c2", "Priya Raman", "705-555-0177", "nickie", "2022", 16, 4210, 49, "Green tea, no sugar", "PPD sensitivity, use Elumen", 120, 'Tape-In 20", 6 packs\nElumen over lifted ends · 20 min', "Extension move-up due. Prefers Wednesday evenings."),
    c("c3", "Dana Whitfield", "705-555-0119", "tanya", "2016", 58, 7120, 12, "Black coffee", "", 30, "Pre-lighten mid to ends\nVivid blue: direct dye, cobalt + clear 1:1", "The blue! Refresh every 5 weeks. Sulphate-free at home."),
    c("c4", "Jordan Ellis", "705-555-0164", "kim", "2024", 6, 270, 21, "Water", "", null, "—", "Short taper, #2 sides, scissor on top."),
    c("c5", "Sophie Lambert", "705-555-0108", "tanya", "2026", 1, 130, 60, "Chai", "", null, "Trial: low textured bun, face-framing pieces", "Wedding 12 June 2027 · party of 5 · on location."),
    c("c6", "Rachel Kim", "705-555-0131", "frank", "2020", 24, 3280, 35, "Peppermint tea", "Latex", 200, "All over: Topchic 5N + 6RB 2:1 · 6% · 35 min", "Grey coverage at temples. Patch test expired."),
    c("c7", "Hannah Morris", "705-555-0185", "josh", "2021", 19, 3655, 8, "Latte, oat milk", "", 90, "Balayage: Oxycur Platin + 6%, open-air\nToner: 8V + 9N 1:1", "Winter: richer tone, keep the dimension."),
    c("c8", "Olivia Tremblay", "705-555-0150", "josh", "2023", 9, 1990, 63, "Coffee, 2 creams", "", 150, 'Hot Fusion 22", 100 g', "Overdue for maintenance."),
  ];
}

/* ---------- appointments ---------- */

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

type SeedAppt = [staffId: string, clientId: string, serviceId: string, hour: number, minute: number, status: AppointmentStatus];

const SEED_APPTS: SeedAppt[] = [
  ["allison", "c1", "c-basehalf", 10, 0, "confirmed"],
  ["allison", "c3", "c-toner", 13, 30, "confirmed"],
  ["tanya", "c3", "c-pre", 10, 0, "arrived"],
  ["tanya", "c5", "w-trial", 13, 0, "confirmed"],
  ["frank", "c6", "c-all", 11, 0, "pending"],
  ["frank", "c4", "cut-m", 14, 0, "confirmed"],
  ["nickie", "c2", "t-ext", 10, 30, "confirmed"],
  ["josh", "c7", "c-ref", 10, 0, "confirmed"],
  ["josh", "c8", "c-bal", 13, 30, "confirmed"],
  ["kim", "c4", "cut-sr", 11, 30, "confirmed"],
  ["alana", "c1", "bd-reg", 12, 0, "confirmed"],
  ["tryla", "c6", "bd-long", 10, 30, "confirmed"],
];

export function buildSeedAppointments(now: Date, hours: WeekHours = DEFAULT_HOURS): Appointment[] {
  const day = nextOpenDay(now, hours);
  const weekday = weekdayOf(day);
  const open = hours[weekday];
  if (!open) return [];
  const createdAt = now.toISOString();

  return SEED_APPTS.flatMap(([staffId, clientId, serviceId, h, m, status], i) => {
    const staff = SEED_STAFF.find((s) => s.id === staffId);
    const service = SEED_SERVICES.find((s) => s.id === serviceId);
    if (!staff || !service || !staff.workDays.includes(weekday)) return [];
    const startMin = h * 60 + m;
    if (startMin < open.openMin || startMin >= open.closeMin - 60) return [];
    const start = instantAt(day, startMin);
    return [
      {
        id: `seed-${i}`,
        staffId,
        clientId,
        serviceId,
        startsAt: start.toISOString(),
        endsAt: addMinutes(start, service.durationMin).toISOString(),
        status,
        source: "seed" as const,
        priceCents: priceForLevel(service, staff.level),
        note: "",
        createdAt,
      },
    ];
  });
}

/* ---------- sales and reports ---------- */

function buildSeedSales(now: Date, products: Product[]): Sale[] {
  const service = SEED_SERVICES.find((s) => s.id === "c-basefull")!;
  const product = products.find((p) => p.brand === "Color Wow")!;
  const totals = computeTotals(
    [
      { kind: "service", priceCents: service.priceCents },
      { kind: "product", priceCents: product.priceCents },
    ],
    0,
  );
  return [
    {
      id: "sale-seed-1",
      at: now.toISOString(),
      clientId: "c7",
      staffId: "josh",
      paymentMethod: "Card",
      lines: [
        { kind: "service", refId: service.id, name: service.name, priceCents: service.priceCents },
        { kind: "product", refId: product.sku, name: product.name, priceCents: product.priceCents },
      ],
      ...totals,
    },
  ];
}

export function sampleReports(): ReportsSummary {
  const total = [5820, 6110, 5960, 6480, 6290, 6720, 6610, 7020];
  const retailPart = [820, 910, 780, 990, 940, 1020, 1000, 1110];
  return {
    weeks: total.map((t, i) => ({
      label: `WK ${i + 1}`,
      servicesCents: (t - retailPart[i]) * 100,
      retailCents: retailPart[i] * 100,
    })),
    kpis: {
      revenue8wCents: total.reduce((a, b) => a + b, 0) * 100,
      revenueChangePercent: 11,
      avgTicketCents: 14200,
      avgTicketChangeCents: 900,
      newClients: 27,
      onlineNewClients: 11,
      lateCancelPercent: 1.8,
      lateFeesCollected: 6,
    },
    mix: [
      { label: "Colour", percent: 46 },
      { label: "Cut & style", percent: 19 },
      { label: "Blow dry", percent: 11 },
      { label: "Extensions", percent: 10 },
      { label: "Weddings", percent: 8 },
      { label: "Treatments", percent: 6 },
    ],
    isSample: true,
  };
}

/* ---------- the whole starting state ---------- */

export interface SeedState {
  seedDay: DateKey;
  staff: Staff[];
  services: Service[];
  clients: Client[];
  appointments: Appointment[];
  products: Product[];
  reservations: { sku: string; at: string }[];
  sales: Sale[];
  settings: Settings;
  outbox: never[];
}

export function createSeedState(now: Date): SeedState {
  const products = buildProducts();
  return {
    seedDay: nextOpenDay(now, DEFAULT_HOURS),
    staff: structuredClone(SEED_STAFF),
    services: structuredClone(SEED_SERVICES),
    clients: buildClients(now),
    appointments: buildSeedAppointments(now),
    products,
    reservations: [],
    sales: buildSeedSales(now, products),
    settings: structuredClone(DEFAULT_SETTINGS),
    outbox: [],
  };
}
