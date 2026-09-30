const { test, expect } = require("@playwright/test");
const { TEST_CONFIG, SELECTORS } = require("../../helpers/test-data-editorial");
const { loginViaUI, waitForLoadingToFinish } = require("../../helpers/auth-helper");

test.describe("Editorial Board Reviews", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, {
      email: TEST_CONFIG.EDITORIAL.email,
      password: TEST_CONFIG.EDITORIAL.password,
    });
  });

  test("should display pending series page", async ({ page }) => {
    await page.goto("/board/reviews");
    await waitForLoadingToFinish(page);

    await expect(page.locator("h1:has-text('Series chờ duyệt')")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show empty or pending series list", async ({ page }) => {
    await page.goto("/board/reviews");
    await waitForLoadingToFinish(page);
    await page.waitForTimeout(2000);

    // Either show pending cards or empty state
    const hasCards = (await page.locator("a[href*='/board/series/']").count()) > 0;
    const hasEmpty = (await page.locator("text=Không có series").count()) > 0;
    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test("should display all-series page", async ({ page }) => {
    await page.goto("/board/all-series");
    await waitForLoadingToFinish(page);

    await expect(page.locator("h1:has-text('Toàn bộ Series')")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should have search and filter on all-series page", async ({
    page,
  }) => {
    await page.goto("/board/all-series");
    await waitForLoadingToFinish(page);
    await page.waitForTimeout(2000);

    // Search input
    const searchInput = page.locator('input[placeholder*="Tìm theo tên"]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Status filter buttons
    await expect(page.locator('button:has-text("Tất cả")')).toBeVisible();
    await expect(page.locator('button:has-text("Active")')).toBeVisible();
  });

  test("should show series cards on all-series page", async ({ page }) => {
    await page.goto("/board/all-series");
    await waitForLoadingToFinish(page);
    await page.waitForTimeout(2000);

    const hasCards = (await page.locator("a[href*='/board/series/']").count()) > 0;
    const hasEmpty = (await page.locator("text=Không có series").count()) > 0;
    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test("should navigate from sidebar to reviews", async ({ page }) => {
    await page.goto("/");
    await waitForLoadingToFinish(page);

    await page
      .locator(SELECTORS.SIDEBAR.ASIDE).first()
      .locator('a[href="/board/reviews"]').click();
    await page.waitForURL("/board/reviews");
  });

  test("should navigate from sidebar to all-series", async ({ page }) => {
    await page.goto("/");
    await waitForLoadingToFinish(page);

    await page
      .locator(SELECTORS.SIDEBAR.ASIDE).first()
      .locator('a[href="/board/all-series"]').click();
    await page.waitForURL("/board/all-series");
  });

  test("should navigate to releases page", async ({ page }) => {
    await page.goto("/board/releases");
    await waitForLoadingToFinish(page);
    await expect(page).toHaveURL(/\/board\/releases/);
  });

  test("should navigate to ranking page", async ({ page }) => {
    await page.goto("/board/ranking");
    await waitForLoadingToFinish(page);
    await expect(page).toHaveURL(/\/board\/ranking/);
  });
});
