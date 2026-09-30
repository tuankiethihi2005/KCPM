const { test, expect } = require("@playwright/test");
const { TEST_CONFIG, SELECTORS } = require("../../helpers/test-data-mangaka");
const { loginViaUI, waitForLoadingToFinish } = require("../../helpers/auth-helper");

test.describe("Mangaka Chapters & Pages", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, {
      email: TEST_CONFIG.MANGAKA.email,
      password: TEST_CONFIG.MANGAKA.password,
    });
  });

  test("should navigate to chapter list page", async ({ page }) => {
    await page.goto("/chapter-list");
    await waitForLoadingToFinish(page);
    await page.waitForTimeout(2000);

    // Check URL - might redirect to /chapter-list/:seriesId
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/chapter-list/);
  });

  test("should navigate to ranking page", async ({ page }) => {
    await page.goto("/mangaka/ranking");
    await waitForLoadingToFinish(page);

    // Should navigate to ranking page
    await expect(page).toHaveURL(/\/mangaka\/ranking/);
  });

  test("should navigate from dashboard to chapters", async ({ page }) => {
    // Go to dashboard first
    await page.goto("/");
    await waitForLoadingToFinish(page);

    // Click "Tạo Chapter mới" in sidebar
    const chaptersLink = page
      .locator(SELECTORS.SIDEBAR.ASIDE)
      .first()
      .locator('a[href="/chapter-list"]');
    await expect(chaptersLink).toBeVisible();
    await chaptersLink.click();

    await page.waitForURL(/\/chapter-list/);
  });

  test("should navigate from dashboard to ranking", async ({ page }) => {
    await page.goto("/");
    await waitForLoadingToFinish(page);

    // Click "Ranking Series" in sidebar
    const rankingLink = page
      .locator(SELECTORS.SIDEBAR.ASIDE)
      .first()
      .locator('a[href="/mangaka/ranking"]');
    await expect(rankingLink).toBeVisible();
    await rankingLink.click();

    await page.waitForURL("/mangaka/ranking");
  });
});
