// ===== Test Configuration for Assistant =====
const TEST_CONFIG = {
  BASE_URL: "http://localhost:5173",
  API_URL: "http://localhost:5000/api",

  ASSISTANT: {
    email: "assistant@example.com",
    password: "password123",
    name: "Lê Trợ Lý",
    role: "Assistant",
  },
};

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
    TASKS_LINK: 'a[href="/assistant/tasks"]',
    INCOME_LINK: 'a[href="/assistant/income"]',
  },
  COMMON: {
    LOADING_TEXT: "text=Đang tải",
    ANIMATE_PULSE: ".animate-pulse",
  },
};

module.exports = { TEST_CONFIG, SELECTORS };
