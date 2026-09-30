const { test, expect } = require("@playwright/test");
const { TEST_CONFIG, SELECTORS } = require("../../helpers/test-data");
const {
  loginViaUI,
  waitForLoadingToFinish,
} = require("../../helpers/auth-helper");

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
    await waitForLoadingToFinish(page);
  });

  test("should display dashboard with key elements after loading", async ({
    page,
  }) => {
    // Verify the dashboard wrapper is visible (page has loaded)
    const dashboardTitle = page.locator(SELECTORS.DASHBOARD.TITLE).first();
    await expect(dashboardTitle).toBeVisible({ timeout: 15000 });

    // Title should contain dashboard-related text
    const titleText = await dashboardTitle.textContent();
    expect(titleText.length).toBeGreaterThan(0);

    // Verify stat cards exist (they are anchor elements in a grid)
    const statCards = page.locator("a[href]");
    const statCardCount = await statCards.count();
    expect(statCardCount).toBeGreaterThanOrEqual(5);
  });

  test("should navigate to admin users page via stat card", async ({
    page,
  }) => {
    await page.waitForTimeout(1000);

    // Find "Tổng người dùng" or click the link to /admin/users
    const usersLink = page.locator('a[href="/admin/users"]').first();
    await expect(usersLink).toBeVisible({ timeout: 10000 });
    await usersLink.click();

    await page.waitForURL("/admin/users");
    // Verify users page loaded
    await expect(
      page.locator("h1:has-text('Quản lý tài khoản')")
    ).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to all-series page via stat card", async ({
    page,
  }) => {
    await page.waitForTimeout(1000);

    const seriesLink = page.locator('a[href="/board/all-series"]').first();
    await expect(seriesLink).toBeVisible({ timeout: 10000 });
    await seriesLink.click();

    await page.waitForURL("/board/all-series");
  });

  test("should navigate to notifications via stat card or sidebar", async ({
    page,
  }) => {
    await page.waitForTimeout(1000);

    // Try clicking the notifications link in the stat cards
    const notifLink = page.locator('a[href="/notifications"]').first();
    await expect(notifLink).toBeVisible({ timeout: 10000 });
    await notifLink.click();

    await page.waitForURL("/notifications");
    // Verify notification page title
    await expect(
      page.locator("h1:has-text('Thông báo')")
    ).toBeVisible({ timeout: 10000 });
  });

  test("should show sidebar with navigation links", async ({ page }) => {
    // Sidebar should be visible with user info
    const sidebar = page.locator(SELECTORS.SIDEBAR.ASIDE).first();
    await expect(sidebar).toBeVisible();

    // Check that common menu items exist (use .first() because multiple elements may match)
    await expect(
      page.locator(SELECTORS.SIDEBAR.DASHBOARD_LINK).first()
    ).toBeVisible();
    await expect(
      page.locator(SELECTORS.SIDEBAR.NOTIFICATIONS_LINK).first()
    ).toBeVisible();

    // Check admin-specific menu items
    await expect(
      page.locator(SELECTORS.SIDEBAR.ADMIN_USERS_LINK).first()
    ).toBeVisible();
  });

  test("should display admin role badge in sidebar", async ({ page }) => {
    // Admin badge should be visible in sidebar header
    // Use exact text match to avoid matching "System Admin"
    const sidebar = page.locator(SELECTORS.SIDEBAR.ASIDE).first();
    await expect(sidebar.getByText("Admin", { exact: true })).toBeVisible();
  });
});
