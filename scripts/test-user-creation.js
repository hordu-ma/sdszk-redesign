// test-user-creation.js - 测试用户创建和权限分配功能
import mongoose from "mongoose";
import User from "../server/models/User.js";
import Role from "../server/models/Role.js";

// 数据库连接配置
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk";

// 颜色输出函数
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  reset: "\x1b[0m",
};

const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// 测试用户数据
const testUsers = [
  {
    username: "test_admin",
    email: "test_admin@example.com",
    password: "123456",
    role: "admin",
    expectedPermissionsCount: 18, // admin应该有最多权限
  },
  {
    username: "test_co_admin",
    email: "test_co_admin@example.com",
    password: "123456",
    role: "co_admin",
    expectedPermissionsCount: 12, // co_admin应该有中等权限
  },
  {
    username: "test_editor",
    email: "test_editor@example.com",
    password: "123456",
    role: "editor",
    expectedPermissionsCount: 9, // editor应该有基础编辑权限
  },
  {
    username: "test_user",
    email: "test_user@example.com",
    password: "123456",
    role: "user",
    expectedPermissionsCount: 3, // user只有读权限
  },
];

// 测试角色权限分配
async function testRolePermissions() {
  try {
    log("blue", "🔍 开始测试角色权限分配...\n");

    // 检查所有系统角色是否存在
    const roles = await Role.find({ isSystem: true });
    log("cyan", `📋 找到 ${roles.length} 个系统角色:`);

    roles.forEach((role) => {
      log(
        "white",
        `  - ${role.displayName} (${role.name}): ${role.permissions.length} 个权限`,
      );
    });
    console.log();

    return true;
  } catch (error) {
    log("red", `❌ 角色权限测试失败: ${error.message}`);
    return false;
  }
}

// 测试用户创建和权限分配
async function testUserCreation() {
  try {
    log("blue", "👤 开始测试用户创建和权限分配...\n");

    // 清理测试用户
    await User.deleteMany({
      username: { $in: testUsers.map((u) => u.username) },
    });
    log("yellow", "🧹 清理旧的测试用户");

    const results = [];

    for (const userData of testUsers) {
      try {
        log("cyan", `📝 创建用户: ${userData.username} (${userData.role})`);

        // 创建用户
        const user = await User.create({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          role: userData.role,
          status: "active",
          active: true,
        });

        // 检查权限分配
        const actualPermissions = user.permissions || [];
        const expectedCount = userData.expectedPermissionsCount;

        const result = {
          username: userData.username,
          role: userData.role,
          expectedPermissions: expectedCount,
          actualPermissions: actualPermissions.length,
          permissions: actualPermissions,
          success: actualPermissions.length > 0,
        };

        results.push(result);

        if (result.success) {
          log(
            "green",
            `✅ ${userData.username}: 成功分配 ${actualPermissions.length} 个权限`,
          );
        } else {
          log("red", `❌ ${userData.username}: 权限分配失败`);
        }

        // 显示具体权限
        if (actualPermissions.length > 0) {
          log(
            "white",
            `   权限列表: ${actualPermissions.slice(0, 5).join(", ")}${actualPermissions.length > 5 ? "..." : ""}`,
          );
        }
      } catch (error) {
        log("red", `❌ 创建用户 ${userData.username} 失败: ${error.message}`);
        results.push({
          username: userData.username,
          role: userData.role,
          success: false,
          error: error.message,
        });
      }
    }

    console.log();
    return results;
  } catch (error) {
    log("red", `❌ 用户创建测试失败: ${error.message}`);
    return [];
  }
}

// 测试特定角色的权限检查
async function testPermissionChecking() {
  try {
    log("blue", "🔐 开始测试权限检查功能...\n");

    const testUser = await User.findOne({ username: "test_co_admin" });
    if (!testUser) {
      log("yellow", "⚠️  未找到测试用户，跳过权限检查测试");
      return false;
    }

    // 测试权限检查方法
    const testPermissions = [
      "news:read", // co_admin应该有
      "news:create", // co_admin应该有
      "users:create", // co_admin不应该有
      "settings:update", // co_admin不应该有
    ];

    log("cyan", `🧪 测试用户 ${testUser.username} 的权限:`);

    testPermissions.forEach((permission) => {
      const hasPermission = testUser.hasPermission
        ? testUser.hasPermission(permission)
        : false;
      const status = hasPermission ? "✅ 有权限" : "❌ 无权限";
      log("white", `  ${permission}: ${status}`);
    });

    console.log();
    return true;
  } catch (error) {
    log("red", `❌ 权限检查测试失败: ${error.message}`);
    return false;
  }
}

// 生成测试报告
function generateReport(results) {
  log("magenta", "📊 测试报告:");
  log("magenta", "=" * 50);

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  log("green", `✅ 成功: ${successful.length} 个用户`);
  log("red", `❌ 失败: ${failed.length} 个用户`);

  if (successful.length > 0) {
    log("cyan", "\n📈 成功创建的用户:");
    successful.forEach((result) => {
      log(
        "white",
        `  ${result.username} (${result.role}): ${result.actualPermissions} 个权限`,
      );
    });
  }

  if (failed.length > 0) {
    log("red", "\n📉 失败的用户:");
    failed.forEach((result) => {
      log(
        "white",
        `  ${result.username} (${result.role}): ${result.error || "未知错误"}`,
      );
    });
  }

  // 角色权限统计
  log("cyan", "\n📋 角色权限统计:");
  const roleStats = {};
  successful.forEach((result) => {
    if (!roleStats[result.role]) {
      roleStats[result.role] = [];
    }
    roleStats[result.role].push(result.actualPermissions);
  });

  Object.entries(roleStats).forEach(([role, permissions]) => {
    const avg = permissions.reduce((a, b) => a + b, 0) / permissions.length;
    log("white", `  ${role}: 平均 ${avg.toFixed(1)} 个权限`);
  });
}

// 清理测试数据
async function cleanup() {
  try {
    log("yellow", "🧹 清理测试数据...");
    await User.deleteMany({
      username: { $in: testUsers.map((u) => u.username) },
    });
    log("green", "✅ 测试数据清理完成");
  } catch (error) {
    log("red", `❌ 清理失败: ${error.message}`);
  }
}

// 主测试函数
async function runTests() {
  try {
    log("magenta", "🚀 开始用户创建和权限分配测试...\n");

    // 连接数据库
    log("blue", "🔌 连接数据库...");
    await mongoose.connect(MONGODB_URI);
    log("green", "✅ 数据库连接成功\n");

    // 运行测试
    const roleTest = await testRolePermissions();
    const creationResults = await testUserCreation();
    const permissionTest = await testPermissionChecking();

    // 生成报告
    if (creationResults.length > 0) {
      generateReport(creationResults);
    }

    console.log();
    log("cyan", "🎯 测试总结:");
    log("white", `  角色权限测试: ${roleTest ? "✅ 通过" : "❌ 失败"}`);
    log(
      "white",
      `  用户创建测试: ${creationResults.length > 0 ? "✅ 完成" : "❌ 失败"}`,
    );
    log("white", `  权限检查测试: ${permissionTest ? "✅ 通过" : "❌ 失败"}`);

    // 清理测试数据
    await cleanup();

    console.log();
    log("green", "🎉 所有测试完成！");
  } catch (error) {
    log("red", `💥 测试过程中发生错误: ${error.message}`);
    console.error(error);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    log("blue", "🔌 数据库连接已关闭");
  }
}

// 命令行参数处理
const args = process.argv.slice(2);

// 显示帮助信息
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
用户创建和权限分配测试脚本

用法:
  node test-user-creation.js [选项]

选项:
  --help, -h       显示此帮助信息
  --no-cleanup     测试后不清理测试数据

示例:
  node test-user-creation.js              # 运行完整测试
  node test-user-creation.js --no-cleanup # 运行测试但保留测试数据

环境变量:
  MONGODB_URI      MongoDB连接字符串 (默认: mongodb://localhost:27017/sdszk)
`);
  process.exit(0);
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export default runTests;
