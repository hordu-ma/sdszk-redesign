import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 测试配置
 *
 * 注意：此配置期望开发服务器已通过 dev-start.sh 脚本手动启动
 * 请在运行测试前确保：
 * 1. 前端服务运行在 http://localhost:5173
 * 2. 后端API服务运行在 http://localhost:3000
 *
 * 使用方法：
 * - 启动服务：bash scripts/development/dev-start.sh
 * - 运行测试：npm run test:e2e:basic
 * - 停止服务：bash scripts/development/dev-stop.sh
 */
export default defineConfig({
  testDir: "./tests/e2e",

  /* 测试执行配置 */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  /* 超时配置 */
  timeout: 30 * 1000, // 30秒测试超时
  expect: {
    timeout: 10 * 1000, // 10秒断言超时
  },

  /* 报告器配置 */
  reporter: process.env.CI ? [["github"], ["html"]] : [["list"], ["html"]],

  /* 测试输出目录 */
  outputDir: "test-results/",

  /* 全局测试配置 */
  use: {
    /* 基础URL - 指向本地开发服务器 */
    baseURL: "http://localhost:5173",

    /* 超时配置 */
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,

    /* 测试追踪和调试 */
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    /* 浏览器配置 */
    ignoreHTTPSErrors: true,

    /* CI环境优化 */
    ...(process.env.CI && {
      launchOptions: {
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
        ],
      },
    }),
  },

  /* 浏览器项目配置 */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },

    /* 移动端测试（可选启用） */
    // {
    //   name: "Mobile Chrome",
    //   use: {
    //     ...devices["Pixel 5"],
    //   },
    // },

    /* 其他浏览器（可选启用） */
    // {
    //   name: "firefox",
    //   use: {
    //     ...devices["Desktop Firefox"],
    //   },
    // },
    // {
    //   name: "webkit",
    //   use: {
    //     ...devices["Desktop Safari"],
    //   },
    // },
  ],

  /* 服务健康检查 - 在测试开始前验证服务可用性 */
  globalSetup: "./tests/health-check.ts",
});
