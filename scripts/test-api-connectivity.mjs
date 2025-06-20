#!/usr/bin// API基础URL
const API_BASE_URL = 'http://60.205.124.67:3000';nv node

/**
 * API连接测试脚本
 * 测试后端服务的各个端点是否正常工作
 */

import https from "https";
import { promisify } from "util";

// API基础URL
const API_BASE_URL = "https://api.sdszk.top";

// 测试用的端点列表
const TEST_ENDPOINTS = [
  { path: "/api/health", method: "GET", description: "健康检查" },
  { path: "/api/news", method: "GET", description: "新闻列表" },
  { path: "/api/resources", method: "GET", description: "资源列表" },
  { path: "/api/activities", method: "GET", description: "活动列表" },
  { path: "/api/site-settings", method: "GET", description: "站点设置" },
];

/**
 * 发送HTTP请求
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          data: data,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

/**
 * 测试单个端点
 */
async function testEndpoint(endpoint) {
  const url = new URL(endpoint.path, API_BASE_URL);

  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname + url.search,
    method: endpoint.method,
    headers: {
      "User-Agent": "API-Test-Script/1.0",
      Accept: "application/json",
    },
  };

  console.log(`\n🧪 测试: ${endpoint.description}`);
  console.log(`   URL: ${url.href}`);
  console.log(`   方法: ${endpoint.method}`);

  try {
    const response = await makeRequest(options);

    console.log(
      `   ✅ 状态码: ${response.statusCode} ${response.statusMessage}`
    );
    console.log(
      `   📦 Content-Type: ${response.headers["content-type"] || "N/A"}`
    );

    // 尝试解析JSON响应
    if (response.headers["content-type"]?.includes("application/json")) {
      try {
        const jsonData = JSON.parse(response.data);
        console.log(
          `   📄 响应预览: ${JSON.stringify(jsonData).substring(0, 200)}...`
        );
      } catch (e) {
        console.log(`   ⚠️  JSON解析失败: ${e.message}`);
      }
    } else {
      console.log(`   📄 响应长度: ${response.data.length} 字符`);
    }

    return {
      success: response.statusCode >= 200 && response.statusCode < 400,
      statusCode: response.statusCode,
      error: null,
    };
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return {
      success: false,
      statusCode: null,
      error: error.message,
    };
  }
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log("🚀 开始API连接测试...");
  console.log(`📡 目标服务器: ${API_BASE_URL}`);

  const results = [];

  for (const endpoint of TEST_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push({
      endpoint: endpoint.description,
      ...result,
    });

    // 在测试之间稍作延迟
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // 输出总结
  console.log("\n📊 测试总结:");
  console.log("=" * 50);

  const successful = results.filter((r) => r.success).length;
  const total = results.length;

  console.log(`✅ 成功: ${successful}/${total}`);
  console.log(`❌ 失败: ${total - successful}/${total}`);

  if (successful === total) {
    console.log("\n🎉 所有API端点测试通过！");
  } else {
    console.log("\n⚠️  部分API端点测试失败：");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(
          `   - ${r.endpoint}: ${r.error || "状态码 " + r.statusCode}`
        );
      });
  }

  return successful === total;
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ 测试脚本执行失败:", error);
      process.exit(1);
    });
}

export { runTests, testEndpoint };
