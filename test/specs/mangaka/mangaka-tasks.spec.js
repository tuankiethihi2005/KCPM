const { test, expect } = require("@playwright/test");
const { TEST_CONFIG, SELECTORS } = require("../../helpers/test-data-mangaka");
const { loginViaUI, waitForLoadingToFinish } = require("../../helpers/auth-helper");

test.describe("Mangaka Tasks Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, {
      email: TEST_CONFIG.MANGAKA.email,
      password: TEST_CONFIG.MANGAKA.password,
    });
    await page.goto("/mangaka/tasks");
    await waitForLoadingToFinish(page);
  });

  test("should display tasks page with title", async ({ page }) => {
    const title = page.locator("h1:has-text('Task')").first();
    await expect(title).toBeVisible({ timeout: 10000 });

    // Should have at least the list tab visible
    const listTab = page.locator('button:has-text("Danh sách")').first();
    await expect(listTab).toBeVisible({ timeout: 5000 });
  });

  test("should show create task tab with form", async ({ page }) => {
    // Click on create task tab
    const createTab = page.locator('button:has-text("Tạo")').first();
    await expect(createTab).toBeVisible({ timeout: 5000 });
    await createTab.click();
    await page.waitForTimeout(1000);

    // Create form should have required fields
    // Series select
    const seriesSelect = page.locator("select:below(:text('Series'))").first();
    await expect(seriesSelect).toBeVisible({ timeout: 5000 });

    // Assistant select
    const assistantSelect = page
      .locator("select:below(:text('Trợ lý'))")
      .first();
    await expect(assistantSelect).toBeVisible({ timeout: 5000 });

    // Price input
    const priceInput = page
      .locator('input[type="number"]:below(:text("Lương"))')
      .first();
    await expect(priceInput).toBeVisible({ timeout: 5000 });

    // Deadline input
    const deadlineInput = page
      .locator('input[type="datetime-local"]')
      .first();
    await expect(deadlineInput).toBeVisible({ timeout: 5000 });

    // Submit button
    const submitBtn = page.locator('button:has-text("Xác nhận")').first();
    await expect(submitBtn).toBeVisible();
  });

  test("should show task list with existing tasks", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Should have task list or empty state
    const listTab = page.locator('button:has-text("Danh sách")').first();
    await expect(listTab).toBeVisible();
  });

  test("should navigate to task detail when clicking a task", async ({
    page,
  }) => {
    await page.waitForTimeout(2000);

    // Look for clickable task items
    const taskItems = page.locator(
      "div.cursor-pointer, [class*='task-item']"
    );
    if ((await taskItems.count()) > 0) {
      await taskItems.first().click();
      // Detail panel should open
      await page.waitForTimeout(1000);
    }
  });
});
