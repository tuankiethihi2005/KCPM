const { test, expect } = require("@playwright/test");
const { TEST_CONFIG, SELECTORS } = require("../../helpers/test-data-assistant");
const { loginViaUI, waitForLoadingToFinish } = require("../../helpers/auth-helper");

test.describe("Assistant Income", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, {
      email: TEST_CONFIG.ASSISTANT.email,
      password: TEST_CONFIG.ASSISTANT.password,
    });
    await page.goto("/assistant/income");
    await waitForLoadingToFinish(page);
  });

  test("should display income page with correct title", async ({ page }) => {
    await expect(page.locator("h1:has-text('Thu nhập hàng tháng')")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show stat cards with income metrics", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Stat cards should be present
    await expect(page.locator("text=Tổng thu nhập tháng này")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Đã thanh toán")).toBeVisible();
    await expect(page.locator("text=Đang chờ thanh toán")).toBeVisible();
    await expect(page.locator("text=Số Task Hoàn Thành")).toBeVisible();
  });

  test("should show income detail table", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Table headers should be visible
    await expect(page.locator("th:has-text('Tháng')")).toBeVisible();
    await expect(page.locator("th:has-text('Đơn giá')")).toBeVisible();
    await expect(page.locator("th:has-text('Trạng thái')")).toBeVisible();

    // Should have data or empty state
    const hasRows = (await page.locator("table tbody tr").count()) > 0;
    const hasEmpty = (await page.locator("text=Không tìm thấy dữ liệu").count()) > 0;
    expect(hasRows || hasEmpty).toBeTruthy();
  });

  test("should have month filter select", async ({ page }) => {
    const filterSelect = page.locator("select#monthFilter");
    await expect(filterSelect).toBeVisible({ timeout: 5000 });

    // Verify default option exists (options are hidden elements, check text content)
    await expect(filterSelect).toContainText("Tất cả các tháng");
  });

  test("should have refresh button", async ({ page }) => {
    const refreshBtn = page.locator('button:has-text("Tải lại dữ liệu")');
    await expect(refreshBtn).toBeVisible();
  });

  test("should navigate to tasks page from sidebar", async ({ page }) => {
    await page.locator(SELECTORS.SIDEBAR.ASIDE).first().locator('a[href="/assistant/tasks"]').click();
    await page.waitForURL("/assistant/tasks");
  });
});
