#!/usr/bin/env node

/**
 * API连接测试工具
 *
 * 用于测试不同CORS代理服务的API连接情况
 * 使用方法: node scripts/test-api-connectivity.js
 */

import axios from "axios";

// 简单的彩色日志，避免添加依赖
const chalk = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
};

// 实际API域名（请替换为您实际申请的API域名）
const ACTUAL_API_DOMAIN = "api.example.com"; // 临时使用示例域名，请替换为实际域名

// 测试的API端点
const API_ENDPOINTS = [
  "/news/categories",
  "/resources/categories",
  "/news/latest",
  "/resources/featured",
];

// 不同的CORS代理服务
const CORS_PROXIES = [
  {
    name: "AllOrigins",
    url: `https://api.allorigins.win/raw?url=https://${ACTUAL_API_DOMAIN}/api`,
  },
  {
    name: "CORSProxy.io",
    url: `https://corsproxy.io/?https://${ACTUAL_API_DOMAIN}/api`,
  },
  {
    name: "YACDN",
    url: `https://yacdn.org/proxy/https://${ACTUAL_API_DOMAIN}/api`,
  },
  {
    name: "CORS.sh",
    url: "https://proxy.cors.sh/https://api.sust.edu.cn/api",
  },
];

async function testEndpoint(proxyUrl, endpoint) {
  console.log(chalk.blue(`测试 ${proxyUrl}${endpoint} ...`));

  try {
    const startTime = Date.now();
    const response = await axios.get(`${proxyUrl}${endpoint}`, {
      timeout: 10000,
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    const endTime = Date.now();

    console.log(
      chalk.green(
        `✓ 成功! 状态码: ${response.status}, 响应时间: ${endTime - startTime}ms`
      )
    );
    console.log(
      chalk.green(
        `  数据: ${JSON.stringify(response.data).substring(0, 100)}...`
      )
    );
    return true;
  } catch (error) {
    console.log(chalk.red(`✗ 失败! ${error.message}`));
    if (error.response) {
      console.log(chalk.red(`  状态码: ${error.response.status}`));
      console.log(
        chalk.red(`  错误信息: ${JSON.stringify(error.response.data)}`)
      );
    }
    return false;
  }
}

async function main() {
  console.log(chalk.yellow("=== API连接测试工具 ==="));
  console.log(chalk.yellow("测试不同CORS代理服务的API连接情况"));

  const results = {};

  for (const proxy of CORS_PROXIES) {
    console.log(chalk.yellow(`\n=== 测试代理: ${proxy.name} ===`));
    results[proxy.name] = {
      success: 0,
      failure: 0,
      endpoints: {},
    };

    for (const endpoint of API_ENDPOINTS) {
      const success = await testEndpoint(proxy.url, endpoint);
      results[proxy.name].endpoints[endpoint] = success;

      if (success) {
        results[proxy.name].success += 1;
      } else {
        results[proxy.name].failure += 1;
      }
    }
  }

  console.log(chalk.yellow("\n=== 测试结果汇总 ==="));
  for (const [proxyName, result] of Object.entries(results)) {
    const successRate = ((result.success / API_ENDPOINTS.length) * 100).toFixed(
      1
    );
    console.log(
      successRate >= 75
        ? chalk.green(
            `${proxyName}: 成功率 ${successRate}% (${result.success}/${API_ENDPOINTS.length})`
          )
        : successRate >= 50
          ? chalk.yellow(
              `${proxyName}: 成功率 ${successRate}% (${result.success}/${API_ENDPOINTS.length})`
            )
          : chalk.red(
              `${proxyName}: 成功率 ${successRate}% (${result.success}/${API_ENDPOINTS.length})`
            )
    );
  }

  // 推荐最佳代理
  const bestProxy = Object.entries(results).reduce((best, [name, result]) => {
    return !best || result.success > results[best].success ? name : best;
  }, null);

  if (bestProxy) {
    console.log(chalk.green(`\n推荐使用的代理服务: ${bestProxy}`));
  }
}

main().catch(console.error);
