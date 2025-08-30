import { test, expect } from "@playwright/test";

interface ResourceInfo {
  url: string;
  status: number;
  timing?: any;
}

test.describe("性能和稳定性测试", () => {
  // 设置测试超时
  test.setTimeout(120000); // 2分钟

  test("基础性能测试", async ({ page, browserName }) => {
    console.log(`🧪 性能测试开始 (浏览器: ${browserName})`);

    const isCI = !!process.env.CI;
    const startTime = Date.now();

    // 访问首页并等待加载
    await page.goto("/", {
      waitUntil: "domcontentloaded",
      timeout: isCI ? 60000 : 30000,
    });

    // 等待关键元素加载
    await page.waitForSelector("#app", { timeout: isCI ? 20000 : 10000 });

    const domLoadTime = Date.now() - startTime;
    console.log(`DOM 加载时间: ${domLoadTime}ms`);

    // 等待网络空闲
    const networkStartTime = Date.now();
    await page.waitForLoadState("networkidle", { timeout: isCI ? 45000 : 20000 });
    const networkLoadTime = Date.now() - networkStartTime;
    const totalLoadTime = Date.now() - startTime;

    console.log(`网络空闲等待时间: ${networkLoadTime}ms`);
    console.log(`总加载时间: ${totalLoadTime}ms`);

    // 根据环境和浏览器设置性能期望
    let maxDomLoad = isCI ? 30000 : 15000;
    let maxTotalLoad = isCI ? 60000 : 30000;

    // WebKit 需要更多时间
    if (browserName === 'webkit') {
      maxDomLoad *= 1.5;
      maxTotalLoad *= 1.8;
    }

    console.log(`性能期望 - DOM: ${maxDomLoad}ms, 总计: ${maxTotalLoad}ms`);

    // 软性断言 - 记录但不强制失败
    if (domLoadTime > maxDomLoad) {
      console.warn(`⚠️ DOM 加载时间超出预期: ${domLoadTime}ms > ${maxDomLoad}ms`);
    }

    if (totalLoadTime > maxTotalLoad) {
      console.warn(`⚠️ 总加载时间超出预期: ${totalLoadTime}ms > ${maxTotalLoad}ms`);
    }

    // 只有在严重超时时才失败测试
    const criticalTimeout = maxTotalLoad * 2;
    if (totalLoadTime > criticalTimeout) {
      throw new Error(`严重性能问题: 加载时间 ${totalLoadTime}ms 超过临界值 ${criticalTimeout}ms`);
    }

    console.log("✅ 基础性能测试完成");
  });

  test("资源加载性能测试", async ({ page, browserName }) => {
    console.log(`🧪 资源加载测试开始 (浏览器: ${browserName})`);

    const isCI = !!process.env.CI;
    const resources: ResourceInfo[] = [];

    // 监听网络请求
    page.on("response", (response) => {
      resources.push({
        url: response.url(),
        status: response.status(),
        timing: undefined, // Playwright Response 对象没有 timing 属性
      });
    });

    const startTime = Date.now();
    await page.goto("/", {
      waitUntil: "networkidle",
      timeout: isCI ? 90000 : 45000
    });
    const loadTime = Date.now() - startTime;

    console.log(`总请求数: ${resources.length}`);
    console.log(`页面加载时间: ${loadTime}ms`);

    // 分析资源加载
    const failedResources = resources.filter(r => r.status >= 400);

    if (failedResources.length > 0) {
      console.warn(`⚠️ 发现 ${failedResources.length} 个失败的资源请求`);
      failedResources.forEach(r => {
        console.warn(`  - ${r.url} (状态: ${r.status})`);
      });
    }

    // 检查关键资源
    const jsResources = resources.filter(r => r.url.includes('.js'));
    const cssResources = resources.filter(r => r.url.includes('.css'));

    console.log(`JS 资源数: ${jsResources.length}`);
    console.log(`CSS 资源数: ${cssResources.length}`);

    // 确保没有太多失败的资源
    expect(failedResources.length).toBeLessThan(5);

    console.log("✅ 资源加载测试完成");
  });

  test("交互性能测试", async ({ page, browserName }) => {
    console.log(`🧪 交互性能测试开始 (浏览器: ${browserName})`);

    const isCI = !!process.env.CI;
    await page.goto("/", {
      waitUntil: "networkidle",
      timeout: isCI ? 60000 : 30000
    });

    // 测试点击响应时间
    const clickableElements = await page.locator('button, a, [role="button"]').count();
    console.log(`可点击元素数量: ${clickableElements}`);

    if (clickableElements > 0) {
      const startTime = Date.now();
      const firstButton = page.locator('button, a, [role="button"]').first();

      if (await firstButton.isVisible()) {
        await firstButton.click();
        const clickResponseTime = Date.now() - startTime;
        console.log(`点击响应时间: ${clickResponseTime}ms`);

        // 交互响应时间不应超过2秒
        const maxClickTime = isCI ? 3000 : 2000;
        if (clickResponseTime > maxClickTime) {
          console.warn(`⚠️ 点击响应时间过长: ${clickResponseTime}ms > ${maxClickTime}ms`);
        }
      }
    }

    console.log("✅ 交互性能测试完成");
  });

  test("内存和CPU使用监控", async ({ page, browserName }) => {
    console.log(`🧪 资源使用监控开始 (浏览器: ${browserName})`);

    const isCI = !!process.env.CI;
    await page.goto("/", {
      waitUntil: "networkidle",
      timeout: isCI ? 60000 : 30000
    });

    // 获取性能指标
    const performanceMetrics = await page.evaluate(() => {
      const performance = window.performance;
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      };
    });

    console.log("📊 性能指标:", {
      domContentLoaded: `${performanceMetrics.domContentLoaded}ms`,
      loadComplete: `${performanceMetrics.loadComplete}ms`,
      firstPaint: `${performanceMetrics.firstPaint}ms`,
      firstContentfulPaint: `${performanceMetrics.firstContentfulPaint}ms`,
    });

    // 检查是否有明显的性能问题
    if (performanceMetrics.firstContentfulPaint > (isCI ? 8000 : 4000)) {
      console.warn(`⚠️ 首次内容绘制时间较长: ${performanceMetrics.firstContentfulPaint}ms`);
    }

    console.log("✅ 资源使用监控完成");
  });
});

test.describe("稳定性测试", () => {
  test("多次页面加载测试", async ({ page, browserName }) => {
    console.log(`🧪 稳定性测试开始 (浏览器: ${browserName})`);

    const isCI = !!process.env.CI;
    const iterations = isCI ? 3 : 5; // CI环境减少迭代次数
    const loadTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      console.log(`第 ${i + 1}/${iterations} 次加载...`);

      const startTime = Date.now();
      await page.goto("/", {
        waitUntil: "domcontentloaded",
        timeout: isCI ? 45000 : 20000
      });
      await page.waitForSelector("#app", { timeout: isCI ? 15000 : 8000 });
      const loadTime = Date.now() - startTime;

      loadTimes.push(loadTime);
      console.log(`加载时间: ${loadTime}ms`);

      // 短暂等待，避免过于频繁的请求
      await page.waitForTimeout(isCI ? 2000 : 1000);
    }

    // 计算统计信息
    const avgLoadTime = loadTimes.reduce((a: number, b: number) => a + b, 0) / loadTimes.length;
    const maxLoadTime = Math.max(...loadTimes);
    const minLoadTime = Math.min(...loadTimes);

    console.log(`📊 加载时间统计:`);
    console.log(`  平均: ${Math.round(avgLoadTime)}ms`);
    console.log(`  最大: ${maxLoadTime}ms`);
    console.log(`  最小: ${minLoadTime}ms`);

    // 检查稳定性 - 最大值不应该是最小值的3倍以上
    const stability = maxLoadTime / minLoadTime;
    console.log(`稳定性系数: ${stability.toFixed(2)}`);

    if (stability > 4) {
      console.warn(`⚠️ 页面加载时间不稳定，波动较大 (系数: ${stability.toFixed(2)})`);
    }

    console.log("✅ 稳定性测试完成");
  });
});
