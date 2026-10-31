/** @type {CodeceptJS.MainConfig} */
export const config = {
  tests: "./codecept_tests/*_test.js",
  output: "./codecept_output",
  helpers: {
    Playwright: {
      browser: "chromium",
      url: "http://localhost:5173/",
      show: false,
    },
  },
  include: {
    I: "./steps_file.js",
  },
  noGlobals: true,
  // ── Plugins ──────────────────────────────────────────────────────────────
  plugins: {
    // Hiển thị mỗi bước đang chạy ngay trong terminal
    stepByStepReport: {
      enabled: false, // bật thành true nếu muốn xem từng bước chi tiết
    },
  },
  // ── Mocha reporter tuỳ chỉnh ─────────────────────────────────────────────
  // "spec" reporter sẽ in ra đầy đủ: tên test, error message, expected vs actual
  mocha: {
    reporterOptions: {
      // In kết quả ngay trong terminal với format dễ đọc
      reportDir: "./codecept_output",
    },
  },
  name: "KCPM",
};
