const { expect } = require("@playwright/test");
const { TEST_CONFIG, SELECTORS } = require("./test-data");

/**
 * Login via UI (fill form and submit).
 */
async function loginViaUI(page, { email, password } = TEST_CONFIG.ADMIN) {
  await page.goto("/login");
  await page.waitForSelector(SELECTORS.LOGIN.EMAIL_INPUT, { state: "visible" });

  await page.fill(SELECTORS.LOGIN.EMAIL_INPUT, email);
  await page.fill(SELECTORS.LOGIN.PASSWORD_INPUT, password);

  await page.click(SELECTORS.LOGIN.SUBMIT_BTN);

  // Wait for navigation to dashboard (URL should be /)
  await page.waitForURL("/", { timeout: 20000 });
}

/**
 * Wait for loading to finish.
 * Handles multiple loading patterns:
 * - Loading text ("Đang tải")
 * - Skeleton animation (animate-pulse)
 * - General network idle
 */
async function waitForLoadingToFinish(page) {
  try {
    // Wait for "Đang tải" text to appear then disappear
    await page.waitForSelector("text=Đang tải", {
      state: "attached",
      timeout: 3000,
    });
    await page.waitForSelector("text=Đang tải", {
      state: "detached",
      timeout: 15000,
    });
    return;
  } catch {
    // No loading text found, try skeleton animation
  }

  try {
    // Wait for animate-pulse skeleton to appear then disappear
    await page.waitForSelector(".animate-pulse", {
      state: "attached",
      timeout: 3000,
    });
    await page.waitForSelector(".animate-pulse", {
      state: "detached",
      timeout: 15000,
    });
    return;
  } catch {
    // No skeleton loading found, continue
  }

  // Fallback: just wait a bit for the page to be ready
  await page.waitForTimeout(500);
}

/**
 * Logout via sidebar button.
 */
async function logout(page) {
  try {
    // Click logout button in sidebar footer
    const logoutBtn = page.locator(SELECTORS.SIDEBAR.LOGOUT_BTN);
    if ((await logoutBtn.count()) > 0) {
      await logoutBtn.click();
      await page.waitForURL("/login", { timeout: 10000 });
    }
  } catch {
    await page.goto("/login");
  }
}

module.exports = { loginViaUI, waitForLoadingToFinish, logout };
