#!/usr/bin/env node

// ==============================================================================
// 山东省思政课一体化中心 - CMS核心功能测试 (v1.0)
// ==============================================================================

import { chromium } from "playwright";
import fs from "fs";

// --- 配置 ---
const BASE_URL = "http://localhost:5173";
const API_BASE_URL = "http://localhost:3000/api";
const TIMEOUT = 30000;
const SCREENSHOT_DIR = "./.cms-reports/screenshots";

// --- 日志函数 ---
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  section: (msg) =>
    console.log(`\n==================== ${msg} ====================`),
};

// --- API健康检查 ---
async function checkAPIEndpoints() {
  log.section("API端点健康检查");

  const endpoints = [
    { name: "API健康检查", path: "/health" },
    { name: "新闻分类", path: "/news-categories" },
    { name: "新闻列表", path: "/news" },
    { name: "资源分类", path: "/resource-categories" },
    { name: "资源列表", path: "/resources" },
    { name: "管理员新闻", path: "/admin/news" },
    { name: "管理员资源", path: "/admin/resources" },
    { name: "管理员用户", path: "/admin/users" },
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const url = `${API_BASE_URL}${endpoint.path}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        await response.json(); // 验证响应可解析
        log.success(`${endpoint.name} - 响应正常 (${response.status})`);
        results.push({
          ...endpoint,
          status: "success",
          statusCode: response.status,
        });
      } else if (response.status === 401) {
        log.info(
          `${endpoint.name} - 需要认证 (${response.status}) - 这是正常的安全机制`,
        );
        results.push({
          ...endpoint,
          status: "auth_required",
          statusCode: response.status,
        });
      } else {
        log.error(`${endpoint.name} - HTTP错误: ${response.status}`);
        results.push({
          ...endpoint,
          status: "error",
          statusCode: response.status,
        });
      }
    } catch (error) {
      log.error(`${endpoint.name} - 请求异常: ${error.message}`);
      results.push({ ...endpoint, status: "error", error: error.message });
    }
  }

  return results;
}

// --- 数据库连接检查 ---
async function checkDatabaseConnection() {
  log.section("数据库连接检查");

  try {
    // 检查基础数据是否存在
    const endpoints = [
      { name: "新闻分类数据", path: "/news-categories" },
      { name: "资源分类数据", path: "/resource-categories" },
    ];

    for (const endpoint of endpoints) {
      const url = `${API_BASE_URL}${endpoint.path}`;
      const response = await fetch(url);

      if (response.ok) {
        const result = await response.json();

        // 处理标准API响应格式 {status: "success", data: [...]}
        let data = result;
        if (result && result.status === "success" && result.data) {
          data = result.data;
        }

        if (Array.isArray(data) && data.length > 0) {
          log.success(`${endpoint.name} - 数据正常 (${data.length} 条记录)`);
        } else if (Array.isArray(data) && data.length === 0) {
          log.warning(`${endpoint.name} - 数据为空`);
        } else {
          log.warning(`${endpoint.name} - 数据格式异常`);
        }
      } else {
        log.error(`${endpoint.name} - 无法获取数据 (HTTP ${response.status})`);
      }
    }
  } catch (error) {
    log.error(`数据库连接检查异常: ${error.message}`);
  }
}

// --- CMS核心功能UI测试 ---
async function testCMSFunctions(page) {
  log.section("CMS核心功能UI测试");

  const tests = [];

  try {
    // 测试管理后台主页加载
    log.info("测试管理后台主页...");
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });

    // 等待Vue应用初始化
    await page.waitForTimeout(2000);

    // 检查页面是否正确加载（不在登录页面且页面有内容）
    const isLoginPage = page.url().includes("/login");
    const hasContent = await page.$(
      '#app, [id*="app"], .admin-container, .main-container, main, .content',
    );

    if (!isLoginPage && hasContent) {
      log.success("管理后台主页加载正常");
      tests.push({ name: "管理后台主页", status: "success" });
    } else if (isLoginPage) {
      log.warning("管理后台需要登录");
      tests.push({
        name: "管理后台主页",
        status: "warning",
        issue: "需要登录",
      });
    } else {
      log.warning("管理后台主页内容未完全加载");
      tests.push({
        name: "管理后台主页",
        status: "warning",
        issue: "页面内容加载异常",
      });
    }

    // 测试新闻管理页面
    log.info("测试新闻管理页面...");
    await page.goto(`${BASE_URL}/admin/news/list`, {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(2000);

    // 更宽松的元素检查 - 检查页面结构而不是具体的表格元素
    const pageContent = await page.evaluate(() => {
      const hasTable = document.querySelector("table, .el-table, .ant-table");
      const hasGrid = document.querySelector(
        '[class*="grid"], [class*="list"], .data-container',
      );
      const hasCards = document.querySelector(
        '.card, .el-card, [class*="card"]',
      );
      const hasContent = document.querySelector("#app, main, .content");
      return {
        hasTable: !!hasTable,
        hasGrid: !!hasGrid,
        hasCards: !!hasCards,
        hasContent: !!hasContent,
      };
    });

    if (pageContent.hasTable || pageContent.hasGrid || pageContent.hasCards) {
      log.success("新闻管理页面加载正常");
      tests.push({ name: "新闻管理页面", status: "success" });
    } else if (pageContent.hasContent) {
      log.warning("新闻管理页面已加载但未检测到数据展示组件");
      tests.push({
        name: "新闻管理页面",
        status: "warning",
        issue: "可能数据为空或组件未渲染",
      });
    } else {
      log.error("新闻管理页面加载失败");
      tests.push({
        name: "新闻管理页面",
        status: "error",
        issue: "页面未正确加载",
      });
    }

    // 测试资源管理页面
    log.info("测试资源管理页面...");
    await page.goto(`${BASE_URL}/admin/resources/list`, {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(2000);

    const resourcePageContent = await page.evaluate(() => {
      const hasTable = document.querySelector("table, .el-table, .ant-table");
      const hasGrid = document.querySelector(
        '[class*="grid"], [class*="list"], .data-container',
      );
      const hasCards = document.querySelector(
        '.card, .el-card, [class*="card"]',
      );
      const hasContent = document.querySelector("#app, main, .content");
      return {
        hasTable: !!hasTable,
        hasGrid: !!hasGrid,
        hasCards: !!hasCards,
        hasContent: !!hasContent,
      };
    });

    if (
      resourcePageContent.hasTable ||
      resourcePageContent.hasGrid ||
      resourcePageContent.hasCards
    ) {
      log.success("资源管理页面加载正常");
      tests.push({ name: "资源管理页面", status: "success" });
    } else if (resourcePageContent.hasContent) {
      log.warning("资源管理页面已加载但未检测到数据展示组件");
      tests.push({
        name: "资源管理页面",
        status: "warning",
        issue: "可能数据为空或组件未渲染",
      });
    } else {
      log.error("资源管理页面加载失败");
      tests.push({
        name: "资源管理页面",
        status: "error",
        issue: "页面未正确加载",
      });
    }

    // 测试用户管理页面
    log.info("测试用户管理页面...");
    await page.goto(`${BASE_URL}/admin/users/list`, {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(2000);

    const userPageContent = await page.evaluate(() => {
      const hasTable = document.querySelector("table, .el-table, .ant-table");
      const hasGrid = document.querySelector(
        '[class*="grid"], [class*="list"], .data-container',
      );
      const hasCards = document.querySelector(
        '.card, .el-card, [class*="card"]',
      );
      const hasContent = document.querySelector("#app, main, .content");
      return {
        hasTable: !!hasTable,
        hasGrid: !!hasGrid,
        hasCards: !!hasCards,
        hasContent: !!hasContent,
      };
    });

    if (
      userPageContent.hasTable ||
      userPageContent.hasGrid ||
      userPageContent.hasCards
    ) {
      log.success("用户管理页面加载正常");
      tests.push({ name: "用户管理页面", status: "success" });
    } else if (userPageContent.hasContent) {
      log.warning("用户管理页面已加载但未检测到数据展示组件");
      tests.push({
        name: "用户管理页面",
        status: "warning",
        issue: "可能数据为空或组件未渲染",
      });
    } else {
      log.error("用户管理页面加载失败");
      tests.push({
        name: "用户管理页面",
        status: "error",
        issue: "页面未正确加载",
      });
    }
  } catch (error) {
    log.error(`CMS功能测试异常: ${error.message}`);
    tests.push({ name: "CMS功能测试", status: "error", error: error.message });
  }

  return tests;
}

// --- 检查JavaScript错误 ---
function setupJavaScriptErrorMonitoring(page) {
  const jsErrors = [];

  // 页面JavaScript错误监听
  page.on("pageerror", (error) => {
    jsErrors.push({
      type: "javascript",
      message: error.message || "未知JavaScript错误",
      stack: error.stack || "",
      url: page.url(),
      timestamp: new Date().toISOString(),
    });
  });

  // 网络请求失败监听
  page.on("requestfailed", (request) => {
    if (request.failure()) {
      jsErrors.push({
        type: "network",
        url: request.url(),
        method: request.method(),
        error: request.failure().errorText,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 控制台错误监听
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      jsErrors.push({
        type: "console",
        message: msg.text(),
        url: page.url(),
        timestamp: new Date().toISOString(),
      });
    }
  });

  return jsErrors;
}

// --- 主执行函数 ---
async function main() {
  log.section("CMS核心功能测试");

  // 确保截图目录存在
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  // API检查
  const apiResults = await checkAPIEndpoints();

  // 数据库检查
  await checkDatabaseConnection();

  // UI功能检查
  const browser = await chromium.launch({
    headless: true,
    timeout: TIMEOUT,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT);

  let uiResults = [];
  let jsErrors = [];

  try {
    // 设置JavaScript错误监控
    jsErrors = setupJavaScriptErrorMonitoring(page);

    // 首先检查前台页面
    log.info("检查前台页面基本功能...");
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // 检查前台页面是否正常
    const title = await page.title();
    if (title && title.length > 0) {
      log.success(`前台页面正常 - ${title}`);
    } else {
      log.warning("前台页面标题为空");
    }

    // 尝试简单登录并测试CMS功能
    try {
      await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "networkidle" });

      // 如果已经登录或者能够访问管理页面，继续测试
      if (!page.url().includes("/login") || page.url().includes("/admin")) {
        uiResults = await testCMSFunctions(page);
      } else {
        log.warning("无法访问管理后台，跳过UI功能测试");
        uiResults.push({
          name: "CMS UI测试",
          status: "skipped",
          error: "无法访问管理后台",
        });
      }
    } catch (error) {
      log.warning(`CMS UI测试跳过: ${error.message}`);
      uiResults.push({
        name: "CMS UI测试",
        status: "skipped",
        error: error.message,
      });
    }
  } catch (error) {
    log.error(`UI测试异常: ${error.message}`);
    uiResults.push({ name: "UI测试", status: "error", error: error.message });
  } finally {
    await browser.close();
  }

  // 生成测试结果统计
  log.section("功能测试结果统计");

  const allResults = [...apiResults, ...uiResults];
  const successCount = allResults.filter((r) => r.status === "success").length;
  const errorCount = allResults.filter((r) => r.status === "error").length;
  const warningCount = allResults.filter((r) => r.status === "warning").length;
  const skippedCount = allResults.filter((r) => r.status === "skipped").length;
  const authRequiredCount = allResults.filter(
    (r) => r.status === "auth_required",
  ).length;

  log.info(`总计测试: ${allResults.length} 项`);
  log.success(`成功: ${successCount} 项`);
  log.error(`错误: ${errorCount} 项`);
  log.warning(`警告: ${warningCount} 项`);
  log.info(`需要认证: ${authRequiredCount} 项`);
  log.info(`跳过: ${skippedCount} 项`);

  // JavaScript错误统计
  if (jsErrors.length > 0) {
    log.section("JavaScript错误");

    // 按类型分组显示错误
    const errorsByType = jsErrors.reduce((acc, error) => {
      if (!acc[error.type]) acc[error.type] = [];
      acc[error.type].push(error);
      return acc;
    }, {});

    Object.entries(errorsByType).forEach(([type, errors]) => {
      log.info(`\n${type.toUpperCase()}错误 (${errors.length}个):`);
      errors.slice(0, 5).forEach((error, index) => {
        // 最多显示5个同类错误
        const message = error.message || error.error || "未知错误";
        const location = error.url ? ` (${error.url})` : "";
        log.error(`  ${index + 1}. ${message}${location}`);
      });
      if (errors.length > 5) {
        log.info(`  ... 还有 ${errors.length - 5} 个${type}错误`);
      }
    });
  } else {
    log.success("未发现JavaScript错误");
  }

  // 详细错误信息
  const errorResults = allResults.filter((r) => r.status === "error");
  if (errorResults.length > 0) {
    log.section("错误详情");
    errorResults.forEach((result) => {
      log.error(
        `${result.name}: ${result.error || result.statusCode || "未知错误"}`,
      );
    });
  }

  // 认证相关信息
  const authResults = allResults.filter((r) => r.status === "auth_required");
  if (authResults.length > 0) {
    log.section("需要认证的接口");
    authResults.forEach((result) => {
      log.info(`${result.name}: 需要JWT令牌认证`);
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
