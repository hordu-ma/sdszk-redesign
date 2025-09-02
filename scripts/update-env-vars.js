#!/usr/bin/env node

/**
 * 环境变量自动更新脚本
 * 用于将旧的环境变量格式更新为新的统一格式
 * 支持 .env, .env.development, .env.production, .env.aliyun, .env.ci 等文件
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
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
    console.log(`${colors.bold}${colors.cyan}\n🔧 ${msg}${colors.reset}`),
  update: (msg) => console.log(`${colors.cyan}📝 ${msg}${colors.reset}`),
};

// 需要处理的环境文件列表
const envFiles = [
  ".env",
  ".env.development",
  ".env.production",
  ".env.aliyun",
  ".env.ci",
];

// 环境变量映射规则
const envVarMappings = {
  // 旧变量名 -> 新变量名
  VITE_API_BASE_URL: null, // 删除
  VITE_APP_API_URL: null, // 删除
};

// 新的环境变量默认值
const newEnvVars = {
  VITE_API_PREFIX: '"/api"',
  VITE_API_VERSION: '""',
  VITE_API_TIMEOUT: '"10000"',
};

// 不同环境的特殊配置
const envSpecificConfigs = {
  ".env.development": {
    VITE_APP_DEBUG: '"true"',
    VITE_ENABLE_LOGGER: '"true"',
    VITE_API_MOCK: '"false"',
  },
  ".env.production": {
    VITE_APP_DEBUG: '"false"',
    VITE_ENABLE_LOGGER: '"false"',
    VITE_API_MOCK: '"false"',
  },
  ".env.aliyun": {
    VITE_APP_DEBUG: '"false"',
    VITE_ENABLE_LOGGER: '"false"',
    VITE_API_MOCK: '"false"',
  },
  ".env.ci": {
    VITE_APP_DEBUG: '"true"',
    VITE_ENABLE_LOGGER: '"true"',
    VITE_API_MOCK: '"true"',
  },
};

/**
 * 解析环境变量文件内容
 */
function parseEnvFile(content) {
  const lines = content.split("\n");
  const envVars = {};
  const comments = [];
  const emptyLines = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed === "") {
      emptyLines.push(index);
    } else if (trimmed.startsWith("#")) {
      comments.push({ index, content: line });
    } else if (trimmed.includes("=")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=");
      envVars[key.trim()] = value.trim();
    }
  });

  return { envVars, comments, emptyLines, originalLines: lines };
}

/**
 * 生成更新后的环境变量文件内容
 */
function generateUpdatedContent(parsed, fileName) {
  const { envVars } = parsed;
  const updatedVars = { ...envVars };
  const changes = [];

  // 删除旧的环境变量
  Object.keys(envVarMappings).forEach((oldKey) => {
    if (updatedVars[oldKey]) {
      delete updatedVars[oldKey];
      changes.push(`删除: ${oldKey}`);
    }
  });

  // 添加新的环境变量
  Object.keys(newEnvVars).forEach((newKey) => {
    if (!updatedVars[newKey]) {
      updatedVars[newKey] = newEnvVars[newKey];
      changes.push(`新增: ${newKey}=${newEnvVars[newKey]}`);
    }
  });

  // 应用环境特定配置
  const specificConfig = envSpecificConfigs[fileName] || {};
  Object.keys(specificConfig).forEach((key) => {
    const oldValue = updatedVars[key];
    const newValue = specificConfig[key];

    if (oldValue !== newValue) {
      updatedVars[key] = newValue;
      if (oldValue) {
        changes.push(`更新: ${key}=${oldValue} -> ${newValue}`);
      } else {
        changes.push(`新增: ${key}=${newValue}`);
      }
    }
  });

  // 生成文件内容
  let content = "";

  // 添加文件头注释
  content += `# 环境配置文件 - ${fileName}\n`;
  content += `# 更新时间: ${new Date().toISOString()}\n`;
  content += `# 此文件由 scripts/update-env-vars.js 自动更新\n\n`;

  // 按类别组织环境变量
  const categories = {
    应用基础配置: ["VITE_APP_TITLE", "VITE_APP_DESC", "VITE_APP_DEBUG"],
    API配置: ["VITE_API_PREFIX", "VITE_API_VERSION", "VITE_API_TIMEOUT"],
    功能开关: ["VITE_API_MOCK", "VITE_ENABLE_LOGGER"],
    上传配置: [
      "VITE_UPLOAD_MAX_SIZE",
      "VITE_UPLOAD_ACCEPT_TYPES",
      "VITE_ENABLE_COMPRESSION",
      "VITE_COMPRESSION_THRESHOLD",
    ],
    缓存配置: ["VITE_CACHE_ENABLED", "VITE_CACHE_TTL", "VITE_CACHE_MAX_SIZE"],
    分页配置: ["VITE_PAGE_SIZE", "VITE_PAGE_SIZES"],
  };

  Object.keys(categories).forEach((category) => {
    const categoryVars = categories[category];
    const hasVarsInCategory = categoryVars.some((key) => updatedVars[key]);

    if (hasVarsInCategory) {
      content += `# ${category}\n`;
      categoryVars.forEach((key) => {
        if (updatedVars[key]) {
          content += `${key}=${updatedVars[key]}\n`;
          delete updatedVars[key]; // 从剩余变量中移除
        }
      });
      content += "\n";
    }
  });

  // 添加其他未分类的变量
  const remainingVars = Object.keys(updatedVars);
  if (remainingVars.length > 0) {
    content += "# 其他配置\n";
    remainingVars.forEach((key) => {
      content += `${key}=${updatedVars[key]}\n`;
    });
    content += "\n";
  }

  return { content, changes };
}

/**
 * 创建备份文件
 */
function createBackup(filePath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${filePath}.backup.${timestamp}`;

  try {
    const content = readFileSync(filePath, "utf8");
    writeFileSync(backupPath, content, "utf8");
    return backupPath;
  } catch {
    return null;
  }
}

/**
 * 更新单个环境文件
 */
function updateEnvFile(fileName) {
  const filePath = join(projectRoot, fileName);

  if (!existsSync(filePath)) {
    log.warning(`文件不存在，跳过: ${fileName}`);
    return;
  }

  log.info(`处理文件: ${fileName}`);

  try {
    // 创建备份
    const backupPath = createBackup(filePath);
    if (backupPath) {
      log.info(`已创建备份: ${backupPath.split("/").pop()}`);
    }

    // 读取并解析现有文件
    const content = readFileSync(filePath, "utf8");
    const parsed = parseEnvFile(content);

    // 生成更新后的内容
    const { content: newContent, changes } = generateUpdatedContent(
      parsed,
      fileName,
    );

    // 写入更新后的文件
    writeFileSync(filePath, newContent, "utf8");

    // 报告更改
    if (changes.length > 0) {
      log.success(`${fileName} 更新完成`);
      changes.forEach((change) => {
        log.update(`  ${change}`);
      });
    } else {
      log.success(`${fileName} 无需更新`);
    }
  } catch (error) {
    log.error(`处理 ${fileName} 时出错: ${error.message}`);
  }
}

/**
 * 主函数
 */
function main() {
  log.title("环境变量自动更新");

  console.log(`
${colors.bold}📋 更新说明${colors.reset}
本脚本将执行以下操作：
1. 🗑️  删除旧的环境变量 (VITE_API_BASE_URL, VITE_APP_API_URL)
2. ➕ 添加新的API配置变量 (VITE_API_PREFIX, VITE_API_VERSION, VITE_API_TIMEOUT)
3. 🔧 根据环境类型应用特定配置
4. 💾 自动创建备份文件
5. 📝 重新组织和格式化配置文件
`);

  // 确认继续
  log.info("开始处理环境变量文件...\n");

  // 处理每个环境文件
  envFiles.forEach((fileName) => {
    updateEnvFile(fileName);
    console.log(); // 添加空行分隔
  });

  // 输出总结
  log.title("更新完成");

  console.log(`
${colors.bold}📋 后续操作建议${colors.reset}
1. 🔍 检查更新后的环境变量文件
2. 🧪 运行 ${colors.cyan}npm run dev${colors.reset} 测试开发环境
3. 📦 运行 ${colors.cyan}npm run build${colors.reset} 测试构建
4. ✅ 运行 ${colors.cyan}node scripts/verify-config.js${colors.reset} 验证配置
5. 🗑️  确认无误后可删除 .backup.* 备份文件

${colors.bold}📖 配置参考${colors.reset}
- 📄 查看配置模板: ${colors.cyan}.env.example${colors.reset}
- 📚 查看完整文档: ${colors.cyan}docs/api-config-refactoring-plan.md${colors.reset}
`);

  log.success("🎉 环境变量更新完成！");
}

// 运行脚本
main();
