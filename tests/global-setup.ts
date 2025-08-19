import { chromium, FullConfig } from '@playwright/test';

/**
 * Playwright 全局配置
 * 在所有测试运行前执行的设置
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 启动 Playwright 全局配置...');

  // 等待开发服务器启动
  await waitForServer('http://localhost:5173', 30000);

  console.log('✅ 全局配置完成');
}

/**
 * 等待服务器启动
 */
async function waitForServer(url: string, timeout: number = 30000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const browser = await chromium.launch();
      const page = await browser.newPage();

      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 5000
      });

      await browser.close();

      if (response && response.status() < 400) {
        console.log(`✅ 服务器 ${url} 已就绪`);
        return;
      }
    } catch (error) {
      // 服务器还未就绪，继续等待
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error(`❌ 服务器 ${url} 在 ${timeout}ms 内未能启动`);
}

export default globalSetup;
