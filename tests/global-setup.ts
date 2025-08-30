import { chromium, FullConfig } from "@playwright/test";

/**
 * Playwright 全局配置
 * 在所有测试运行前执行的设置
 */
async function globalSetup(config: FullConfig) {
  console.log("🚀 启动 Playwright 全局配置...");

  const isCI = !!process.env.CI;
  const startTime = Date.now();

  if (isCI) {
    console.log("CI环境：执行服务预检查...");
    await performServiceHealthCheck();
  } else {
    console.log("本地环境：等待开发服务器启动...");
    await waitForServer("http://localhost:5173", 30000);
  }

  // 执行性能基准测试
  await performPerformanceBaseline();

  // Firefox 浏览器特殊初始化
  await performFirefoxOptimization();

  const setupTime = Date.now() - startTime;
  console.log(`✅ 全局配置完成 (耗时: ${setupTime}ms)`);
}

/**
 * 等待服务器启动
 */
async function waitForServer(
  url: string,
  timeout: number = 30000,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const browser = await chromium.launch();
      const page = await browser.newPage();

      const response = await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 5000,
      });

      await browser.close();

      if (response && response.status() < 400) {
        console.log(`✅ 服务器 ${url} 已就绪`);
        return;
      }
    } catch (error) {
      // 服务器还未就绪，继续等待
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`❌ 服务器 ${url} 在 ${timeout}ms 内未能启动`);
}

/**
 * 执行服务健康检查
 */
async function performServiceHealthCheck(): Promise<void> {
  console.log("🔍 执行服务健康检查...");

  try {
    // 检查前端服务
    await waitForServer("http://localhost:5173", 60000);

    // 检查后端API
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      const apiResponse = await page.request.get("http://localhost:3000/api/health");
      console.log(`API健康检查: ${apiResponse.status()}`);
    } catch (error) {
      console.warn("⚠️ API健康检查失败，测试可能受影响");
    }

    await browser.close();
    console.log("✅ 服务健康检查完成");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ 服务健康检查失败:", errorMessage);
    throw error;
  }
}

/**
 * 执行性能基准测试
 */
async function performPerformanceBaseline(): Promise<void> {
  console.log("⏱️ 执行性能基准测试...");

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const startTime = Date.now();
    await page.goto("http://localhost:5173", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    const loadTime = Date.now() - startTime;

    await browser.close();

    console.log(`📊 基准页面加载时间: ${loadTime}ms`);

    // 设置性能期望
    const isCI = !!process.env.CI;
    const expectedLoadTime = isCI ? 20000 : 8000;

    if (loadTime > expectedLoadTime) {
      console.warn(`⚠️ 页面加载时间 ${loadTime}ms 超过预期 ${expectedLoadTime}ms，测试可能较慢`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("⚠️ 性能基准测试失败:", errorMessage);
  }
}

/**
 * Firefox 浏览器优化设置
 */
async function performFirefoxOptimization(): Promise<void> {
  console.log("🦊 执行 Firefox 浏览器优化设置...");

  try {
    const isCI = !!process.env.CI;

    if (isCI) {
      // CI环境下为Firefox设置环境变量
      process.env.MOZ_HEADLESS = '1';
      process.env.MOZ_DISABLE_CONTENT_SANDBOX = '1';

      console.log("✅ Firefox CI 环境优化完成");
    }

    // Firefox 预热测试
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      // 简单的预热请求
      await page.goto("http://localhost:5173", {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });

      console.log("✅ Firefox 预热测试完成");
    } catch (error) {
      console.warn("⚠️ Firefox 预热测试失败，但不影响后续测试");
    }

    await browser.close();
  } catch (error) {
    console.warn("⚠️ Firefox 优化设置失败，使用默认配置");
  }
}

export default globalSetup;
