import { test } from "@playwright/test";

/** `pnpm screenshots` writes docs/screenshots/<page>-<width>-<scheme>.jpg  (needs a production build running). */
const WIDTHS = [360, 768, 1280];
const SCHEMES = ["light", "dark"] as const;
const PUBLIC = [
  ["home", "/"],
  ["services", "/services"],
  ["weddings", "/weddings"],
  ["book", "/book?service=cut-sr"],
  ["shop", "/shop"],
  ["visit", "/visit"],
] as const;
const ADMIN = ["dashboard", "calendar", "clients", "checkout", "inventory", "reports"] as const;

for (const scheme of SCHEMES) {
  for (const width of WIDTHS) {
    test(`screenshots ${scheme} ${width}`, async ({ browser }) => {
      test.setTimeout(120_000);
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        colorScheme: scheme,
      });
      const page = await context.newPage();
      const shot = async (name: string) => {
        // scroll through the page so lazy-loaded photos are in the picture
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 700) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 60));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(250);
        await page.screenshot({
          path: `docs/screenshots/${name}-${width}-${scheme}.jpg`,
          type: "jpeg",
          quality: 72,
          fullPage: true,
        });
      };

      for (const [name, path] of PUBLIC) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        if (name === "book") {
          await page.getByRole("button", { name: "Continue" }).click();
          await page.getByRole("button", { name: "Continue" }).isVisible();
        }
        await shot(name);
      }

      await page.goto("/admin/dashboard");
      await page.getByRole("button", { name: /^Owner/ }).click();
      for (const m of ADMIN) {
        await page.goto(`/admin/${m}`);
        await page.getByRole("heading", { level: 1 }).waitFor();
        await page.waitForLoadState("networkidle");
        await shot(`admin-${m}`);
      }
      await context.close();
    });
  }
}
