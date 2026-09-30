const { test, expect } = require("@playwright/test");
const { TEST_CONFIG, SELECTORS } = require("../../helpers/test-data-mangaka");
const { loginViaUI, waitForLoadingToFinish } = require("../../helpers/auth-helper");

test.describe("Mangaka Series Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, {
      email: TEST_CONFIG.MANGAKA.email,
      password: TEST_CONFIG.MANGAKA.password,
    });
  });

  test("should display series list page with title", async ({ page }) => {
    await page.goto("/mangaka/series");
    await waitForLoadingToFinish(page);

    // Page should have title about series
    await expect(page.locator("h1:has-text('Series')").first()).toBeVisible({
      timeout: 10000,
    });

    // Should have "Tạo series mới" button
    const createBtn = page.locator('a[href="/mangaka/series/new"]').first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
  });

  test("should show series list or empty state", async ({ page }) => {
    await page.goto("/mangaka/series");
    await waitForLoadingToFinish(page);
    await page.waitForTimeout(2000);

    // Either show series cards or empty state
    const hasSeriesCards = (await page.locator("a[href*='/mangaka/series/']").count()) > 0;
    const hasEmptyState =
      (await page.locator("text=Chưa có series").count()) > 0;

    expect(hasSeriesCards || hasEmptyState).toBeTruthy();
  });

  test("should navigate to create series form", async ({ page }) => {
    await page.goto("/mangaka/series");
    await waitForLoadingToFinish(page);

    const createBtn = page.locator('a[href="/mangaka/series/new"]').first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();
    await page.waitForURL("/mangaka/series/new");

    // Should show form with title input
    await expect(page.locator("h1:has-text('Tạo series')")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should have create series form with required fields", async ({
    page,
  }) => {
    await page.goto("/mangaka/series/new");
    await waitForLoadingToFinish(page);

    // Form should have input fields (title field with Tiêu đề label)
    const titleField = page.locator('input').first();
    await expect(titleField).toBeVisible({ timeout: 5000 });

    // Should have submit button
    const submitBtn = page.locator('button:has-text("Tạo series")');
    await expect(submitBtn).toBeVisible();

    // Should have back button
    const backBtn = page.locator('a:has-text("Quay lại")');
    await expect(backBtn).toBeVisible();
  });

  test("should create a new series via API then verify in list", async ({
    page,
  }) => {
    // Use API to create series directly for speed
    const loginRes = await page.request.post(
      `${TEST_CONFIG.API_URL}/auth/login`,
      {
        data: {
          email: TEST_CONFIG.MANGAKA.email,
          password: TEST_CONFIG.MANGAKA.password,
        },
      }
    );
    const { accessToken } = await loginRes.json();

    const seriesTitle = `E2E Test Series ${Date.now()}`;
    const createRes = await page.request.post(
      `${TEST_CONFIG.API_URL}/series`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        data: {
          title: seriesTitle,
          description: "Created by Playwright E2E test",
          genre: "Action",
          target_audience: "Teen",
        },
      }
    );
    expect(createRes.status()).toBe(201);

    // Navigate to series list and verify it appears
    await page.goto("/mangaka/series");
    await waitForLoadingToFinish(page);
    await page.waitForTimeout(2000);

    await expect(page.locator(`text=${seriesTitle}`)).toBeVisible({
      timeout: 10000,
    });
  });

  test("should navigate to series detail", async ({ page }) => {
    // First go to list
    await page.goto("/mangaka/series");
    await waitForLoadingToFinish(page);
    await page.waitForTimeout(2000);

    // Click on a series card/link if present
    const seriesLink = page.locator("a[href*='/mangaka/series/']").first();
    if ((await seriesLink.count()) > 0) {
      await seriesLink.click();
      // Should navigate to series detail page
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/mangaka\/series\//);
    }
  });
});
