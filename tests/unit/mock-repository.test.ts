import { beforeEach, describe, expect, it } from "vitest";
import { BookingError } from "@/lib/data/repository";
import { MockRepository } from "@/lib/data/mock/mock-repository";
import { MemoryStorage } from "@/lib/data/mock/storage";

/** Tuesday 2026-11-17, 9 am Toronto. The salon is closed, the next open day is Wednesday 18th. */
const NOW = new Date("2026-11-17T14:00:00Z");

function make(now = NOW) {
  return new MockRepository({
    data: new MemoryStorage(),
    session: new MemoryStorage(),
    now: () => now,
  });
}

const input = {
  serviceId: "cut-sr",
  staffId: "any",
  startsAt: "",
  name: "Test Person",
  phone: "705 555 0123",
  email: "test@example.com",
  note: "Bring photos",
};

describe("MockRepository: booking", () => {
  let repo: MockRepository;
  beforeEach(() => {
    repo = make();
  });

  it("creates a new online appointment, a client and demo messages", async () => {
    const slots = await repo.getAvailability({
      serviceId: "cut-sr",
      staffId: "any",
      date: "2026-11-18",
    });
    expect(slots.length).toBeGreaterThan(0);
    const result = await repo.createAppointment({ ...input, startsAt: slots[0].startsAt });
    expect(result.appointment.status).toBe("new");
    expect(result.appointment.source).toBe("online");
    expect(result.client.name).toBe("Test Person");
    const appts = await repo.listAppointments({ from: "2026-11-18", to: "2026-11-18" });
    expect(appts.some((a) => a.id === result.appointment.id)).toBe(true);
    const outbox = await repo.listOutbox();
    expect(outbox.map((m) => m.channel).sort()).toEqual(["email", "sms"]);
  });

  it("prevents double booking the same slot", async () => {
    const [slot] = await repo.getAvailability({
      serviceId: "cut-sr",
      staffId: "kim",
      date: "2026-11-18",
    });
    await repo.createAppointment({ ...input, staffId: "kim", startsAt: slot.startsAt });
    await expect(
      repo.createAppointment({
        ...input,
        name: "Other Person",
        staffId: "kim",
        startsAt: slot.startsAt,
      }),
    ).rejects.toMatchObject({
      code: "unavailable",
    });
  });

  it("an 'anyone' booking moves to another stylist when the first is busy", async () => {
    const slots = await repo.getAvailability({
      serviceId: "cut-sr",
      staffId: "any",
      date: "2026-11-18",
    });
    const slot = slots.find((s) => s.staffIds.length >= 2)!;
    const a = await repo.createAppointment({ ...input, startsAt: slot.startsAt });
    const b = await repo.createAppointment({
      ...input,
      name: "Second Person",
      phone: "705 555 0199",
      startsAt: slot.startsAt,
    });
    expect(a.staff.id).not.toBe(b.staff.id);
  });

  it("re-uses an existing client matched by phone number", async () => {
    const before = (await repo.listClients()).length;
    const [slot] = await repo.getAvailability({
      serviceId: "cut-sr",
      staffId: "kim",
      date: "2026-11-18",
    });
    const r = await repo.createAppointment({
      ...input,
      name: "Somebody Else",
      phone: "705-555-0142",
      staffId: "kim",
      startsAt: slot.startsAt,
    });
    expect(r.client.id).toBe("c1");
    expect((await repo.listClients()).length).toBe(before);
  });

  it("charges the intermediate price for an intermediate stylist", async () => {
    const [slot] = await repo.getAvailability({
      serviceId: "cut-sr",
      staffId: "kim",
      date: "2026-11-18",
    });
    const r = await repo.createAppointment({ ...input, staffId: "kim", startsAt: slot.startsAt });
    expect(r.appointment.priceCents).toBe(5625);
  });

  it("rejects invalid details with a friendly message", async () => {
    const [slot] = await repo.getAvailability({
      serviceId: "cut-sr",
      staffId: "any",
      date: "2026-11-18",
    });
    await expect(
      repo.createAppointment({ ...input, startsAt: slot.startsAt, phone: "123" }),
    ).rejects.toBeInstanceOf(BookingError);
    await expect(
      repo.createAppointment({ ...input, startsAt: slot.startsAt, name: "" }),
    ).rejects.toMatchObject({ code: "validation" });
  });

  it("refuses bookings when online booking is paused", async () => {
    const [slot] = await repo.getAvailability({
      serviceId: "cut-sr",
      staffId: "any",
      date: "2026-11-18",
    });
    await repo.setSetting("acceptOnlineBookings", false);
    await expect(
      repo.createAppointment({ ...input, startsAt: slot.startsAt }),
    ).rejects.toMatchObject({ code: "paused" });
  });

  it("refuses a slot that is not on offer (closed day, wrong time)", async () => {
    await expect(
      repo.createAppointment({ ...input, startsAt: "2026-11-17T15:00:00.000Z" }),
    ).rejects.toMatchObject({ code: "unavailable" });
  });
});

describe("MockRepository: checkout, stock and reservations", () => {
  it("a sale decrements retail stock, clears the reservation and updates the client", async () => {
    const repo = make();
    const product = (await repo.listProducts()).find((p) => p.brand === "Color Wow")!;
    await repo.toggleReservation(product.sku);
    expect((await repo.listReservations()).length).toBe(1);
    const sale = await repo.createSale({
      clientId: "c1",
      paymentMethod: "Card",
      tipPercent: 15,
      lines: [
        { kind: "service", serviceId: "cut-sr", staffId: "allison" },
        { kind: "product", sku: product.sku },
      ],
    });
    expect(sale.serviceCents).toBe(7500);
    expect(sale.retailCents).toBe(product.priceCents);
    const after = (await repo.listProducts()).find((p) => p.sku === product.sku)!;
    expect(after.stock).toBe(product.stock - 1);
    expect((await repo.listReservations()).length).toBe(0);
    const client = (await repo.listClients()).find((c) => c.id === "c1")!;
    expect(client.visits).toBe(45);
  });

  it("refuses to sell more than is on hand", async () => {
    const repo = make();
    const soldOut = (await repo.listProducts()).find((p) => p.stock === 0)!;
    await expect(
      repo.createSale({
        clientId: null,
        paymentMethod: "Cash",
        tipPercent: 0,
        lines: [{ kind: "product", sku: soldOut.sku }],
      }),
    ).rejects.toThrow(/on hand/);
  });

  it("checking out an appointment marks it paid and applies the stylist's price", async () => {
    const repo = make();
    const appts = await repo.listAppointments();
    const kim = appts.find((a) => a.staffId === "kim")!;
    expect(kim).toBeDefined();
    const sale = await repo.createSale({
      clientId: kim.clientId,
      appointmentId: kim.id,
      paymentMethod: "Card",
      tipPercent: 0,
      lines: [{ kind: "service", serviceId: kim.serviceId }],
    });
    expect(sale.staffId).toBe("kim");
    expect(sale.serviceCents).toBe(kim.priceCents);
    expect((await repo.listAppointments()).find((a) => a.id === kim.id)?.status).toBe("done");
  });

  it("can not reserve a sold-out product", async () => {
    const repo = make();
    const soldOut = (await repo.listProducts()).find((p) => p.stock === 0)!;
    expect(await repo.toggleReservation(soldOut.sku)).toBe(false);
  });

  it("every SKU is unique", async () => {
    const products = await make().listProducts();
    expect(new Set(products.map((p) => p.sku)).size).toBe(products.length);
  });
});

describe("MockRepository: calendar, demo session and reset", () => {
  it("won't create a staff appointment on top of another one", async () => {
    const repo = make();
    const existing = (await repo.listAppointments()).find((a) => a.staffId === "josh")!;
    await expect(
      repo.createStaffAppointment({
        clientId: "c2",
        serviceId: "cut-sr",
        staffId: "josh",
        startsAt: existing.startsAt,
      }),
    ).rejects.toMatchObject({ code: "unavailable" });
  });

  it("cancelling frees the slot", async () => {
    const repo = make();
    const existing = (await repo.listAppointments()).find((a) => a.staffId === "josh")!;
    await repo.setAppointmentStatus(existing.id, "cancelled");
    const slots = await repo.getAvailability({
      serviceId: "cut-sr",
      staffId: "josh",
      date: "2026-11-18",
    });
    expect(slots.some((s) => s.startsAt === existing.startsAt)).toBe(true);
  });

  it("keeps the demo role per session and resets data without logging out", async () => {
    const repo = make();
    expect(await repo.getSession()).toBeNull();
    await repo.setSession({ role: "stylist", staffId: "tanya" });
    expect(await repo.getSession()).toEqual({ role: "stylist", staffId: "tanya" });
    await repo.resetDemoData();
    expect(await repo.getSession()).toEqual({ role: "stylist", staffId: "tanya" });
  });

  it("notifies subscribers on every write", async () => {
    const repo = make();
    let calls = 0;
    const off = repo.subscribe(() => calls++);
    await repo.setSetting("rebookNudges", false);
    expect(calls).toBe(1);
    off();
    await repo.setSetting("rebookNudges", true);
    expect(calls).toBe(1);
  });

  it("moves the seeded day forward when the date changes, keeping people's bookings", async () => {
    const data = new MemoryStorage();
    const session = new MemoryStorage();
    const day1 = new MockRepository({ data, session, now: () => NOW });
    const [slot] = await day1.getAvailability({
      serviceId: "cut-sr",
      staffId: "kim",
      date: "2026-11-19",
    });
    const booked = await day1.createAppointment({
      ...input,
      staffId: "kim",
      startsAt: slot.startsAt,
    });
    const day2 = new MockRepository({ data, session, now: () => new Date("2026-11-18T15:00:00Z") });
    const appts = await day2.listAppointments();
    expect(appts.some((a) => a.id === booked.appointment.id)).toBe(true);
    expect(appts.filter((a) => a.source === "seed").length).toBeGreaterThan(0);
  });
});
