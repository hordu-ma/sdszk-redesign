#!/usr/bin/env node

/**
 * 第三阶段验证脚本 - 统一代理配置验证
 * 验证所有 Vite 配置文件的代理配置是否一致
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
  cyan: "\x1b[36m",
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
  section: (msg) =>
    console.log(`${colors.bold}${colors.cyan}📋 ${msg}${colors.reset}`),
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

function checkNoContent(content, pattern, description) {
  if (!content) return false;

  const found = pattern.test(content);
  if (!found) {
    log.success(description);
    checks.passed++;
    return true;
  } else {
    log.error(description);
    checks.failed++;
    return false;
  }
}

function main() {
  log.title("第三阶段验证 - 统一代理配置");

  // 1. 检查通用代理配置文件
  log.section("1. 检查通用代理配置模块");
  const proxyConfig = checkFile("src/config/proxy.ts", "通用代理配置文件");

  if (proxyConfig) {
    checkContent(
      proxyConfig,
      /export function createProxyConfig/,
      "✓ createProxyConfig 函数存在",
    );
    checkContent(
      proxyConfig,
      /export function createDevProxyConfig/,
      "✓ createDevProxyConfig 函数存在",
    );
    checkContent(
      proxyConfig,
      /export function createAliyunProxyConfig/,
      "✓ createAliyunProxyConfig 函数存在",
    );
    checkContent(
      proxyConfig,
      /export function validateProxyConfig/,
      "✓ validateProxyConfig 函数存在",
    );
    checkContent(proxyConfig, /getApiPrefix/, "✓ 使用统一的 getApiPrefix 函数");

    // 检查不使用 rewrite 函数（排除注释）
    checkNoContent(
      proxyConfig,
      /rewrite:\s*\(/,
      "✓ 不使用 rewrite，保持路径完整性",
    );
  }

  // 2. 检查开发环境配置
  log.section("2. 检查开发环境配置 (vite.config.ts)");
  const devConfig = checkFile("vite.config.ts", "开发环境配置文件");

  if (devConfig) {
    checkContent(
      devConfig,
      /import.*createDevProxyConfig.*from.*proxy/,
      "✓ 导入统一代理配置",
    );
    checkContent(
      devConfig,
      /createDevProxyConfig\(\)/,
      "✓ 使用 createDevProxyConfig",
    );
    checkContent(devConfig, /logProxyConfig/, "✓ 启用代理配置日志");

    // 检查移除旧的代理配置
    checkNoContent(
      devConfig,
      /proxy:\s*\{\s*"\/api":\s*\{.*target.*\}/s,
      "✓ 移除旧的内联代理配置",
    );
  }

  // 3. 检查阿里云环境配置
  log.section("3. 检查阿里云环境配置 (vite.config.aliyun.ts)");
  const aliyunConfig = checkFile("vite.config.aliyun.ts", "阿里云环境配置文件");

  if (aliyunConfig) {
    checkContent(
      aliyunConfig,
      /import.*createAliyunProxyConfig.*from.*proxy/,
      "✓ 导入统一代理配置",
    );
    checkContent(
      aliyunConfig,
      /createAliyunProxyConfig\(\)/,
      "✓ 使用 createAliyunProxyConfig",
    );

    // 最重要的检查：移除错误的 rewrite 逻辑
    checkNoContent(
      aliyunConfig,
      /rewrite:\s*\(path\)\s*=>/,
      "✓ 移除错误的 rewrite 逻辑",
    );
    checkNoContent(
      aliyunConfig,
      /path\.replace.*\/api/,
      "✓ 不再移除 /api 前缀",
    );
  }

  // 4. 检查配置一致性
  log.section("4. 检查配置一致性");

  if (devConfig && aliyunConfig) {
    // 检查两个配置文件都使用统一的代理模块
    const devUsesUnified = /createDevProxyConfig/.test(devConfig);
    const aliyunUsesUnified = /createAliyunProxyConfig/.test(aliyunConfig);

    if (devUsesUnified && aliyunUsesUnified) {
      log.success("✓ 所有环境都使用统一代理配置");
      checks.passed++;
    } else {
      log.error("❌ 不是所有环境都使用统一代理配置");
      checks.failed++;
    }

    // 检查都不使用 rewrite 函数
    const devNoRewrite = !/rewrite:\s*\(/.test(devConfig);
    const aliyunNoRewrite = !/rewrite:\s*\(/.test(aliyunConfig);

    if (devNoRewrite && aliyunNoRewrite) {
      log.success("✓ 所有环境都不使用 rewrite，保持路径一致性");
      checks.passed++;
    } else {
      log.error("❌ 仍有环境使用 rewrite，可能导致路径不一致");
      checks.failed++;
    }
  }

  // 5. 检查性能配置文件（如果存在）
  log.section("5. 检查其他配置文件");
  const perfConfig = checkFile(
    "vite.config.performance.ts",
    "性能配置文件",
    false,
  );

  if (perfConfig) {
    log.info("发现性能配置文件，检查是否需要更新代理配置...");

    if (/proxy:/.test(perfConfig)) {
      const usesUnified = /createProxyConfig|createDevProxyConfig/.test(
        perfConfig,
      );
      if (usesUnified) {
        log.success("✓ 性能配置已使用统一代理");
        checks.passed++;
      } else {
        log.warning("⚠️ 性能配置文件可能需要更新代理配置");
        checks.warnings++;
      }
    }
  }

  // 6. 输出验证结果
  log.title("验证结果统计");

  console.log(`
${colors.bold}📊 第三阶段验证结果${colors.reset}
- ✅ 通过检查: ${colors.green}${checks.passed}${colors.reset}
- ❌ 失败检查: ${colors.red}${checks.failed}${colors.reset}
- ⚠️  警告项目: ${colors.yellow}${checks.warnings}${colors.reset}
`);

  if (checks.failed === 0) {
    log.success("🎉 第三阶段改造验证通过！");

    console.log(`
${colors.bold}📋 验证要点总结${colors.reset}
1. ✅ 创建了统一的代理配置模块
2. ✅ 所有环境使用相同的代理逻辑
3. ✅ 移除了阿里云环境的错误 rewrite 逻辑
4. ✅ 保持了路径的完整性和一致性

${colors.bold}🔄 下一步建议${colors.reset}
1. 重启开发服务器测试代理配置
2. 验证所有环境的 API 调用正常
3. 准备进入第四阶段：环境配置标准化
`);

    process.exit(0);
  } else {
    log.error("❌ 第三阶段验证未通过，请修复失败的检查项。");

    console.log(`
${colors.bold}🔧 修复建议${colors.reset}
1. 确保创建了 src/config/proxy.ts 文件
2. 确保更新了所有 vite.config.*.ts 文件
3. 确保移除了所有 rewrite 逻辑
4. 重新运行验证脚本确认修复
`);

    process.exit(1);
  }
}

// 运行验证
main();
