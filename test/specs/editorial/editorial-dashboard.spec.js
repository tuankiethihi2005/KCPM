const { test, expect } = require("@playwright/test");
const { TEST_CONFIG, SELECTORS } = require("../../helpers/test-data-editorial");
const { loginViaUI, waitForLoadingToFinish } = require("../../helpers/auth-helper");

test.describe("Editorial Board Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, {
      email: TEST_CONFIG.EDITORIAL.email,
      password: TEST_CONFIG.EDITORIAL.password,
    });
    await waitForLoadingToFinish(page);
  });

  test("should display board dashboard with correct title", async ({ page }) => {
    const title = page.locator("h1").first();
    await expect(title).toBeVisible({ timeout: 10000 });
    await expect(title).toContainText("Biên Tập");
  });

  test("should show pending series widget", async ({ page }) => {
    await expect(page.locator("h2:has-text('Series Chờ Xét Duyệt')")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show at-risk series widget", async ({ page }) => {
    await expect(page.locator("h2:has-text('Cảnh Báo Báo Động')")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show leaderboard widget", async ({ page }) => {
    await expect(page.locator("h2:has-text('Top Xếp Hạng Hiện Tại')")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show sidebar with editorial-specific menu items", async ({
    page,
  }) => {
    const sidebar = page.locator(SELECTORS.SIDEBAR.ASIDE).first();
    await expect(sidebar).toBeVisible();

    await expect(sidebar.locator('a[href="/board/all-series"]').first()).toBeVisible();
    await expect(sidebar.locator('a[href="/board/reviews"]').first()).toBeVisible();
    await expect(sidebar.locator('a[href="/board/at-risk"]').first()).toBeVisible();
    await expect(sidebar.locator('a[href="/board/releases"]').first()).toBeVisible();
    await expect(sidebar.locator('a[href="/board/ranking"]').first()).toBeVisible();
  });

  test("should display role badge as Editorial Board", async ({ page }) => {
    const sidebar = page.locator(SELECTORS.SIDEBAR.ASIDE).first();
    await expect(sidebar.getByText("Editorial", { exact: false })).toBeVisible();
  });

  test("should navigate via sidebar to all-series", async ({ page }) => {
    await page
      .locator(SELECTORS.SIDEBAR.ASIDE).first()
      .locator('a[href="/board/all-series"]').click();
    await page.waitForURL("/board/all-series");
  });

  test("should navigate via sidebar to reviews", async ({ page }) => {
    await page
      .locator(SELECTORS.SIDEBAR.ASIDE).first()
      .locator('a[href="/board/reviews"]').click();
    await page.waitForURL("/board/reviews");
  });

  test("should navigate via sidebar to at-risk", async ({ page }) => {
    await page
      .locator(SELECTORS.SIDEBAR.ASIDE).first()
      .locator('a[href="/board/at-risk"]').click();
    await page.waitForURL("/board/at-risk");
  });
});
