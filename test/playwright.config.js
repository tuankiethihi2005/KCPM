const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./specs",
  timeout: 45000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
  ],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "admin",
      testDir: "./specs/admin",
    },
    {
      name: "mangaka",
      testDir: "./specs/mangaka",
    },
    {
      name: "assistant",
      testDir: "./specs/assistant",
    },
    {
      name: "editorial",
      testDir: "./specs/editorial",
    },
  ],
});
