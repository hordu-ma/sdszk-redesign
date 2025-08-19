import { test, expect } from '@playwright/test';

test.describe('基本页面测试', () => {
  test('首页应该正常加载', async ({ page }) => {
    await page.goto('/');

    // 等待页面加载完成
    await page.waitForLoadState('networkidle');

    // 检查页面标题
    await expect(page).toHaveTitle(/思政课一体化教育平台/);

    // 检查页面是否包含主要内容
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('应用基本结构存在', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 检查Vue应用是否挂载
    const app = await page.locator('#app');
    await expect(app).toBeVisible();
  });

  test('页面响应式设计正常', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 测试桌面端
    await page.setViewportSize({ width: 1200, height: 800 });
    const app = await page.locator('#app');
    await expect(app).toBeVisible();

    // 测试移动端
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(app).toBeVisible();
  });
});

test.describe('导航测试', () => {
  test('路由导航正常工作', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 检查当前URL
    expect(page.url()).toContain('/');

    // 如果有导航链接，可以测试导航
    const navigation = await page.locator('nav, .navigation, .navbar').first();
    if (await navigation.isVisible()) {
      // 导航存在时的测试逻辑
      await expect(navigation).toBeVisible();
    }
  });
});

test.describe('错误处理测试', () => {
  test('404页面处理', async ({ page }) => {
    // 访问不存在的页面
    const response = await page.goto('/non-existent-page');

    // 检查是否正确处理404
    // 注意：这取决于应用的路由配置
    await page.waitForLoadState('networkidle');

    // 应用应该仍然加载，显示404页面或重定向到首页
    const app = await page.locator('#app');
    await expect(app).toBeVisible();
  });
});

test.describe('性能基准测试', () => {
  test('页面加载性能', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // 页面应该在5秒内加载完成
    expect(loadTime).toBeLessThan(5000);

    console.log(`页面加载时间: ${loadTime}ms`);
  });
});
