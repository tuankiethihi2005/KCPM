// ===== Test Configuration =====
const TEST_CONFIG = {
  BASE_URL: "http://localhost:5173",
  API_URL: "http://localhost:5000/api",

  // Admin credentials (created by seedAuthUser.js)
  ADMIN: {
    email: "admin@example.com",
    password: "password123",
    name: "System Admin",
    role: "Admin",
  },

  // Test user for creation
  TEST_USER: {
    name: "Test User Playwright",
    email: `pw_test_${Date.now()}@test.com`,
    password: "TestPass123!",
    role: "Assistant",
    status: "Active",
  },

  // Updated user info
  UPDATED_USER: {
    name: "Updated Name PW",
    email: `pw_updated_${Date.now()}@test.com`,
    role: "Mangaka",
  },

  NEW_PASSWORD: "NewPass789$",
};

// ===== Selectors based on actual DOM structure =====
const SELECTORS = {
  LOGIN: {
    EMAIL_INPUT: "#email",
    PASSWORD_INPUT: "#password",
    SUBMIT_BTN: 'button[type="submit"]',
  },

  SIDEBAR: {
    // Sidebar is <aside> element
    ASIDE: "aside",
    // Common menu links
    DASHBOARD_LINK: 'a[href="/"]',
    NOTIFICATIONS_LINK: 'a[href="/notifications"]',
    // Admin-specific links
    ADMIN_USERS_LINK: 'a[href="/admin/users"]',
    ADMIN_SERIES_LINK: 'a[href="/admin/series"]',
    ADMIN_RELEASES_LINK: 'a[href="/admin/releases"]',
    ADMIN_RANKING_LINK: 'a[href="/admin/ranking"]',
    // Logout button in sidebar footer
    LOGOUT_BTN: "button:has-text('Đăng xuất')",
    // User info section
    USER_NAME: "text=System Admin",
  },

  DASHBOARD: {
    // The dashboard title (has emoji)
    TITLE: "h1",
    // Stat cards section
    USER_CHART: "text=Phân bố người dùng",
    SERIES_CHART: "text=Phân bố Series",
    AT_RISK_LIST: "text=Series gặp vấn đề",
    QUICK_ACTIONS: "text=Truy cập nhanh",
    RECENT_NOTIFICATIONS: "text=Thông báo gần đây",
    SERIES_PROGRESS_TABLE: "text=Tiến độ Series",
    // Loading skeleton
    SKELETON: ".animate-pulse",
  },

  ADMIN_USERS: {
    PAGE_TITLE: "h1:has-text('Quản lý tài khoản')",
    TAB_LIST: 'button:has-text("Danh sách tài khoản")',
    TAB_CREATE: 'button:has-text("Tạo tài khoản mới")',
    // Filter bar
    FILTER_SEARCH: 'input[placeholder*="tìm kiếm" i]',
    FILTER_ROLE: 'select:below(:text("Tìm kiếm"))',
    FILTER_STATUS: 'select:below(:text("Tất cả role"))',
    // Table
    USER_TABLE: "table",
    TABLE_ROWS: "table tbody tr",
    // Create form (labels use Vietnamese with diacritics)
    CREATE_FORM_CARD: 'h2:has-text("Nhap thong tin nhan vien")',
    CREATE_NAME_INPUT: 'input:below(:text("Họ tên"))',
    CREATE_EMAIL_INPUT: 'input[type="email"]:below(:text("Email"))',
    CREATE_PASSWORD_INPUT: 'input[type="password"]:below(:text("Mật khẩu khởi tạo"))',
    CREATE_ROLE_SELECT: 'select:below(:text("Họ tên"))',
    CREATE_STATUS_SELECT: 'select:below(:text("Trạng thái"))',
    CREATE_SUBMIT_BTN: 'button:has-text("Tạo tài khoản")',
    // Modal
    MODAL_OVERLAY: "div.modal-overlay",
  },

  NOTIFICATIONS: {
    PAGE_TITLE: "h1:has-text('Thông báo')",
    NOTIFICATION_ITEM: "div.cursor-pointer",
    EMPTY_STATE: "text=Chưa có thông báo nào",
  },

  COMMON: {
    LOADING_TEXT: "text=Đang tải",
    PAGINATION: ".pagination",
    ANIMATE_PULSE: ".animate-pulse",
  },
};

module.exports = { TEST_CONFIG, SELECTORS };
