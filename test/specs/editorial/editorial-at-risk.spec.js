const { test, expect } = require("@playwright/test");
const { TEST_CONFIG, SELECTORS } = require("../../helpers/test-data-editorial");
const { loginViaUI, waitForLoadingToFinish } = require("../../helpers/auth-helper");

test.describe("Editorial Board At-Risk Series", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, {
      email: TEST_CONFIG.EDITORIAL.email,
      password: TEST_CONFIG.EDITORIAL.password,
    });
  });

  test("should display at-risk series page", async ({ page }) => {
    await page.goto("/board/at-risk");
    await waitForLoadingToFinish(page);

    await expect(
      page.locator("h1:has-text('series có nguy cơ')")
    ).toBeVisible({ timeout: 10000 });
  });

  test("should show series cards or empty state", async ({ page }) => {
    await page.goto("/board/at-risk");
    await waitForLoadingToFinish(page);
    await page.waitForTimeout(2000);

    // Either show cards with titles
    const hasCards = (await page.locator("h2.card-title").count()) > 0;
    const hasEmpty = (await page.locator("text=Không có series").count()) > 0;
    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test("should have status management controls when series exist", async ({
    page,
  }) => {
    await page.goto("/board/at-risk");
    await waitForLoadingToFinish(page);
    await page.waitForTimeout(2000);

    const cardTitle = page.locator("h2.card-title").first();
    if ((await cardTitle.count()) > 0) {
      // Series cards should have select dropdowns and buttons
      const selects = page.locator("select.neo-select");
      const selectCount = await selects.count();
      expect(selectCount).toBeGreaterThanOrEqual(1);

      // Should have update button
      await expect(page.locator('button:has-text("Cập nhật")').first()).toBeVisible();
    }
  });

  test("should have dossier toggle button when series exist", async ({
    page,
  }) => {
    await page.goto("/board/at-risk");
    await waitForLoadingToFinish(page);
    await page.waitForTimeout(2000);

    const dossierBtn = page.locator('button:has-text("Hồ sơ quyết định")');
    if ((await dossierBtn.count()) > 0) {
      await expect(dossierBtn.first()).toBeVisible();

      // Click to expand dossier
      await dossierBtn.first().click();
      await page.waitForTimeout(1000);

      // Should show vote form with select
      await expect(page.locator('button:has-text("Bỏ phiếu")').first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("should navigate from sidebar to at-risk", async ({ page }) => {
    await page.goto("/");
    await waitForLoadingToFinish(page);

    await page
      .locator(SELECTORS.SIDEBAR.ASIDE).first()
      .locator('a[href="/board/at-risk"]').click();
    await page.waitForURL("/board/at-risk");
  });

  test("should navigate to notifications from sidebar", async ({ page }) => {
    await page.goto("/");
    await waitForLoadingToFinish(page);

    await page
      .locator(SELECTORS.SIDEBAR.ASIDE).first()
      .locator('a[href="/notifications"]').click();
    await page.waitForURL("/notifications");
  });
});
