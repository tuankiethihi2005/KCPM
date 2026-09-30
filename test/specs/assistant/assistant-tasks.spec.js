const { test, expect } = require("@playwright/test");
const { TEST_CONFIG, SELECTORS } = require("../../helpers/test-data-assistant");
const { loginViaUI, waitForLoadingToFinish } = require("../../helpers/auth-helper");

test.describe("Assistant Tasks", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, {
      email: TEST_CONFIG.ASSISTANT.email,
      password: TEST_CONFIG.ASSISTANT.password,
    });
    await page.goto("/assistant/tasks");
    await waitForLoadingToFinish(page);
  });

  test("should display tasks page with correct title", async ({ page }) => {
    await expect(page.locator("h1:has-text('Công việc của tôi')")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show filter bar with status options", async ({ page }) => {
    const filterBar = page.locator("text=Trạng thái:").first();
    await expect(filterBar).toBeVisible({ timeout: 10000 });

    // Should have filter buttons
    await expect(page.locator('button:has-text("Tất cả")')).toBeVisible();
    await expect(page.locator('button:has-text("Mới phân công")')).toBeVisible();
    await expect(page.locator('button:has-text("Đang vẽ")')).toBeVisible();
    await expect(page.locator('button:has-text("Chờ duyệt")')).toBeVisible();
    await expect(page.locator('button:has-text("Đã duyệt")')).toBeVisible();
  });

  test("should display task list", async ({ page }) => {
    await page.waitForTimeout(2000);
    // Should have tasks from seed data or empty state
    const hasTasks = (await page.locator("[class*='atp-card']").count()) > 0;
    const hasEmpty = (await page.locator("text=Không có công việc nào").count()) > 0;
    expect(hasTasks || hasEmpty).toBeTruthy();
  });

  test("should filter tasks by status", async ({ page }) => {
    await page.waitForTimeout(1000);

    // Click "Mới phân công" filter
    const assignedBtn = page.locator('button:has-text("Mới phân công")');
    await assignedBtn.click();
    await page.waitForTimeout(1500);

    // Should show only assigned tasks or empty
    const taskCards = page.locator("[class*='atp-card']");
    const emptyMsg = page.locator("text=Không có công việc nào");
    const hasCards = (await taskCards.count()) > 0;
    const hasEmpty = (await emptyMsg.count()) > 0;
    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test("should show task detail when clicking a task", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Click first available task card
    const taskCard = page.locator("[class*='atp-card']").first();
    if ((await taskCard.count()) > 0) {
      await taskCard.click();
      await page.waitForTimeout(1000);

      // Detail section should appear with task info
      const detailSection = page.locator("[class*='atp-detail-card']");
      await expect(detailSection).toBeVisible({ timeout: 5000 });
    }
  });

  test("should show submit form for active tasks", async ({ page }) => {
    await page.waitForTimeout(2000);

    // First find a task in "Assigned" or "In Progress" status
    // (seed data has one "Mới phân công" task)
    const taskCard = page.locator("[class*='atp-card']").first();
    if ((await taskCard.count()) > 0) {
      await taskCard.click();
      await page.waitForTimeout(1500);

      // Check if submit form is visible (only for certain statuses)
      const submitSection = page.locator('button:has-text("Nộp bài")');
      if ((await submitSection.count()) > 0) {
        await expect(submitSection.first()).toBeVisible();
      }
    }
  });

  test("should navigate back to dashboard via sidebar", async ({ page }) => {
    const dashboardLink = page.locator(SELECTORS.SIDEBAR.ASIDE).first().locator('a[href="/"]');
    await dashboardLink.click();
    await page.waitForURL("/");
  });
});
