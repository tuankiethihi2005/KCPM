/** @type {CodeceptJS.MainConfig} */
export const config = {
  tests: "./codecept_tests/*_test.js",
  output: "./codecept_output",
  helpers: {
    Playwright: {
      browser: "chromium",
      url: "http://localhost:5173/",
      show: true,
    },
  },
  include: {
    I: "./steps_file.js",
  },
  noGlobals: true,
  plugins: {},
  name: "KCPM",
};
