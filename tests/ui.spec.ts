import { test, expect } from "@playwright/test";

test.describe("UI quality checks", () => {
  test("landing page has no JS errors in console", async ({ page }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (error) => {
      jsErrors.push(error.message);
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(jsErrors.length).toBe(0);
  });

  test("auth page displays loading/submit button", async ({ page }) => {
    await page.goto("/auth");
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test("landing page shows hero content", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    // Should have at least a heading
    const headings = page.locator("h1, h2");
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test("dark mode toggle does not break layout", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Try to find and click theme toggle if present
    const themeToggle = page.locator('[aria-label*="tema"], [aria-label*="theme"], [data-testid="theme-toggle"]');
    if (await themeToggle.count() > 0) {
      await themeToggle.first().click();
      await page.waitForTimeout(500);
      // Page should still be visible
      await expect(page.locator("body")).toBeVisible();
    }
  });
});
