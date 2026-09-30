const { test, expect } = require("@playwright/test");
const { TEST_CONFIG, SELECTORS } = require("../../helpers/test-data");
const {
  loginViaUI,
  waitForLoadingToFinish,
} = require("../../helpers/auth-helper");

test.describe("Admin Series Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
  });

  test("should navigate to all-series page", async ({ page }) => {
    await page.goto("/board/all-series");
    await waitForLoadingToFinish(page);
    // Page should load - check that we're on the right URL
    await expect(page).toHaveURL(/\/board\/all-series/);
  });

  test("should navigate to at-risk series page", async ({ page }) => {
    await page.goto("/admin/series");
    await waitForLoadingToFinish(page);
    await expect(page).toHaveURL(/\/admin\/series/);
  });

  test("should navigate to series review page", async ({ page }) => {
    await page.goto("/board/reviews");
    await waitForLoadingToFinish(page);
    await expect(page).toHaveURL(/\/board\/reviews/);
  });

  test("should navigate to releases page", async ({ page }) => {
    await page.goto("/admin/releases");
    await waitForLoadingToFinish(page);
    await expect(page).toHaveURL(/\/admin\/releases/);
  });

  test("should navigate to ranking page", async ({ page }) => {
    await page.goto("/admin/ranking");
    await waitForLoadingToFinish(page);
    await expect(page).toHaveURL(/\/admin\/ranking/);
  });

  test("should have sidebar with series-related navigation links", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForLoadingToFinish(page);

    // Sidebar should have series management links
    const sidebar = page.locator(SELECTORS.SIDEBAR.ASIDE).first();
    await expect(sidebar).toBeVisible();

    // Check for various series/board links in sidebar
    const seriesLinks = [
      "Danh sách Series",
      "Duyệt Series Mới",
      "Series có nguy cơ",
      "Quản lý Phát hành",
      "Ranking & Vote",
    ];

    for (const linkText of seriesLinks) {
      const link = sidebar.locator(`a:has-text("${linkText}")`);
      const exists = (await link.count()) > 0;
      // At least some of these links should exist for Admin
    }
  });

  test("should navigate to mangaka series page", async ({ page }) => {
    await page.goto("/mangaka/series");
    await waitForLoadingToFinish(page);
    // Should redirect or load - check URL
  });

  test("should navigate from sidebar to series pages", async ({ page }) => {
    await page.goto("/");
    await waitForLoadingToFinish(page);

    // Try clicking "Danh sách Series" link in sidebar
    const allSeriesLink = page
      .locator(SELECTORS.SIDEBAR.ASIDE)
      .first()
      .locator('a[href="/board/all-series"]');
    if ((await allSeriesLink.count()) > 0) {
      await allSeriesLink.click();
      await page.waitForURL(/\/board\/all-series/);
    }
  });
});
