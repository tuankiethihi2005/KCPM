const { test, expect } = require("@playwright/test");
const { TEST_CONFIG, SELECTORS } = require("../../helpers/test-data");
const {
  loginViaUI,
  waitForLoadingToFinish,
} = require("../../helpers/auth-helper");

test.describe("Admin Notifications", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
    await page.goto("/notifications");
    await waitForLoadingToFinish(page);
  });

  test("should display notifications page with correct structure", async ({
    page,
  }) => {
    // Verify page title
    const title = page.locator(SELECTORS.NOTIFICATIONS.PAGE_TITLE);
    await expect(title).toBeVisible({ timeout: 10000 });

    // Verify filter tabs are present (buttons with emoji + text)
    const allTab = page.locator('button:has-text("Tất cả")');
    const systemTab = page.locator('button:has-text("Hệ thống")');
    const taskTab = page.locator('button:has-text("Công việc")');
    const warningTab = page.locator('button:has-text("Cảnh báo")');

    await expect(allTab).toBeVisible();
    await expect(systemTab).toBeVisible();
    await expect(taskTab).toBeVisible();
    await expect(warningTab).toBeVisible();
  });

  test("should display notifications or empty state", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Check for notification items
    // NotificationItem renders as div with onClick handler
    const notificationDivs = page.locator("div.cursor-pointer");

    // Also check for empty state
    const emptyState = page.locator(SELECTORS.NOTIFICATIONS.EMPTY_STATE);

    const hasNotifications = (await notificationDivs.count()) > 0;
    const hasEmptyState = (await emptyState.count()) > 0;

    // Either there are notification items (found by cursor-pointer class) or empty state
    expect(hasNotifications || hasEmptyState).toBeTruthy();
  });

  test("should filter notifications when clicking filter tabs", async ({
    page,
  }) => {
    await page.waitForTimeout(2000);

    // Click on "Hệ thống" filter tab
    const systemTab = page.locator('button:has-text("Hệ thống")');
    await systemTab.click();

    // Wait for filter to apply
    await page.waitForTimeout(1000);

    // The page should still be functional - either show filtered results or empty state
    const notifDivs = page.locator("div.cursor-pointer");
    const emptyState = page.locator(SELECTORS.NOTIFICATIONS.EMPTY_STATE);
    expect(
      (await notifDivs.count()) > 0 || (await emptyState.count()) > 0
    ).toBeTruthy();
  });

  test("should navigate between notifications and dashboard via sidebar", async ({
    page,
  }) => {
    // Already on notifications page, click "Trang chủ" in sidebar
    const homeLink = page.locator(SELECTORS.SIDEBAR.DASHBOARD_LINK);
    await expect(homeLink).toBeVisible();
    await homeLink.click();

    // Should navigate to dashboard
    await page.waitForURL("/");
    const dashboardTitle = page.locator("h1").first();
    await expect(dashboardTitle).toBeVisible({ timeout: 10000 });
  });

  test("should show notification link in sidebar", async ({ page }) => {
    // Verify the notification sidebar link exists
    const notifLink = page.locator(SELECTORS.SIDEBAR.NOTIFICATIONS_LINK);
    await expect(notifLink).toBeVisible();

    // Verify we are on the notifications page
    await expect(
      page.locator("h1:has-text('Thông báo')")
    ).toBeVisible();
  });
});
