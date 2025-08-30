import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/global-setup.ts",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 3 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Timeout for each test */
  timeout: process.env.CI ? 60 * 1000 : 30 * 1000,
  /* Timeout for expect() assertions */
  expect: {
    timeout: process.env.CI ? 10000 : 5000,
  },
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [["github"], ["html"]] : "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* 基础URL配置，用于page.goto()和测试请求 */
    baseURL: "http://localhost:5173",

    /* 等待策略 - CI环境更宽松的超时 */
    actionTimeout: process.env.CI ? 15 * 1000 : 10 * 1000,
    navigationTimeout: process.env.CI ? 60 * 1000 : 30 * 1000,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    /* CI环境额外配置 */
    ...(process.env.CI && {
      launchOptions: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    }),
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    // Firefox 在 CI 环境中暂时禁用，仅在本地运行
    ...(process.env.CI ? [] : [{
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        // Firefox 特定配置
        actionTimeout: 20 * 1000,
        navigationTimeout: 60 * 1000,
        launchOptions: {
          args: [
            '--width=1280',
            '--height=720'
          ]
        }
      },
    }]),

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer configuration removed - services are started manually in CI
});
