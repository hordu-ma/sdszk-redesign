import { chromium } from "@playwright/test";

/**
 * 轻量级健康检查 - 验证开发服务器是否可用
 *
 * 此脚本在测试开始前运行，确保：
 * 1. 前端服务 (localhost:5173) 可访问
 * 2. 后端API服务 (localhost:3000) 可访问
 *
 * 如果服务不可用，会提供清晰的错误信息和解决方案
 */
async function healthCheck() {
  console.log("🔍 执行服务健康检查...");

  const frontendUrl = "http://localhost:5173";
  const backendUrl = "http://localhost:3000";

  try {
    // 检查前端服务
    await checkService(frontendUrl, "前端服务");

    // 检查后端API服务
    await checkService(backendUrl, "后端API服务");

    console.log("✅ 所有服务健康检查通过，开始运行测试");
  } catch (error) {
    console.error("\n❌ 服务健康检查失败!");
    console.error("\n🔧 解决方案：");
    console.error("1. 启动开发环境：bash scripts/development/dev-start.sh");
    console.error("2. 等待服务启动完成（约10-30秒）");
    console.error("3. 重新运行测试：npm run test:e2e:basic");
    console.error(
      "4. 测试完成后停止服务：bash scripts/development/dev-stop.sh\n",
    );

    throw error;
  }
}

/**
 * 检查单个服务的可用性
 */
async function checkService(url: string, serviceName: string): Promise<void> {
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const response = await page.request.get(url, {
      timeout: 5000,
      ignoreHTTPSErrors: true,
    });

    await browser.close();

    if (response.status() >= 200 && response.status() < 400) {
      console.log(`✅ ${serviceName} (${url}) - 状态码: ${response.status()}`);
    } else {
      throw new Error(`${serviceName} 返回错误状态码: ${response.status()}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`${serviceName} (${url}) 不可访问: ${errorMessage}`);
  }
}

export default healthCheck;
