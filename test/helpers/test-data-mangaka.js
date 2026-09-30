// ===== Test Configuration for Mangaka =====
const TEST_CONFIG = {
  BASE_URL: "http://localhost:5173",
  API_URL: "http://localhost:5000/api",

  // Mangaka credentials (created by seedMangakaUser.js)
  MANGAKA: {
    email: "mangaka@example.com",
    password: "password123",
    name: "Mangaka Artist",
    role: "Mangaka",
  },

  // Admin credentials (for creating test data via API)
  ADMIN: {
    email: "admin@example.com",
    password: "password123",
  },
};

// ===== Selectors (reuse from common patterns) =====
const SELECTORS = {
  LOGIN: {
    EMAIL_INPUT: "#email",
    PASSWORD_INPUT: "#password",
    SUBMIT_BTN: 'button[type="submit"]',
  },

  SIDEBAR: {
    ASIDE: "aside",
    DASHBOARD_LINK: 'a[href="/"]',
    NOTIFICATIONS_LINK: 'a[href="/notifications"]',
  },

  DASHBOARD: {
    TITLE: "h1",
  },

  COMMON: {
    LOADING_TEXT: "text=Đang tải",
    ANIMATE_PULSE: ".animate-pulse",
  },
};

module.exports = { TEST_CONFIG, SELECTORS };
