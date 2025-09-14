#!/usr/bin/env node

// ==============================================================================
// 山东省思政课一体化中心 - CMS页面健康检查 (v1.0)
// ==============================================================================

import { chromium } from "playwright";
import fs from "fs";

// --- 配置 ---
const BASE_URL = "http://localhost:5173";
const TIMEOUT = 30000; // 30秒超时
const SCREENSHOT_DIR = "./.cms-reports/screenshots";

// --- CMS页面清单 ---
const CMS_PAGES = [
  // 管理后台首页
  { name: "管理后台首页", url: "/admin", requireAuth: true },

  // 新闻管理模块
  { name: "新闻列表", url: "/admin/news/list", requireAuth: true },
  { name: "新闻分类", url: "/admin/news/categories", requireAuth: true },
  { name: "创建新闻", url: "/admin/news/create", requireAuth: true },

  // 资源管理模块
  { name: "资源列表", url: "/admin/resources/list", requireAuth: true },
  { name: "资源分类", url: "/admin/resources/categories", requireAuth: true },
  { name: "创建资源", url: "/admin/resources/create", requireAuth: true },

  // 用户管理模块
  { name: "用户列表", url: "/admin/users/list", requireAuth: true },
  { name: "角色管理", url: "/admin/users/roles", requireAuth: true },
  { name: "权限管理", url: "/admin/users/permissions", requireAuth: true },
];

// --- 日志函数 ---
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  section: (msg) =>
    console.log(`\n==================== ${msg} ====================`),
};

// --- 确保截图目录存在 ---
function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

// --- 简单的管理员登录 ---
async function performAdminLogin(page) {
  try {
    log.info("尝试管理员登录...");

    // 访问登录页面
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "networkidle" });

    // 检查是否已经登录（重定向到仪表板）
    if (page.url().includes("/admin") && !page.url().includes("/login")) {
      log.success("已经登录状态");
      return true;
    }

    // 尝试使用默认测试账号登录（如果存在的话）
    const usernameInput = await page.$(
      'input[type="text"], input[placeholder*="用户名"], input[placeholder*="账号"]',
    );
    const passwordInput = await page.$(
      'input[type="password"], input[placeholder*="密码"]',
    );
    const loginButton = await page.$(
      'button[type="submit"], button:has-text("登录")',
    );

    if (usernameInput && passwordInput && loginButton) {
      await usernameInput.fill("admin");
      await passwordInput.fill("admin123");
      await loginButton.click();

      // 等待登录完成
      await page.waitForTimeout(2000);

      // 检查是否登录成功
      if (page.url().includes("/admin") && !page.url().includes("/login")) {
        log.success("管理员登录成功");
        return true;
      }
    }

    log.warning("无法自动登录，将跳过需要认证的页面");
    return false;
  } catch (error) {
    log.warning(`登录过程异常: ${error.message}`);
    return false;
  }
}

// --- 检查单个页面 ---
async function checkPage(page, pageInfo) {
  const { name, url, requireAuth } = pageInfo;

  try {
    log.info(`检查页面: ${name} (${url})`);

    const fullUrl = `${BASE_URL}${url}`;
    const response = await page.goto(fullUrl, {
      waitUntil: "networkidle",
      timeout: TIMEOUT,
    });

    // 检查HTTP状态
    if (!response.ok()) {
      log.error(`${name} - HTTP错误: ${response.status()}`);
      return { name, url, status: "error", error: `HTTP ${response.status()}` };
    }

    // 检查是否被重定向到登录页面
    if (requireAuth && page.url().includes("/login")) {
      log.warning(`${name} - 需要登录访问`);
      return { name, url, status: "auth_required", error: "需要登录" };
    }

    // 检查页面是否包含错误信息
    const errorElements = await page.$$(
      '[class*="error"], [class*="404"], .error-page',
    );
    if (errorElements.length > 0) {
      log.error(`${name} - 页面包含错误元素`);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/${name.replace(/[^\w\s]/gi, "")}-error.png`,
      });
      return { name, url, status: "error", error: "页面包含错误元素" };
    }

    // 检查页面是否正常加载
    const title = await page.title();
    if (
      title.toLowerCase().includes("error") ||
      title.toLowerCase().includes("404")
    ) {
      log.error(`${name} - 页面标题异常: ${title}`);
      return { name, url, status: "error", error: `页面标题异常: ${title}` };
    }

    log.success(`${name} - 页面正常`);
    return { name, url, status: "success", title };
  } catch (error) {
    log.error(`${name} - 检查异常: ${error.message}`);

    // 截图记录错误
    try {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/${name.replace(/[^\w\s]/gi, "")}-exception.png`,
      });
    } catch {
      // 忽略截图错误
    }

    return { name, url, status: "error", error: error.message };
  }
}

// --- 主执行函数 ---
async function main() {
  log.section("CMS页面健康检查");

  // 确保截图目录存在
  ensureScreenshotDir();

  const browser = await chromium.launch({
    headless: true,
    timeout: TIMEOUT,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // 设置页面超时
  page.setDefaultTimeout(TIMEOUT);

  const results = [];
  let isLoggedIn = false;

  try {
    // 首先检查前端服务是否可达
    log.info("检查前端服务可达性...");
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    log.success("前端服务可达");

    // 尝试登录
    isLoggedIn = await performAdminLogin(page);

    // 检查所有页面
    for (const pageInfo of CMS_PAGES) {
      if (pageInfo.requireAuth && !isLoggedIn) {
        log.warning(`跳过需要认证的页面: ${pageInfo.name}`);
        results.push({
          name: pageInfo.name,
          url: pageInfo.url,
          status: "skipped",
          error: "未登录，跳过检查",
        });
        continue;
      }

      const result = await checkPage(page, pageInfo);
      results.push(result);

      // 页面间稍作延迟
      await page.waitForTimeout(500);
    }
  } catch (error) {
    log.error(`检查过程异常: ${error.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }

  // 生成结果统计
  log.section("检查结果统计");

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;
  const warningCount = results.filter(
    (r) => r.status === "auth_required",
  ).length;

  log.info(`总计检查: ${results.length} 个页面`);
  log.success(`成功: ${successCount} 个`);
  log.error(`错误: ${errorCount} 个`);
  log.warning(`警告: ${warningCount} 个`);
  log.info(`跳过: ${skippedCount} 个`);

  // 详细错误信息
  const errorResults = results.filter((r) => r.status === "error");
  if (errorResults.length > 0) {
    log.section("错误详情");
    errorResults.forEach((result) => {
      log.error(`${result.name}: ${result.error}`);
    });
  }

  // 返回适当的退出码
  if (errorCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// 执行主程序
main().catch((error) => {
  log.error(`程序执行异常: ${error.message}`);
  process.exit(1);
});
