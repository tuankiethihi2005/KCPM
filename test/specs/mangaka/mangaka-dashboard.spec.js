const { test, expect } = require("@playwright/test");
const { TEST_CONFIG, SELECTORS } = require("../../helpers/test-data-mangaka");
const { loginViaUI, waitForLoadingToFinish } = require("../../helpers/auth-helper");

test.describe("Mangaka Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, {
      email: TEST_CONFIG.MANGAKA.email,
      password: TEST_CONFIG.MANGAKA.password,
    });
    await waitForLoadingToFinish(page);
  });

  test("should display mangaka dashboard with correct title", async ({
    page,
  }) => {
    const title = page.locator(SELECTORS.DASHBOARD.TITLE).first();
    await expect(title).toBeVisible({ timeout: 10000 });
    const titleText = await title.textContent();
    expect(titleText.length).toBeGreaterThan(0);
  });

  test("should have quick links to series management", async ({ page }) => {
    // Mangaka dashboard should have "Series của tôi" section
    const seriesSection = page.locator("text=Series của tôi").first();
    await expect(seriesSection).toBeVisible({ timeout: 10000 });

    // Should have link to view series
    const viewSeriesLink = page.locator('a[href="/mangaka/series"]').first();
    await expect(viewSeriesLink).toBeVisible();
    await viewSeriesLink.click();
    await page.waitForURL("/mangaka/series");
  });

  test("should have link to create new series", async ({ page }) => {
    const createSeriesLink = page
      .locator('a[href="/mangaka/series/new"]')
      .first();
    await expect(createSeriesLink).toBeVisible({ timeout: 10000 });
    await createSeriesLink.click();
    await page.waitForURL("/mangaka/series/new");
  });

  test("should have ranking widget", async ({ page }) => {
    const rankingSection = page.locator("text=Ranking").first();
    await expect(rankingSection).toBeVisible({ timeout: 10000 });
  });

  test("should show sidebar with mangaka menu items", async ({ page }) => {
    const sidebar = page.locator(SELECTORS.SIDEBAR.ASIDE).first();
    await expect(sidebar).toBeVisible();

    // Check mangaka-specific sidebar links
    const seriesLink = sidebar.locator('a[href="/mangaka/series"]');
    await expect(seriesLink).toBeVisible();

    const chaptersLink = sidebar.locator('a[href="/chapter-list"]');
    await expect(chaptersLink).toBeVisible();

    const tasksLink = sidebar.locator('a[href="/mangaka/tasks"]');
    await expect(tasksLink).toBeVisible();

    const rankingLink = sidebar.locator('a[href="/mangaka/ranking"]');
    await expect(rankingLink).toBeVisible();
  });

  test("should display mangaka role badge in sidebar", async ({ page }) => {
    const sidebar = page.locator(SELECTORS.SIDEBAR.ASIDE).first();
    await expect(sidebar.getByText("Mangaka", { exact: true })).toBeVisible();
  });
});
