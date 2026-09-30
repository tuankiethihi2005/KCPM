// ===== Test Configuration for Editorial Board =====
const TEST_CONFIG = {
  BASE_URL: "http://localhost:5173",
  API_URL: "http://localhost:5000/api",

  EDITORIAL: {
    email: "editorial@example.com",
    password: "password123",
    name: "Trần Biên Tập",
    role: "Editorial Board",
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
    ALL_SERIES_LINK: 'a[href="/board/all-series"]',
    REVIEWS_LINK: 'a[href="/board/reviews"]',
    AT_RISK_LINK: 'a[href="/board/at-risk"]',
    RELEASES_LINK: 'a[href="/board/releases"]',
    RANKING_LINK: 'a[href="/board/ranking"]',
  },
  COMMON: {
    LOADING_TEXT: "text=Đang tải",
    ANIMATE_PULSE: ".animate-pulse",
  },
};

module.exports = { TEST_CONFIG, SELECTORS };
