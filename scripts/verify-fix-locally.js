#!/usr/bin/env node

/**
 * 本地验证生产环境修复效果脚本
 * 在本地环境模拟生产环境的角色数据和用户创建流程
 */

import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, "../server/.env") });

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  section: (msg) =>
    console.log(
      `\n${colors.cyan}${colors.bright}=== ${msg} ===${colors.reset}`,
    ),
};

class LocalProductionVerification {
  constructor() {
    this.localAPI = "http://localhost:3000/api";
    this.authToken = null;
  }

  async verifyFix() {
    console.log(`${colors.bright}${colors.cyan}`);
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║     本地验证生产环境修复效果                           ║");
    console.log("║     确保角色枚举修复后可以创建用户                     ║");
    console.log("╚════════════════════════════════════════════════════════╝");
    console.log(colors.reset);

    try {
      // 1. 检查本地服务
      await this.checkLocalService();

      // 2. 同步生产环境角色数据到本地
      await this.syncProductionRoles();

      // 3. 登录获取认证
      await this.authenticateAdmin();

      // 4. 测试用户创建 - 使用生产环境相同的数据
      await this.testUserCreation();

      // 5. 清理测试数据
      await this.cleanup();

      // 6. 提供部署建议
      this.provideDeploymentAdvice();
    } catch (error) {
      log.error(`验证过程出错: ${error.message}`);
    }
  }

  async checkLocalService() {
    log.section("检查本地服务状态");

    try {
      const response = await axios.get(`${this.localAPI}/health`, {
        timeout: 5000,
      });

      if (response.status === 200) {
        log.success("本地服务运行正常");
        console.log(`  数据库状态: ${response.data.database?.status || "N/A"}`);
        console.log(`  服务环境: ${response.data.environment || "N/A"}`);
      } else {
        throw new Error(`服务状态异常: ${response.status}`);
      }
    } catch (error) {
      if (error.code === "ECONNREFUSED") {
        log.error("本地服务未启动，请先运行: npm run server:dev");
        process.exit(1);
      }
      throw error;
    }
  }

  async syncProductionRoles() {
    log.section("同步生产环境角色数据");

    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk";

    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10000,
      });

      log.success("连接本地数据库成功");

      // 检查现有角色
      const rolesCollection = mongoose.connection.db.collection("roles");
      const existingRoles = await rolesCollection.find({}).toArray();

      log.info(`本地现有角色数量: ${existingRoles.length}`);

      // 确保有生产环境的关键角色
      const requiredRoles = [
        {
          name: "co_admin",
          displayName: "共同管理员",
          description: "共同管理员角色",
          permissions: ["users:create", "users:read", "users:update"],
        },
        {
          name: "sys_admin",
          displayName: "系统管理员",
          description: "系统管理员角色",
          permissions: ["*"],
        },
        {
          name: "users",
          displayName: "普通用户",
          description: "普通用户角色",
          permissions: ["users:read"],
        },
      ];

      for (const role of requiredRoles) {
        const exists = await rolesCollection.findOne({ name: role.name });

        if (!exists) {
          await rolesCollection.insertOne({
            ...role,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          log.success(`创建角色: ${role.displayName} (${role.name})`);
        } else {
          log.info(`角色已存在: ${role.displayName} (${role.name})`);
        }
      }
    } catch (error) {
      log.error(`数据库操作失败: ${error.message}`);
      throw error;
    } finally {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
    }
  }

  async authenticateAdmin() {
    log.section("管理员认证");

    try {
      const loginData = {
        username: "admin",
        password: "admin123", // 本地默认密码
      };

      const response = await axios.post(
        `${this.localAPI}/auth/login`,
        loginData,
        {
          timeout: 10000,
        },
      );

      if (response.data.token) {
        this.authToken = response.data.token;
        log.success("管理员认证成功");
        console.log(`  用户: ${response.data.user.username}`);
        console.log(`  角色: ${response.data.user.role}`);
      } else {
        throw new Error("认证响应中缺少token");
      }
    } catch (error) {
      log.error(`认证失败: ${error.message}`);

      if (error.response?.status === 401) {
        log.warn("认证失败可能原因:");
        console.log("  - 管理员账号不存在");
        console.log("  - 密码错误");
        console.log("  请检查本地数据库中的admin用户");
      }
      throw error;
    }
  }

  async testUserCreation() {
    log.section("测试用户创建功能");

    if (!this.authToken) {
      throw new Error("缺少认证token");
    }

    // 测试场景1: 使用生产环境失败的角色
    const testCases = [
      {
        name: "生产环境角色测试",
        userData: {
          username: "test_co_admin_" + Date.now(),
          email: "test_co_admin@example.com",
          password: "TestPassword123",
          role: "co_admin", // 这是之前失败的角色
          status: "active",
        },
      },
      {
        name: "系统管理员角色测试",
        userData: {
          username: "test_sys_admin_" + Date.now(),
          email: "test_sys_admin@example.com",
          password: "TestPassword123",
          role: "sys_admin",
          status: "active",
        },
      },
      {
        name: "普通用户角色测试",
        userData: {
          username: "test_users_" + Date.now(),
          email: "test_users@example.com",
          password: "TestPassword123",
          role: "users",
          status: "active",
        },
      },
    ];

    const results = [];

    for (const testCase of testCases) {
      try {
        log.info(`开始 ${testCase.name}...`);

        const response = await axios.post(
          `${this.localAPI}/admin/users`,
          testCase.userData,
          {
            headers: {
              Authorization: `Bearer ${this.authToken}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          },
        );

        if (response.status === 201) {
          log.success(`${testCase.name} - 创建成功`);
          console.log(`  用户ID: ${response.data.data.id}`);
          console.log(`  用户名: ${response.data.data.username}`);
          console.log(`  角色: ${response.data.data.role}`);

          results.push({
            testCase: testCase.name,
            success: true,
            userId: response.data.data.id,
            role: testCase.userData.role,
          });
        } else {
          throw new Error(`意外的响应状态: ${response.status}`);
        }
      } catch (error) {
        log.error(`${testCase.name} - 失败: ${error.message}`);

        if (error.response) {
          console.log(`  HTTP状态: ${error.response.status}`);
          console.log(
            `  错误信息: ${error.response.data.message || "未知错误"}`,
          );
        }

        results.push({
          testCase: testCase.name,
          success: false,
          error: error.message,
          role: testCase.userData.role,
        });
      }

      // 测试间隔
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // 分析测试结果
    this.analyzeTestResults(results);

    return results;
  }

  analyzeTestResults(results) {
    log.section("测试结果分析");

    const successCount = results.filter((r) => r.success).length;
    const totalCount = results.length;

    console.log(`测试完成: ${successCount}/${totalCount} 成功`);

    results.forEach((result, index) => {
      const status = result.success ? "✓" : "✗";
      const color = result.success ? colors.green : colors.red;
      console.log(
        `${color}${status}${colors.reset} ${result.testCase} (角色: ${result.role})`,
      );

      if (!result.success) {
        console.log(`    错误: ${result.error}`);
      }
    });

    if (successCount === totalCount) {
      log.success("\n🎉 所有测试通过！修复有效！");
      console.log("角色枚举修复成功，可以部署到生产环境");
    } else {
      log.error("\n❌ 部分测试失败，需要进一步检查");

      const failedRoles = results.filter((r) => !r.success).map((r) => r.role);
      console.log(`失败的角色: ${failedRoles.join(", ")}`);
    }
  }

  async cleanup() {
    log.section("清理测试数据");

    if (!this.authToken) {
      log.warn("无认证token，跳过清理");
      return;
    }

    try {
      // 获取所有测试用户
      const response = await axios.get(
        `${this.localAPI}/admin/users?keyword=test_`,
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
        },
      );

      const testUsers = response.data.data || [];
      log.info(`找到 ${testUsers.length} 个测试用户`);

      // 删除测试用户
      for (const user of testUsers) {
        try {
          await axios.delete(`${this.localAPI}/admin/users/${user.id}`, {
            headers: {
              Authorization: `Bearer ${this.authToken}`,
            },
          });
          log.success(`删除测试用户: ${user.username}`);
        } catch (error) {
          log.warn(`删除用户失败 ${user.username}: ${error.message}`);
        }
      }
    } catch (error) {
      log.warn(`清理过程出错: ${error.message}`);
    }
  }

  provideDeploymentAdvice() {
    log.section("部署建议");

    console.log("✅ 本地验证通过后，可以按以下步骤部署到生产环境：");
    console.log("");
    console.log("1️⃣  提交代码到版本控制：");
    console.log("   git add server/models/User.js");
    console.log(
      '   git commit -m "fix: 修复User模型角色枚举，支持co_admin等角色"',
    );
    console.log("");
    console.log("2️⃣  部署到生产环境：");
    console.log("   npm run deploy:backend");
    console.log("");
    console.log("3️⃣  验证生产环境：");
    console.log("   - 访问 https://horsduroot.com/admin/users/list");
    console.log('   - 尝试创建用户，选择"共同管理员"角色');
    console.log("   - 确认创建成功");
    console.log("");
    console.log("4️⃣  如果生产环境仍有问题，检查：");
    console.log("   - 服务器是否重启生效");
    console.log("   - PM2进程是否更新: pm2 restart sdszk-server");
    console.log("   - 查看生产日志: pm2 logs sdszk-server");
    console.log("");
    console.log("🚨 注意事项：");
    console.log("   - 部署前确保生产环境有备份");
    console.log("   - 建议在低峰时段进行部署");
    console.log("   - 准备回滚方案以防万一");
  }
}

// 处理未捕获的错误
process.on("unhandledRejection", (reason) => {
  console.error("未处理的Promise拒绝:", reason);
  process.exit(1);
});

// 运行验证
async function runVerification() {
  const verification = new LocalProductionVerification();
  await verification.verifyFix();
}

runVerification().catch((error) => {
  console.error("验证失败:", error);
  process.exit(1);
});
