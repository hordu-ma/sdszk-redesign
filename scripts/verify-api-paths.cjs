#!/usr/bin/env node

/**
 * API路径验证脚本
 *
 * 功能：
 * 1. 检查所有前端代码中的API调用是否使用正确的/api前缀
 * 2. 验证API调用是否使用了端点常量而不是硬编码路径
 * 3. 检查API端点常量定义的完整性
 * 4. 防止将来出现API路径不一致问题
 *
 * 用法：
 * node scripts/verify-api-paths.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 配置
const CONFIG = {
  srcDir: 'src',
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/coverage/**',
    '**/*.d.ts',
    '**/constants/api-endpoints.ts' // 排除端点定义文件本身
  ],
  apiPrefix: '/api',
  endpointsFile: 'src/constants/api-endpoints.ts'
};

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorLog(color, text) {
  console.log(`${color}${text}${colors.reset}`);
}

function success(text) { colorLog(colors.green, `✅ ${text}`); }
function error(text) { colorLog(colors.red, `❌ ${text}`); }
function warning(text) { colorLog(colors.yellow, `⚠️  ${text}`); }
function info(text) { colorLog(colors.blue, `ℹ️  ${text}`); }
function header(text) { colorLog(colors.bold, `\n📋 ${text}`); }

// 验证结果收集器
const results = {
  hardcodedPaths: [],
  missingPrefix: [],
  missingEndpoints: [],
  unusedEndpoints: [],
  errors: [],
  warnings: [],
  totalChecked: 0
};

/**
 * 获取所有需要检查的文件
 */
function getFilesToCheck() {
  const patterns = [
    'src/**/*.ts',
    'src/**/*.js',
    'src/**/*.vue'
  ];

  let files = [];
  patterns.forEach(pattern => {
    const matched = glob.sync(pattern, {
      ignore: CONFIG.excludePatterns,
      absolute: false
    });
    files = files.concat(matched);
  });

  return [...new Set(files)]; // 去重
}

/**
 * 读取API端点常量定义
 */
function loadApiEndpoints() {
  try {
    const endpointsPath = CONFIG.endpointsFile;
    if (!fs.existsSync(endpointsPath)) {
      error(`API端点文件不存在: ${endpointsPath}`);
      return null;
    }

    const content = fs.readFileSync(endpointsPath, 'utf8');

    // 提取所有端点定义
    const endpoints = new Set();

    // 匹配 ENDPOINTS 对象中的路径
    const endpointRegex = /buildApiPath\(['"`]([^'"`]+)['"`]\)/g;
    let match;
    while ((match = endpointRegex.exec(content)) !== null) {
      endpoints.add(CONFIG.apiPrefix + match[1]);
    }

    // 匹配直接定义的路径
    const directPathRegex = /['"`](\/api\/[^'"`]+)['"`]/g;
    while ((match = directPathRegex.exec(content)) !== null) {
      endpoints.add(match[1]);
    }

    return endpoints;
  } catch (err) {
    error(`读取API端点文件失败: ${err.message}`);
    return null;
  }
}

/**
 * 检查文件中的API调用
 */
function checkFileApiCalls(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileResults = {
      hardcodedPaths: [],
      missingPrefix: [],
      lineNumbers: new Map()
    };

    // 按行分割以获取行号
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // 检查API调用模式
      const apiCallPatterns = [
        /api\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
        /axios\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
        /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g
      ];

      apiCallPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const path = match[2] || match[1]; // fetch只有一个路径参数

          if (path.startsWith('/')) {
            // 记录行号
            if (!fileResults.lineNumbers.has(path)) {
              fileResults.lineNumbers.set(path, []);
            }
            fileResults.lineNumbers.get(path).push(lineNumber);

            if (!path.startsWith(CONFIG.apiPrefix)) {
              // 缺少API前缀
              fileResults.missingPrefix.push(path);
            } else {
              // 检查是否为硬编码路径（不是从常量导入）
              if (!isUsingEndpointConstant(line, path)) {
                fileResults.hardcodedPaths.push(path);
              }
            }
          }
        }
      });
    });

    return fileResults;
  } catch (err) {
    results.errors.push(`读取文件 ${filePath} 失败: ${err.message}`);
    return null;
  }
}

/**
 * 检查是否使用了端点常量
 */
function isUsingEndpointConstant(line, path) {
  // 检查是否包含端点常量的模式
  const constantPatterns = [
    /_ENDPOINTS\./,
    /AUTH_ENDPOINTS/,
    /NEWS_ENDPOINTS/,
    /RESOURCE_ENDPOINTS/,
    /USER_ENDPOINTS/,
    /UPLOAD_ENDPOINTS/,
    /ACTIVITY_ENDPOINTS/,
    /SETTING_ENDPOINTS/,
    /LOG_ENDPOINTS/,
    /DASHBOARD_ENDPOINTS/,
    /FAVORITE_ENDPOINTS/,
    /VIEW_HISTORY_ENDPOINTS/,
    /ROLE_ENDPOINTS/,
    /PERMISSION_ENDPOINTS/,
    /HEALTH_ENDPOINTS/,
    /PERFORMANCE_ENDPOINTS/
  ];

  return constantPatterns.some(pattern => pattern.test(line));
}

/**
 * 检查端点常量的使用情况
 */
function checkEndpointUsage(apiEndpoints, allFiles) {
  const usedEndpoints = new Set();

  allFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // 查找端点常量的使用
      apiEndpoints.forEach(endpoint => {
        const relativePath = endpoint.replace(CONFIG.apiPrefix, '');

        // 检查多种可能的使用模式
        const usagePatterns = [
          new RegExp(`['"\`]${endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'g'),
          new RegExp(`buildApiPath\\(['"\`]${relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]\\)`, 'g')
        ];

        usagePatterns.forEach(pattern => {
          if (pattern.test(content)) {
            usedEndpoints.add(endpoint);
          }
        });
      });
    } catch (err) {
      // 忽略读取错误，已在其他地方处理
    }
  });

  // 找出未使用的端点
  apiEndpoints.forEach(endpoint => {
    if (!usedEndpoints.has(endpoint)) {
      results.unusedEndpoints.push(endpoint);
    }
  });
}

/**
 * 主验证函数
 */
function validateApiPaths() {
  header('API路径验证开始');

  // 1. 加载API端点定义
  info('加载API端点定义...');
  const apiEndpoints = loadApiEndpoints();
  if (!apiEndpoints) {
    error('无法加载API端点定义，验证中止');
    return false;
  }
  success(`发现 ${apiEndpoints.size} 个API端点定义`);

  // 2. 获取要检查的文件
  info('扫描项目文件...');
  const filesToCheck = getFilesToCheck();
  success(`找到 ${filesToCheck.length} 个文件需要检查`);

  // 3. 检查每个文件
  header('检查API调用路径');
  filesToCheck.forEach(filePath => {
    const fileResults = checkFileApiCalls(filePath);
    if (fileResults) {
      results.totalChecked++;

      // 收集硬编码路径
      fileResults.hardcodedPaths.forEach(path => {
        const lines = fileResults.lineNumbers.get(path) || [];
        results.hardcodedPaths.push({
          file: filePath,
          path: path,
          lines: lines
        });
      });

      // 收集缺少前缀的路径
      fileResults.missingPrefix.forEach(path => {
        const lines = fileResults.lineNumbers.get(path) || [];
        results.missingPrefix.push({
          file: filePath,
          path: path,
          lines: lines
        });
      });
    }
  });

  // 4. 检查端点使用情况
  header('检查端点常量使用情况');
  checkEndpointUsage(apiEndpoints, filesToCheck);

  return true;
}

/**
 * 生成验证报告
 */
function generateReport() {
  header('验证报告');

  console.log(`📊 检查统计:`);
  console.log(`  - 检查文件数: ${results.totalChecked}`);
  console.log(`  - 发现问题: ${results.missingPrefix.length + results.hardcodedPaths.length}`);
  console.log(`  - 警告项目: ${results.unusedEndpoints.length}`);

  // 报告缺少API前缀的路径
  if (results.missingPrefix.length > 0) {
    header('❌ 缺少 /api 前缀的路径');
    results.missingPrefix.forEach(item => {
      error(`${item.file}:${item.lines.join(',')} - "${item.path}"`);
    });
  }

  // 报告硬编码的API路径
  if (results.hardcodedPaths.length > 0) {
    header('⚠️  硬编码的API路径 (建议使用端点常量)');
    results.hardcodedPaths.forEach(item => {
      warning(`${item.file}:${item.lines.join(',')} - "${item.path}"`);
    });
  }

  // 报告未使用的端点
  if (results.unusedEndpoints.length > 0) {
    header('📝 未使用的端点常量');
    results.unusedEndpoints.forEach(endpoint => {
      info(`${endpoint}`);
    });
  }

  // 报告错误
  if (results.errors.length > 0) {
    header('💥 处理错误');
    results.errors.forEach(error => {
      error(error);
    });
  }

  // 最终结果
  const hasErrors = results.missingPrefix.length > 0 || results.errors.length > 0;
  const hasWarnings = results.hardcodedPaths.length > 0 || results.unusedEndpoints.length > 0;

  if (!hasErrors && !hasWarnings) {
    success('\n🎉 所有API路径验证通过！');
  } else if (!hasErrors) {
    warning('\n✨ API路径验证通过，但有一些建议优化的地方');
  } else {
    error('\n💥 API路径验证失败，需要修复错误');
  }

  return !hasErrors;
}

/**
 * 生成修复建议
 */
function generateFixSuggestions() {
  if (results.missingPrefix.length > 0) {
    header('🔧 修复建议');

    console.log('对于缺少 /api 前缀的路径，请按以下方式修复：\n');

    const pathFixes = new Map();
    results.missingPrefix.forEach(item => {
      const fixedPath = CONFIG.apiPrefix + item.path;
      if (!pathFixes.has(item.path)) {
        pathFixes.set(item.path, []);
      }
      pathFixes.get(item.path).push(item.file);
    });

    pathFixes.forEach((files, originalPath) => {
      const fixedPath = CONFIG.apiPrefix + originalPath;
      console.log(`  "${originalPath}" → "${fixedPath}"`);
      files.forEach(file => {
        console.log(`    - ${file}`);
      });
      console.log('');
    });

    console.log('建议使用API端点常量替代硬编码路径：');
    console.log('  1. 从 src/constants/api-endpoints.ts 导入相应的端点常量');
    console.log('  2. 使用常量替代硬编码的字符串路径');
    console.log('  3. 如果需要新的端点，请在端点文件中添加定义\n');
  }
}

// 主程序
function main() {
  console.log('🔍 API路径一致性验证工具\n');

  try {
    const success = validateApiPaths();
    const reportSuccess = generateReport();

    if (!reportSuccess) {
      generateFixSuggestions();
    }

    process.exit(reportSuccess ? 0 : 1);
  } catch (err) {
    error(`验证过程发生错误: ${err.message}`);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  validateApiPaths,
  generateReport,
  CONFIG
};
