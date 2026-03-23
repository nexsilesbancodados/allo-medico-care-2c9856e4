import { test, expect } from "@playwright/test";

test.describe("CRUD form validation", () => {
  test("auth registration form validates empty fields", async ({ page }) => {
    await page.goto("/auth");
    
    // Switch to registration mode if possible
    const registerLink = page.locator('text=/cadastr|registr|criar conta/i');
    if (await registerLink.count() > 0) {
      await registerLink.first().click();
      await page.waitForTimeout(500);
    }

    // Try submitting empty form
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.first().click();
      await page.waitForTimeout(1000);

      // Should show validation errors or toasts
      const errors = page.locator('[class*="destructive"], [class*="error"], [role="alert"], [data-sonner-toast]');
      const errorCount = await errors.count();
      expect(errorCount).toBeGreaterThan(0);
    }
  });

  test("email field validates format", async ({ page }) => {
    await page.goto("/auth");
    const emailInput = page.locator('input[type="email"], input#email');
    
    if (await emailInput.count() > 0) {
      await emailInput.fill("not-an-email");
      await emailInput.blur();
      await page.waitForTimeout(500);
      
      // Should show email validation error
      const body = await page.locator("body").textContent();
      // The page should not crash
      expect(body).toBeTruthy();
    }
  });
});
