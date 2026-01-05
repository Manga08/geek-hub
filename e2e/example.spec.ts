import { test, expect } from "@playwright/test";

test("home page shows default content", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Create Next App/i);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
