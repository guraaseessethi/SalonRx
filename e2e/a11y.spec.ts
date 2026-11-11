import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PUBLIC = ["/", "/book", "/services", "/weddings", "/team", "/shop", "/visit"];
const ADMIN = ["dashboard", "calendar", "clients", "checkout", "inventory", "services", "staff", "reports", "marketing", "settings", "outbox"];

async function scan(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  // compact summary so a failure is readable
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .flatMap((v) =>
      v.nodes.map((n) => {
        const d = n.any[0]?.data as { fgColor?: string; bgColor?: string; contrastRatio?: number } | undefined;
        return `${v.id}: ${n.target.join(" ")}${d?.contrastRatio ? ` (${d.fgColor} on ${d.bgColor} = ${d.contrastRatio})` : ""}`;
      }),
    );
}

for (const scheme of ["light", "dark"] as const) {
  for (const path of PUBLIC) {
    test(`axe: ${path} (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(await scan(page), `${path} has serious or critical accessibility issues`).toEqual([]);
      await expect(page.locator("h1")).toHaveCount(1);
    });
  }
}

test("axe: booking steps 2-4 and confirmation", async ({ page }) => {
  await page.goto("/book?service=cut-sr");
  await page.getByRole("button", { name: "Continue" }).click();
  expect(await scan(page)).toEqual([]);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("group", { name: /^Times on/ }).getByRole("button").first().click();
  expect(await scan(page)).toEqual([]);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Confirm booking" }).click(); // shows the error state
  expect(await scan(page)).toEqual([]);
});

for (const scheme of ["light", "dark"] as const) {
  test(`axe: admin modules (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/admin/dashboard");
    expect(await scan(page), "role gate").toEqual([]);
    await page.getByRole("button", { name: /^Owner/ }).click();
    for (const m of ADMIN) {
      await page.goto(`/admin/${m}`);
      await expect(page.locator("main h1")).toHaveCount(1);
      await page.waitForLoadState("networkidle");
      expect(await scan(page), `/admin/${m}`).toEqual([]);
    }
  });
}
