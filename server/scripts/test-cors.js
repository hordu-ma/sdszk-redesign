#!/usr/bin/env node

/**
 * CORS 安全测试工具
 * 用于验证 CORS 配置的安全性和正确性
 */

import fetch from 'node-fetch';
import { getAllowedOrigins } from '../config/cors.js';
import { sysLogger } from '../utils/logger.js';

// 测试配置
const TEST_CONFIG = {
  serverUrl: process.env.TEST_SERVER_URL || 'http://localhost:3000',
  endpoints: [
    '/api/auth/login',
    '/api/resources',
    '/api/settings/public',
    '/api/dashboard/stats'
  ],
  // 测试用的恶意域名
  maliciousOrigins: [
    'http://malicious-site.com',
    'https://evil.example.com',
    'http://localhost:9999',
    'https://attacker.com',
    null, // 无 origin
    undefined
  ]
};

/**
 * 测试 CORS 预检请求
 * @param {string} origin - 测试的来源域名
 * @param {string} endpoint - 测试的端点
 * @returns {Promise<Object>} 测试结果
 */
async function testCorsPreflight(origin, endpoint) {
  const url = `${TEST_CONFIG.serverUrl}${endpoint}`;
  const headers = {
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type,Authorization'
  };

  if (origin) {
    headers['Origin'] = origin;
  }

  try {
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers
    });

    return {
      origin,
      endpoint,
      status: response.status,
      statusText: response.statusText,
      corsHeaders: {
        allowOrigin: response.headers.get('Access-Control-Allow-Origin'),
        allowMethods: response.headers.get('Access-Control-Allow-Methods'),
        allowHeaders: response.headers.get('Access-Control-Allow-Headers'),
        allowCredentials: response.headers.get('Access-Control-Allow-Credentials'),
        maxAge: response.headers.get('Access-Control-Max-Age')
      },
      success: response.ok
    };
  } catch (error) {
    return {
      origin,
      endpoint,
      error: error.message,
      success: false
    };
  }
}

/**
 * 测试实际的 API 请求
 * @param {string} origin - 测试的来源域名
 * @param {string} endpoint - 测试的端点
 * @returns {Promise<Object>} 测试结果
 */
async function testCorsRequest(origin, endpoint) {
  const url = `${TEST_CONFIG.serverUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json'
  };

  if (origin) {
    headers['Origin'] = origin;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    return {
      origin,
      endpoint,
      status: response.status,
      statusText: response.statusText,
      corsHeaders: {
        allowOrigin: response.headers.get('Access-Control-Allow-Origin'),
        allowCredentials: response.headers.get('Access-Control-Allow-Credentials')
      },
      success: response.ok || response.status === 401 // 401 也算成功，说明请求通过了 CORS
    };
  } catch (error) {
    return {
      origin,
      endpoint,
      error: error.message,
      success: false
    };
  }
}

/**
 * 运行 CORS 安全测试套件
 */
async function runCorsSecurityTests() {
  console.log('🔒 开始 CORS 安全测试');
  console.log('='.repeat(50));

  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = getAllowedOrigins();

  console.log(`📋 测试环境: ${isProduction ? '生产环境' : '开发环境'}`);
  console.log(`🌐 服务器地址: ${TEST_CONFIG.serverUrl}`);
  console.log(`✅ 允许的域名数量: ${allowedOrigins.length}`);
  console.log('');

  const results = {
    allowedOriginTests: [],
    maliciousOriginTests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      blocked: 0
    }
  };

  // 测试允许的域名
  console.log('📝 测试允许的域名...');
  for (const origin of allowedOrigins.slice(0, 5)) { // 只测试前5个以节省时间
    for (const endpoint of TEST_CONFIG.endpoints) {
      const preflightResult = await testCorsPreflight(origin, endpoint);
      const requestResult = await testCorsRequest(origin, endpoint);

      results.allowedOriginTests.push({
        origin,
        endpoint,
        preflight: preflightResult,
        request: requestResult,
        shouldPass: true,
        actuallyPassed: preflightResult.success && requestResult.success
      });

      results.summary.total++;
      if (preflightResult.success && requestResult.success) {
        results.summary.passed++;
        console.log(`  ✅ ${origin} -> ${endpoint}`);
      } else {
        results.summary.failed++;
        console.log(`  ❌ ${origin} -> ${endpoint} (${preflightResult.error || requestResult.error})`);
      }
    }
  }

  console.log('');

  // 测试恶意域名（应该被阻止）
  console.log('🚫 测试恶意域名（应该被阻止）...');
  for (const origin of TEST_CONFIG.maliciousOrigins) {
    for (const endpoint of TEST_CONFIG.endpoints.slice(0, 2)) { // 只测试前2个端点
      const preflightResult = await testCorsPreflight(origin, endpoint);
      const requestResult = await testCorsRequest(origin, endpoint);

      const shouldBeBlocked = origin !== null && origin !== undefined && isProduction;
      const actuallyBlocked = !preflightResult.success || !requestResult.success;

      results.maliciousOriginTests.push({
        origin: origin || 'no-origin',
        endpoint,
        preflight: preflightResult,
        request: requestResult,
        shouldBeBlocked,
        actuallyBlocked
      });

      results.summary.total++;
      if (shouldBeBlocked && actuallyBlocked) {
        results.summary.blocked++;
        console.log(`  🛡️  ${origin || 'no-origin'} -> ${endpoint} (正确阻止)`);
      } else if (!shouldBeBlocked && !actuallyBlocked) {
        results.summary.passed++;
        console.log(`  ⚠️  ${origin || 'no-origin'} -> ${endpoint} (开发环境允许)`);
      } else {
        results.summary.failed++;
        console.log(`  🚨 ${origin || 'no-origin'} -> ${endpoint} (安全问题！)`);
      }
    }
  }

  console.log('');
  console.log('📊 测试结果摘要');
  console.log('='.repeat(50));
  console.log(`总测试数: ${results.summary.total}`);
  console.log(`通过: ${results.summary.passed}`);
  console.log(`失败: ${results.summary.failed}`);
  console.log(`阻止: ${results.summary.blocked}`);

  const successRate = ((results.summary.passed + results.summary.blocked) / results.summary.total * 100).toFixed(1);
  console.log(`成功率: ${successRate}%`);

  // 安全评估
  console.log('');
  console.log('🔐 安全评估');
  console.log('='.repeat(50));

  const securityIssues = [];

  // 检查是否有恶意请求成功
  const unblocked = results.maliciousOriginTests.filter(test =>
    test.shouldBeBlocked && !test.actuallyBlocked
  );

  if (unblocked.length > 0) {
    securityIssues.push(`🚨 发现 ${unblocked.length} 个恶意请求未被阻止`);
  }

  // 检查允许的域名是否正常工作
  const blockedAllowed = results.allowedOriginTests.filter(test =>
    !test.actuallyPassed
  );

  if (blockedAllowed.length > 0) {
    securityIssues.push(`⚠️  ${blockedAllowed.length} 个允许的域名无法正常访问`);
  }

  // 检查生产环境特殊要求
  if (isProduction) {
    const httpOrigins = allowedOrigins.filter(origin => origin.startsWith('http://'));
    if (httpOrigins.length > 0) {
      securityIssues.push(`⚠️  生产环境存在 ${httpOrigins.length} 个 HTTP（非安全）域名`);
    }
  }

  if (securityIssues.length === 0) {
    console.log('✅ 未发现安全问题，CORS 配置良好');
  } else {
    console.log('发现以下问题:');
    securityIssues.forEach(issue => console.log(`  ${issue}`));
  }

  console.log('');
  console.log('📋 建议');
  console.log('='.repeat(50));

  if (isProduction) {
    console.log('生产环境建议:');
    console.log('  • 确保只允许 HTTPS 域名');
    console.log('  • 定期审查域名白名单');
    console.log('  • 监控 CORS 错误日志');
    console.log('  • 考虑使用子域名策略');
  } else {
    console.log('开发环境建议:');
    console.log('  • 测试生产环境配置');
    console.log('  • 验证前端域名配置');
    console.log('  • 检查环境变量设置');
  }

  // 保存详细结果到文件
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultFile = `cors-test-results-${timestamp}.json`;

  try {
    const fs = await import('fs');
    fs.writeFileSync(resultFile, JSON.stringify(results, null, 2));
    console.log(`\n📄 详细结果已保存到: ${resultFile}`);
  } catch (error) {
    console.log('\n⚠️  无法保存详细结果文件');
  }

  return results;
}

/**
 * 显示当前 CORS 配置
 */
function showCurrentConfig() {
  console.log('🔧 当前 CORS 配置');
  console.log('='.repeat(50));

  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = getAllowedOrigins();

  console.log(`环境: ${isProduction ? '生产环境' : '开发环境'}`);
  console.log(`允许的域名 (${allowedOrigins.length}个):`);

  allowedOrigins.forEach((origin, index) => {
    const secure = origin.startsWith('https://') ? '🔒' : '🔓';
    console.log(`  ${index + 1}. ${secure} ${origin}`);
  });

  console.log('');
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'config':
      showCurrentConfig();
      break;
    case 'test':
    default:
      showCurrentConfig();
      await runCorsSecurityTests();
      break;
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ 测试执行失败:', error.message);
    process.exit(1);
  });
}

export {
  runCorsSecurityTests,
  testCorsPreflight,
  testCorsRequest,
  showCurrentConfig
};
