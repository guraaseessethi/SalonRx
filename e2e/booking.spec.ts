import { expect, test } from "@playwright/test";

test("a booking made on the public site shows up in the admin calendar and dashboard", async ({
  page,
}) => {
  await page.goto("/book");
  await expect(page.getByRole("heading", { level: 1, name: /book in a minute/i })).toBeVisible();

  // 1. service
  await page.getByRole("button", { name: "Cut", exact: true }).click();
  await page
    .getByRole("button", { name: /^Cut & style\s*Cut · 60 min/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Continue" }).click();

  // 2. stylist: first available
  await expect(page.getByRole("heading", { name: "Choose a stylist" })).toBeFocused();
  await page.getByRole("button", { name: /First available/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  // 3. time (the first open day is preselected)
  await expect(page.getByRole("heading", { name: "Choose a time" })).toBeFocused();
  const slot = page
    .getByRole("group", { name: /^Times on/ })
    .getByRole("button")
    .first();
  await expect(slot).toBeVisible();
  await slot.click();
  await page.getByRole("button", { name: "Continue" }).click();

  // 4. details, with validation first
  await expect(page.getByRole("heading", { name: "Your details" })).toBeFocused();
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please fix" })).toBeVisible();
  await expect(page.getByLabel("Name")).toBeFocused();

  await page.getByLabel("Name").fill("E2E Tester");
  await page.getByLabel("Mobile").fill("705 555 0199");
  await page.getByLabel("Email (optional)").fill("e2e@example.com");
  await page.getByRole("button", { name: "Confirm booking" }).click();

  await expect(page.getByRole("heading", { name: "You're booked" })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Add to calendar" }).click();
  expect((await download).suggestedFilename()).toBe("salon-rx-appointment.ics");

  // the back office: pick the owner role, find the booking
  await page.getByRole("link", { name: "See it in the salon calendar" }).click();
  await expect(page.getByRole("heading", { name: "Staff back office" })).toBeVisible();
  await expect(page.getByText("Demo. Real staff login comes in the full build.")).toBeVisible();
  await page.getByRole("button", { name: /^Owner/ }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Calendar" })).toBeVisible();
  await expect(page.getByRole("button", { name: /E2E Tester/ })).toBeVisible();

  await page
    .getByRole("link", { name: /^Today/ })
    .first()
    .click();
  await expect(page.getByText(/new online booking/)).toBeVisible();

  // the confirmation text and email were logged, not sent
  await page
    .getByRole("link", { name: /^Outbox/ })
    .first()
    .click();
  await expect(page.getByText("e2e@example.com")).toBeVisible();
});

test("a paused booking form shows the phone number", async ({ page }) => {
  await page.goto("/admin/settings");
  await page.getByRole("button", { name: /^Owner/ }).click();
  await page.getByRole("switch", { name: /Accept online bookings/ }).uncheck();
  await page.goto("/book");
  await expect(page.getByRole("heading", { name: "Booking paused" })).toBeVisible();
  await expect(page.locator("#booker").getByRole("link", { name: "(705) 739-4044" })).toBeVisible();
});

test("roles change what is visible", async ({ page }) => {
  await page.goto("/admin/dashboard");
  await page.getByRole("button", { name: /^Front desk/ }).click();
  const nav = page.getByRole("navigation", { name: "Admin sections", exact: true });
  await expect(nav.getByRole("link", { name: "Checkout" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Reports" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Settings" })).toHaveCount(0);
  await page.goto("/admin/reports");
  await expect(page.getByRole("heading", { name: "Not for this role" })).toBeVisible();

  await page.getByRole("button", { name: "Switch role" }).first().click();
  await page.getByRole("button", { name: /^Stylist/ }).click();
  await expect(nav.getByRole("link", { name: "Inventory" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Calendar" })).toBeVisible();
});

test("checkout takes retail off the shelf and the price list follows the services editor", async ({
  page,
}) => {
  await page.goto("/admin/services");
  await page.getByRole("button", { name: /^Owner/ }).click();
  const price = page.getByLabel("Price in dollars, Toner");
  await price.fill("35");
  await price.blur();
  await expect(page.getByText("Price updated on the website")).toBeVisible();

  await page.goto("/services");
  await page.getByRole("button", { name: "Colour", exact: true }).click();
  await expect(page.getByText("$35").first()).toBeVisible();

  await page.goto("/admin/inventory");
  const row = page.getByRole("row", { name: /Toner Kit/ });
  await expect(row.getByText("6", { exact: false }).first()).toBeVisible();
  await page.goto("/admin/checkout");
  await page.getByRole("button", { name: /Toner Kit/ }).click();
  await page.getByRole("button", { name: "Card", exact: true }).click();
  await expect(page.getByText(/Card · \$28\.25 paid/)).toBeVisible();
  await page.goto("/admin/inventory");
  await expect(page.getByRole("row", { name: /Toner Kit/ })).toContainText("5");
});

test("mobile menu is an accessible disclosure", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  const button = page.getByRole("button", { name: "Menu" });
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("navigation", { name: "Main (mobile)" }).getByRole("link", { name: "Services" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();
});
