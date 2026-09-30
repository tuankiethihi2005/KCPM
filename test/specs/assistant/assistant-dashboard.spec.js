const { test, expect } = require("@playwright/test");
const { TEST_CONFIG, SELECTORS } = require("../../helpers/test-data-assistant");
const { loginViaUI, waitForLoadingToFinish } = require("../../helpers/auth-helper");

test.describe("Assistant Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, {
      email: TEST_CONFIG.ASSISTANT.email,
      password: TEST_CONFIG.ASSISTANT.password,
    });
    await waitForLoadingToFinish(page);
  });

  test("should display assistant dashboard with correct title", async ({ page }) => {
    const title = page.locator("h1").first();
    await expect(title).toBeVisible({ timeout: 10000 });
    const text = await title.textContent();
    expect(text).toContain("Trợ lý");
  });

  test("should show task assignments section", async ({ page }) => {
    await expect(page.locator("text=Nhiệm vụ được giao")).toBeVisible({ timeout: 10000 });
    // Should link to full tasks page (use .first() due to multiple matches)
    await expect(page.locator('a[href="/assistant/tasks"]').first()).toBeVisible();
  });

  test("should show income statistics section", async ({ page }) => {
    await expect(page.locator("text=Thống kê thu nhập")).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to tasks page from dashboard", async ({ page }) => {
    const tasksLink = page.locator('a[href="/assistant/tasks"]').first();
    await expect(tasksLink).toBeVisible();
    await tasksLink.click();
    await page.waitForURL("/assistant/tasks");
  });

  test("should navigate to income page from dashboard", async ({ page }) => {
    const incomeLink = page.locator('a[href="/assistant/income"]').first();
    await expect(incomeLink).toBeVisible();
    await incomeLink.click();
    await page.waitForURL("/assistant/income");
  });

  test("should show sidebar with assistant-specific menu items", async ({ page }) => {
    const sidebar = page.locator(SELECTORS.SIDEBAR.ASIDE).first();
    await expect(sidebar).toBeVisible();

    await expect(sidebar.locator('a[href="/assistant/tasks"]')).toBeVisible();
    await expect(sidebar.locator('a[href="/assistant/income"]')).toBeVisible();
    await expect(sidebar.getByText("Assistant", { exact: true })).toBeVisible();
  });

  test("should navigate via sidebar to tasks", async ({ page }) => {
    await page.locator(SELECTORS.SIDEBAR.ASIDE).first().locator('a[href="/assistant/tasks"]').click();
    await page.waitForURL("/assistant/tasks");
  });

  test("should navigate via sidebar to income", async ({ page }) => {
    await page.locator(SELECTORS.SIDEBAR.ASIDE).first().locator('a[href="/assistant/income"]').click();
    await page.waitForURL("/assistant/income");
  });
});
