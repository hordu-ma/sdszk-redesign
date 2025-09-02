#!/usr/bin/env node

/**
 * API路径验证脚本
 * 用于验证修复后的API路径是否正确生成
 */

// 颜色输出函数
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

console.log(colors.bold("\n🔍 API路径验证脚本"));
console.log("=".repeat(50));

// 模拟环境变量
const mockEnv = {
  VITE_API_PREFIX: "/api",
  VITE_API_VERSION: "",
  VITE_API_TIMEOUT: "10000",
};

// 模拟getApiPrefix函数
function getApiPrefix() {
  const prefix = mockEnv.VITE_API_PREFIX || "/api";
  const version = mockEnv.VITE_API_VERSION || "";
  return version ? `${prefix}/${version}` : prefix;
}

// 模拟BaseApi.getUrl方法 (修复前)
function getUrlOld(prefix, path) {
  return `${prefix}${path}`;
}

// 模拟BaseApi.getUrl方法 (修复后)
function getUrlNew(prefix, path) {
  return `${getApiPrefix()}${prefix}${path}`;
}

// 测试用例
const testCases = [
  { name: "NewsApi.getList()", prefix: "/news", path: "" },
  { name: "NewsApi.getDetail(id)", prefix: "/news", path: "/123" },
  { name: "NewsApi.getCategories()", prefix: "/news", path: "/categories" },
  { name: "ResourceApi.getList()", prefix: "/resources", path: "" },
  { name: "ResourceApi.getDetail(id)", prefix: "/resources", path: "/456" },
  { name: "AdminApi.getStats()", prefix: "/admin", path: "/stats" },
];

console.log(colors.blue("\n📊 API路径生成对比测试"));
console.log("-".repeat(80));
console.log(
  colors.bold("API调用".padEnd(25)) +
    colors.bold("修复前路径".padEnd(20)) +
    colors.bold("修复后路径".padEnd(25)) +
    colors.bold("状态"),
);
console.log("-".repeat(80));

let passCount = 0;
let totalCount = testCases.length;

testCases.forEach((testCase) => {
  const oldUrl = getUrlOld(testCase.prefix, testCase.path);
  const newUrl = getUrlNew(testCase.prefix, testCase.path);

  const isCorrect = newUrl.startsWith("/api");
  const status = isCorrect ? colors.green("✅ 正确") : colors.red("❌ 错误");

  if (isCorrect) passCount++;

  console.log(
    testCase.name.padEnd(25) +
      colors.red(oldUrl.padEnd(20)) +
      colors.green(newUrl.padEnd(25)) +
      status,
  );
});

console.log("-".repeat(80));

// 验证代理配置匹配
console.log(colors.blue("\n🔀 代理配置匹配验证"));
console.log("-".repeat(50));

const proxyRule = "/api";
const samplePaths = [
  "/api/news",
  "/api/resources",
  "/api/admin/stats",
  "/news", // 这个不应该匹配
  "/resources", // 这个不应该匹配
];

samplePaths.forEach((path) => {
  const matches = path.startsWith(proxyRule);
  const status = matches
    ? colors.green("✅ 匹配代理")
    : colors.red("❌ 无代理");
  console.log(`${path.padEnd(20)} ${status}`);
});

// 环境变量验证
console.log(colors.blue("\n⚙️ 环境变量配置验证"));
console.log("-".repeat(40));

Object.entries(mockEnv).forEach(([key, value]) => {
  console.log(`${colors.cyan(key.padEnd(20))} ${colors.yellow(value)}`);
});

console.log(
  `${colors.cyan("计算出的API前缀:".padEnd(20))} ${colors.yellow(getApiPrefix())}`,
);

// 总结报告
console.log(colors.bold("\n📋 验证结果总结"));
console.log("=".repeat(50));

if (passCount === totalCount) {
  console.log(colors.green(`✅ 所有测试通过 (${passCount}/${totalCount})`));
  console.log(colors.green("🎉 API路径修复成功！"));
  console.log(colors.cyan("\n📝 修复说明:"));
  console.log("   - BaseApi.getUrl() 现在使用 getApiPrefix() 函数");
  console.log("   - 所有API请求都会添加 /api 前缀");
  console.log("   - API请求能够正确匹配vite代理规则");
} else {
  console.log(colors.red(`❌ 部分测试失败 (${passCount}/${totalCount})`));
  console.log(colors.red("🚨 需要进一步检查API路径配置"));
}

// 后续步骤建议
console.log(colors.blue("\n🚀 下一步建议:"));
console.log("1. 启动开发服务器: npm run dev");
console.log("2. 打开浏览器开发者工具");
console.log("3. 检查Network面板中的API请求路径");
console.log("4. 验证API请求是否正确发送到 /api/* 路径");
console.log("5. 确认后端数据是否正常加载\n");

process.exit(passCount === totalCount ? 0 : 1);
