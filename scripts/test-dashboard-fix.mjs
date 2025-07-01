#!/usr/bin/env node

// 测试仪表盘修复效果的脚本
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
      console.log(`📊 响应状态: ${response.status}`);
      console.log(
        `📊 数据预览:`,
        JSON.stringify(data, null, 2).substring(0, 500) + "..."
      );
    } else {
      console.log(`❌ 失败: ${endpoint}`);
      console.log(`📊 错误状态: ${response.status}`);
      console.log(`📊 错误信息:`, JSON.stringify(data, null, 2));
    }

    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log(`❌ 错误: ${endpoint}`);
    console.log(`📊 错误信息:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log("🚀 开始测试仪表盘修复效果...\n");

  const results = [];

  // 测试最新动态
  console.log("📋 测试最新动态功能");
  const activitiesResult = await testApi("/admin/dashboard/activities?limit=5");
  results.push({ name: "最新动态", ...activitiesResult });

  // 测试系统状态
  console.log("\n📋 测试系统状态功能");
  const systemResult = await testApi("/admin/dashboard/system-status");
  results.push({ name: "系统状态", ...systemResult });

  // 测试性能指标
  console.log("\n📋 测试性能指标功能");
  const performanceResult = await testApi(
    "/admin/dashboard/performance-metrics"
  );
  results.push({ name: "性能指标", ...performanceResult });

  // 测试统计数据
  console.log("\n📋 测试统计数据功能");
  const statsResult = await testApi("/admin/dashboard/stats");
  results.push({ name: "统计数据", ...statsResult });

  // 总结测试结果
  console.log("\n📊 测试结果总结:");
  console.log("=".repeat(50));

  results.forEach((result) => {
    const status = result.success ? "✅ 通过" : "❌ 失败";
    const statusCode = result.status || "N/A";
    console.log(`${status} ${result.name} (状态码: ${statusCode})`);
  });

  const passedCount = results.filter((r) => r.success).length;
  const totalCount = results.length;

  console.log("\n" + "=".repeat(50));
  console.log(`🎯 总体结果: ${passedCount}/${totalCount} 个测试通过`);

  if (passedCount === totalCount) {
    console.log("🎉 所有测试通过！仪表盘功能正常。");
  } else {
    console.log("⚠️  部分测试失败，请检查相关功能。");
  }
}

// 运行测试
runTests().catch(console.error);
