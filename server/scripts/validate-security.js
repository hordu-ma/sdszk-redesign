#!/usr/bin/env node
/**
 * 安全配置验证脚本
 * 验证Helmet CSP配置的正确性和完整性
 */

import { getHelmetConfig, getCSPConfig, generateNonce } from '../config/security.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('security-validation');

/**
 * 验证CSP配置的基本安全要求
 * @param {object} cspConfig - CSP配置对象
 * @param {string} environment - 环境名称
 * @returns {object} 验证结果
 */
function validateCSPSecurity(cspConfig, environment) {
  const results = {
    passed: [],
    warnings: [],
    errors: [],
    score: 0,
    maxScore: 0
  };

  const directives = cspConfig.directives;

  // 检查基础安全配置
  const securityChecks = [
    {
      name: 'default-src 限制',
      check: () => directives.defaultSrc?.includes("'self'") && !directives.defaultSrc?.includes("*"),
      critical: true,
      description: 'default-src 应该限制为 self，不允许通配符'
    },
    {
      name: 'object-src 阻止',
      check: () => directives.objectSrc?.includes("'none'"),
      critical: true,
      description: 'object-src 应该设置为 none 以防止插件执行'
    },
    {
      name: 'script-src 安全性',
      check: () => {
        if (environment === 'production') {
          return !directives.scriptSrc?.includes("'unsafe-inline'") &&
            !directives.scriptSrc?.includes("'unsafe-eval'");
        }
        return true; // 开发环境允许
      },
      critical: environment === 'production',
      description: '生产环境中 script-src 不应包含 unsafe-inline 或 unsafe-eval'
    },
    {
      name: 'style-src 安全性',
      check: () => {
        if (environment === 'production') {
          return !directives.styleSrc?.includes("'unsafe-inline'");
        }
        return true; // 开发环境允许
      },
      critical: environment === 'production',
      description: '生产环境中 style-src 不应包含 unsafe-inline'
    },
    {
      name: 'frame-ancestors 防护',
      check: () => {
        if (environment === 'production') {
          return directives.frameAncestors?.includes("'none'") ||
            directives.frameAncestors?.includes("'self'");
        }
        return true;
      },
      critical: environment === 'production',
      description: '生产环境中应设置 frame-ancestors 防止点击劫持'
    },
    {
      name: 'img-src 限制',
      check: () => {
        if (environment === 'production') {
          return !directives.imgSrc?.includes("https:") ||
            !directives.imgSrc?.includes("http:");
        }
        return true;
      },
      critical: false,
      description: '生产环境中 img-src 应该限制特定域名而非通配符'
    },
    {
      name: 'upgrade-insecure-requests',
      check: () => Array.isArray(directives.upgradeInsecureRequests),
      critical: false,
      description: '应该启用 upgrade-insecure-requests'
    }
  ];

  // 执行安全检查
  securityChecks.forEach(check => {
    results.maxScore++;
    try {
      if (check.check()) {
        results.passed.push({
          name: check.name,
          description: check.description,
          critical: check.critical
        });
        results.score++;
      } else {
        const issue = {
          name: check.name,
          description: check.description,
          critical: check.critical
        };

        if (check.critical) {
          results.errors.push(issue);
        } else {
          results.warnings.push(issue);
        }
      }
    } catch (error) {
      results.errors.push({
        name: check.name,
        description: `检查失败: ${error.message}`,
        critical: true
      });
    }
  });

  return results;
}

/**
 * 验证Helmet配置的完整性
 * @param {object} helmetConfig - Helmet配置对象
 * @param {string} environment - 环境名称
 * @returns {object} 验证结果
 */
function validateHelmetConfig(helmetConfig, environment) {
  const results = {
    passed: [],
    warnings: [],
    errors: []
  };

  const requiredHeaders = [
    {
      name: 'Content Security Policy',
      check: () => helmetConfig.contentSecurityPolicy !== false,
      description: 'CSP 应该启用'
    },
    {
      name: 'X-Content-Type-Options',
      check: () => helmetConfig.noSniff === true,
      description: 'MIME 类型嗅探保护应该启用'
    },
    {
      name: 'X-XSS-Protection',
      check: () => helmetConfig.xssFilter === true,
      description: 'XSS 过滤器应该启用'
    },
    {
      name: 'Referrer-Policy',
      check: () => helmetConfig.referrerPolicy && helmetConfig.referrerPolicy.policy,
      description: 'Referrer 策略应该设置'
    },
    {
      name: 'HSTS (生产环境)',
      check: () => {
        if (environment === 'production') {
          return helmetConfig.hsts && helmetConfig.hsts.maxAge > 0;
        }
        return true;
      },
      description: '生产环境应该启用 HSTS'
    }
  ];

  requiredHeaders.forEach(header => {
    try {
      if (header.check()) {
        results.passed.push({
          name: header.name,
          description: header.description
        });
      } else {
        results.warnings.push({
          name: header.name,
          description: header.description
        });
      }
    } catch (error) {
      results.errors.push({
        name: header.name,
        description: `检查失败: ${error.message}`
      });
    }
  });

  return results;
}

/**
 * 生成验证报告
 * @param {string} environment - 环境名称
 */
function generateReport(environment) {
  console.log(`\n🔒 Helmet CSP 安全配置验证报告 - ${environment.toUpperCase()} 环境`);
  console.log('='.repeat(60));

  try {
    // 获取配置
    const cspConfig = getCSPConfig(environment);
    const helmetConfig = getHelmetConfig(environment);

    // 验证CSP配置
    const cspResults = validateCSPSecurity(cspConfig, environment);
    const helmetResults = validateHelmetConfig(helmetConfig, environment);

    // 输出CSP验证结果
    console.log('\n📋 CSP 配置验证:');
    console.log(`安全评分: ${cspResults.score}/${cspResults.maxScore} (${Math.round((cspResults.score / cspResults.maxScore) * 100)}%)`);

    if (cspResults.passed.length > 0) {
      console.log('\n✅ 通过的检查:');
      cspResults.passed.forEach(item => {
        console.log(`  • ${item.name}${item.critical ? ' [关键]' : ''}`);
      });
    }

    if (cspResults.warnings.length > 0) {
      console.log('\n⚠️  警告:');
      cspResults.warnings.forEach(item => {
        console.log(`  • ${item.name}: ${item.description}`);
      });
    }

    if (cspResults.errors.length > 0) {
      console.log('\n❌ 错误:');
      cspResults.errors.forEach(item => {
        console.log(`  • ${item.name}: ${item.description}`);
      });
    }

    // 输出Helmet验证结果
    console.log('\n🛡️  Helmet 配置验证:');

    if (helmetResults.passed.length > 0) {
      console.log('\n✅ 启用的安全头:');
      helmetResults.passed.forEach(item => {
        console.log(`  • ${item.name}`);
      });
    }

    if (helmetResults.warnings.length > 0) {
      console.log('\n⚠️  建议优化:');
      helmetResults.warnings.forEach(item => {
        console.log(`  • ${item.name}: ${item.description}`);
      });
    }

    if (helmetResults.errors.length > 0) {
      console.log('\n❌ 配置错误:');
      helmetResults.errors.forEach(item => {
        console.log(`  • ${item.name}: ${item.description}`);
      });
    }

    // 测试Nonce生成
    console.log('\n🔑 Nonce 生成测试:');
    const nonce1 = generateNonce();
    const nonce2 = generateNonce();
    console.log(`  • Nonce 1: ${nonce1}`);
    console.log(`  • Nonce 2: ${nonce2}`);
    console.log(`  • 唯一性检查: ${nonce1 !== nonce2 ? '✅ 通过' : '❌ 失败'}`);

    // 显示当前CSP配置概览
    console.log('\n📊 当前 CSP 配置概览:');
    Object.entries(cspConfig.directives).forEach(([directive, sources]) => {
      console.log(`  • ${directive}: ${Array.isArray(sources) ? sources.join(' ') : sources}`);
    });

    // 总体评估
    const hasErrors = cspResults.errors.length > 0 || helmetResults.errors.length > 0;
    const hasWarnings = cspResults.warnings.length > 0 || helmetResults.warnings.length > 0;
    const securityScore = cspResults.score / cspResults.maxScore;

    console.log('\n📈 总体评估:');

    if (hasErrors) {
      console.log('  状态: ❌ 存在严重安全问题，需要立即修复');
      process.exit(1);
    } else if (hasWarnings || securityScore < 0.8) {
      console.log('  状态: ⚠️  配置基本安全，建议进一步优化');
      process.exit(0);
    } else {
      console.log('  状态: ✅ 安全配置优秀');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error.message);
    logger.error('Security validation failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || process.env.NODE_ENV || 'development';

  if (!['development', 'production', 'test'].includes(environment)) {
    console.error('❌ 无效的环境名称。支持的环境: development, production, test');
    process.exit(1);
  }

  // 显示使用说明
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔒 Helmet CSP 安全配置验证工具

用法:
  node scripts/validate-security.js [环境名称]

参数:
  环境名称    可选，支持 development|production|test，默认为 development

示例:
  node scripts/validate-security.js development
  node scripts/validate-security.js production
  NODE_ENV=production node scripts/validate-security.js

选项:
  -h, --help    显示此帮助信息
    `);
    process.exit(0);
  }

  generateReport(environment);
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateCSPSecurity, validateHelmetConfig, generateReport };
