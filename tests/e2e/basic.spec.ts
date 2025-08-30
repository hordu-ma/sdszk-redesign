import { test, expect } from "@playwright/test";

test.describe("基础功能测试", () => {
  test("首页应该正常加载", async ({ page }) => {
    console.log("🧪 测试：访问首页");

    // 访问首页
    await page.goto("/", { timeout: 30000 });

    // 等待页面加载
    await page.waitForLoadState("networkidle", { timeout: 60000 });

    // 检查页面标题
    const title = await page.title();
    console.log(`页面标题: ${title}`);
    expect(title).toBe("首页 - 山东省思想政治理论课一体化平台");

    // 检查主要元素存在
    const app = page.locator("#app");
    await expect(app).toBeVisible({ timeout: 10000 });

    console.log("✅ 首页加载测试通过");
  });

  test("页面基本结构完整", async ({ page }) => {
    console.log("🧪 测试：页面基本结构");

    await page.goto("/", { timeout: 30000 });
    await page.waitForLoadState("domcontentloaded", { timeout: 30000 });

    // 检查Vue应用根元素
    const app = page.locator("#app");
    await expect(app).toBeVisible({ timeout: 10000 });

    // 等待页面完全渲染
    await page.waitForFunction(() => {
      const body = document.body;
      return body && body.textContent && body.textContent.trim().length > 0;
    }, { timeout: 10000 });

    // 检查页面内容不为空
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(0);

    console.log("✅ 页面结构测试通过");
  });

  test("页面响应式设计", async ({ page }) => {
    console.log("🧪 测试：响应式设计");

    await page.goto("/", { timeout: 30000 });
    await page.waitForLoadState("domcontentloaded", { timeout: 30000 });

    // 测试桌面端视口
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);

    const app = page.locator("#app");
    await expect(app).toBeVisible({ timeout: 10000 });

    // 测试移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    await expect(app).toBeVisible({ timeout: 10000 });

    console.log("✅ 响应式设计测试通过");
  });

  test("API健康检查", async ({ page }) => {
    console.log("🧪 测试：API连接");

    // 直接检查API端点
    const response = await page.request.get("http://localhost:3000", {
      timeout: 10000
    });
    expect(response.status()).toBeLessThan(500);
    console.log("✅ API连接测试通过");
  });
});

test.describe("错误处理测试", () => {
  test("404页面处理", async ({ page }) => {
    console.log("🧪 测试：404页面处理");

    // 访问不存在的页面
    await page.goto("/non-existent-page");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    // 应用应该仍然加载（显示404页面或重定向）
    const app = page.locator("#app");
    await expect(app).toBeVisible({ timeout: 10000 });

    console.log("✅ 404页面处理测试通过");
  });
});
