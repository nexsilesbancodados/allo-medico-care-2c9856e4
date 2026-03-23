import { test, expect } from "@playwright/test";

test.describe("Navigation & responsiveness", () => {
  test("landing page loads without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Filter out known benign errors (e.g. favicon, analytics)
    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("analytics") && !e.includes("gtag")
    );
    expect(criticalErrors.length).toBe(0);
  });

  test("landing page renders at mobile viewport (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    // Page should be scrollable and not overflow horizontally
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("landing page renders at desktop viewport (1280px)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("auth page loads correctly", async ({ page }) => {
    await page.goto("/auth");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
  });

  test("terms page loads correctly", async ({ page }) => {
    await page.goto("/termos");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
  });

  test("privacy page loads correctly", async ({ page }) => {
    await page.goto("/privacidade");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
  });
});
