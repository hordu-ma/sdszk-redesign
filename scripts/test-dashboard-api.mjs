#!/usr/bin/env node

// 测试仪表盘API的脚本
import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000/api";
const TEST_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NGJkYWE5MjM2ZDY3YzA3MjFmYzUzNCIsImlhdCI6MTc0OTk3MDEzOCwiZXhwIjoxNzUwNTc0OTM4fQ.NtlvQ8WcIr5x9eAhoOrPAsLaZn4kwnYGYr0MLzIsXlA";

const headers = {
  Authorization: `Bearer ${TEST_TOKEN}`,
  "Content-Type": "application/json",
};

async function testApi(endpoint, method = "GET", body = null) {
  try {
    const options = {
      method,
      headers,
      ...(body && { body: JSON.stringify(body) }),
    };

    console.log(`\n🔍 测试 ${method} ${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ 成功: ${endpoint}`);
      console.log(`📊 数据:`, JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ 失败: ${endpoint}`);
      console.log(`📊 错误:`, JSON.stringify(data, null, 2));
    }

    return { success: response.ok, data };
  } catch (error) {
    console.log(`❌ 错误: ${endpoint}`);
    console.log(`📊 错误信息:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log("🚀 开始测试仪表盘API...\n");

  // 测试统计数据
  await testApi("/admin/dashboard/stats");

  // 测试访问量趋势
  await testApi("/admin/dashboard/visit-trends?period=7");

  // 测试内容分布 - 按分类
  await testApi("/admin/dashboard/content-distribution?type=category");

  // 测试内容分布 - 按状态
  await testApi("/admin/dashboard/content-distribution?type=status");

  // 测试最新动态
  await testApi("/admin/dashboard/activities?limit=5");

  // 测试系统状态
  await testApi("/admin/dashboard/system-status");

  // 测试性能指标
  await testApi("/admin/dashboard/performance-metrics");

  // 测试导出报告
  await testApi("/admin/dashboard/export-report", "POST", {
    type: "daily",
    content: ["stats", "trends"],
    format: "pdf",
  });

  console.log("\n🎉 测试完成！");
}

// 运行测试
runTests().catch(console.error);
