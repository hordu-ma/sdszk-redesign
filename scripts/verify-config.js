#!/usr/bin/env node

/**
 * API配置验证脚本
 * 用于验证第一阶段改造后的配置是否正确
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// 颜色输出
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: (msg) =>
    console.log(`${colors.bold}${colors.blue}\n🔍 ${msg}${colors.reset}`),
};

// 验证结果统计
let checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function checkFile(filePath, description) {
  try {
    const content = readFileSync(join(projectRoot, filePath), "utf8");
    log.success(`${description}: 文件存在`);
    checks.passed++;
    return content;
  } catch {
    log.error(`${description}: 文件不存在或无法读取`);
    checks.failed++;
    return null;
  }
}

function checkContent(content, pattern, description, isRequired = true) {
  if (!content) return false;

  const found = pattern.test(content);
  if (found) {
    log.success(description);
    checks.passed++;
    return true;
  } else {
    if (isRequired) {
      log.error(description);
      checks.failed++;
    } else {
      log.warning(description);
      checks.warnings++;
    }
    return false;
  }
}

function main() {
  log.title("API配置验证 - 第一阶段改造");

  // 1. 检查类型定义文件
  log.title("检查类型定义");
  const envTypes = checkFile("src/env.d.ts", "环境变量类型定义文件");

  if (envTypes) {
    checkContent(envTypes, /VITE_API_PREFIX/, "✓ VITE_API_PREFIX 类型定义存在");
    checkContent(
      envTypes,
      /VITE_API_VERSION/,
      "✓ VITE_API_VERSION 类型定义存在",
    );
    checkContent(
      envTypes,
      /VITE_API_TIMEOUT/,
      "✓ VITE_API_TIMEOUT 类型定义存在",
    );

    // 检查src目录中的ImportMeta定义应该只有一个（精确匹配，不包括ImportMetaEnv）
    const importMetaCount = (envTypes.match(/interface ImportMeta\s*{/g) || [])
      .length;
    if (importMetaCount === 1) {
      log.success("✓ src目录中ImportMeta接口定义唯一");
      checks.passed++;
    } else {
      log.warning(
        `⚠️  src/env.d.ts中发现${importMetaCount}个ImportMeta接口定义，应该只有1个`,
      );
      checks.warnings++;
    }
  }

  // 2. 检查配置文件
  log.title("检查配置管理");
  const configFile = checkFile("src/config/index.ts", "配置管理文件");

  if (configFile) {
    // 检查是否移除了重复的ImportMeta定义
    checkContent(
      configFile,
      /^(?!.*interface ImportMeta)/,
      "✓ 已移除重复的ImportMeta定义",
      false,
    );

    // 检查新的API配置
    checkContent(configFile, /API_CONFIG.*=/, "✓ API_CONFIG 配置存在");
    checkContent(configFile, /prefix:.*VITE_API_PREFIX/, "✓ API前缀配置正确");
    checkContent(configFile, /version:.*VITE_API_VERSION/, "✓ API版本配置正确");
    checkContent(configFile, /baseURL:\s*""/, "✓ baseURL设置为空字符串");
    checkContent(configFile, /getApiPrefix/, "✓ getApiPrefix函数存在");
  }

  // 3. 检查API工具文件
  log.title("检查API工具");
  const apiFile = checkFile("src/utils/api.ts", "API工具文件");

  if (apiFile) {
    // 检查baseURL简化
    checkContent(apiFile, /baseURL:\s*""/, "✓ axios baseURL简化为空字符串");

    // 检查是否移除了复杂的fallback逻辑
    const hasComplexFallback = /baseURL:.*\?.*:/.test(apiFile);
    if (!hasComplexFallback) {
      log.success("✓ 已移除复杂的baseURL fallback逻辑");
      checks.passed++;
    } else {
      log.warning("⚠️  仍存在复杂的baseURL fallback逻辑");
      checks.warnings++;
    }
  }

  // 4. 检查示例环境变量文件
  log.title("检查环境变量模板");
  const envExample = checkFile(".env.example", "环境变量示例文件");

  if (envExample) {
    checkContent(envExample, /VITE_API_PREFIX/, "✓ API前缀配置示例存在");
    checkContent(envExample, /VITE_API_VERSION/, "✓ API版本配置示例存在");
    checkContent(envExample, /VITE_API_TIMEOUT/, "✓ API超时配置示例存在");
  }

  // 5. 检查文档
  log.title("检查项目文档");
  checkFile("docs/api-config-refactoring-plan.md", "重构方案文档");

  // 6. 输出验证结果
  log.title("验证结果统计");

  console.log(`
${colors.bold}📊 验证结果汇总${colors.reset}
- ✅ 通过检查: ${colors.green}${checks.passed}${colors.reset}
- ❌ 失败检查: ${colors.red}${checks.failed}${colors.reset}
- ⚠️  警告项目: ${colors.yellow}${checks.warnings}${colors.reset}
`);

  if (checks.failed === 0) {
    log.success("🎉 第一阶段改造验证通过！可以进行下一阶段。");

    console.log(`
${colors.bold}📋 下一步操作建议${colors.reset}
1. 运行 ${colors.blue}npm run dev${colors.reset} 验证开发环境
2. 检查浏览器控制台确保无类型警告
3. 验证现有API调用功能正常
4. 确认后继续API模块架构升级
`);

    process.exit(0);
  } else {
    log.error("❌ 验证未通过，请修复失败的检查项后重试。");
    process.exit(1);
  }
}

// 运行验证
main();
