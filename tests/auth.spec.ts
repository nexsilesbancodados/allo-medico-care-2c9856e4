import { test, expect } from "@playwright/test";

test.describe("Authentication flows", () => {
  test("accessing /dashboard without login redirects to auth page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/(auth|login)/);
    expect(page.url()).toMatch(/\/(auth|login)/);
  });

  test("login page renders email and password fields", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator('input[type="email"], input#email')).toBeVisible();
    await expect(page.locator('input[type="password"], input#password')).toBeVisible();
  });

  test("submitting empty login shows validation errors", async ({ page }) => {
    await page.goto("/auth");
    await page.click('button[type="submit"]');
    // Should show error messages
    const errorTexts = await page.locator('[class*="destructive"], [class*="error"]').count();
    expect(errorTexts).toBeGreaterThan(0);
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/auth");
    await page.fill('input[type="email"], input#email', "invalid@test.com");
    await page.fill('input[type="password"], input#password', "wrongpassword123");
    await page.click('button[type="submit"]');
    // Wait for error to appear
    await page.waitForSelector('[class*="destructive"], [role="alert"], [data-sonner-toast]', { timeout: 10000 });
  });

  test("404 page appears for unknown routes", async ({ page }) => {
    await page.goto("/some-nonexistent-route-xyz");
    await expect(page.locator("body")).toContainText(/404|não encontrada|not found/i);
  });
});
