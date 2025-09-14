#!/usr/bin/env node

/**
 * 生产环境用户创建失败诊断脚本
 * 专门诊断为什么本地可以创建用户，生产环境却失败的问题
 */

import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载生产环境配置
dotenv.config({ path: path.join(__dirname, "../.env.aliyun") });

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

class ProductionUserCreationDiagnosis {
  constructor() {
    this.prodAPI = "https://horsduroot.com/api";
    this.localAPI = "http://localhost:3000/api";
    this.authToken = null;
  }

  async diagnoseProblem() {
    console.log(`${colors.bright}${colors.cyan}`);
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║     生产环境用户创建失败诊断                           ║");
    console.log("║     对比本地成功 vs 生产失败的根本原因                 ║");
    console.log("╚════════════════════════════════════════════════════════╝");
    console.log(colors.reset);

    try {
      // 1. 对比环境可用性
      await this.compareEnvironments();

      // 2. 测试认证流程
      await this.testAuthentication();

      // 3. 模拟用户创建请求
      await this.simulateUserCreation();

      // 4. 检查生产数据库状态
      await this.checkProductionDatabase();

      // 5. 分析错误根因
      this.analyzeRootCause();
    } catch (error) {
      log.error(`诊断过程出错: ${error.message}`);
    }
  }

  async compareEnvironments() {
    log.section("环境对比检查");

    const environments = [
      { name: "本地环境", url: this.localAPI },
      { name: "生产环境", url: this.prodAPI },
    ];

    for (const env of environments) {
      try {
        log.info(`检查 ${env.name}: ${env.url}`);

        const response = await axios.get(`${env.url}/health`, {
          timeout: 10000,
          validateStatus: (status) => status < 500,
        });

        if (response.status === 200) {
          log.success(`${env.name} - 服务正常运行`);
          console.log(`  状态码: ${response.status}`);
          console.log(
            `  响应时间: ${response.headers["x-response-time"] || "N/A"}`,
          );
          console.log(`  数据库: ${response.data.database?.status || "N/A"}`);
        } else {
          log.warn(`${env.name} - 服务异常 (${response.status})`);
        }
      } catch (error) {
        if (error.code === "ECONNREFUSED") {
          log.error(`${env.name} - 服务未启动或无法连接`);
        } else if (error.code === "ETIMEDOUT") {
          log.error(`${env.name} - 连接超时`);
        } else {
          log.error(`${env.name} - ${error.message}`);
        }
      }
    }
  }

  async testAuthentication() {
    log.section("认证流程测试");

    // 尝试生产环境登录
    const loginData = {
      username: "admin",
      password: process.env.ADMIN_PASSWORD || "admin123",
    };

    try {
      log.info("尝试生产环境管理员登录...");

      const response = await axios.post(
        `${this.prodAPI}/auth/login`,
        loginData,
        {
          timeout: 15000,
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Production-Diagnosis-Tool",
          },
        },
      );

      if (response.data.token) {
        this.authToken = response.data.token;
        log.success("生产环境认证成功");
        console.log(`  用户: ${response.data.user.username}`);
        console.log(`  角色: ${response.data.user.role}`);
        console.log(`  Token: ${response.data.token.substring(0, 20)}...`);
      } else {
        log.error("认证响应中缺少token");
      }
    } catch (error) {
      log.error(`生产环境认证失败: ${error.message}`);

      if (error.response) {
        console.log(`  HTTP状态: ${error.response.status}`);
        console.log(`  错误信息: ${error.response.data.message || "未知错误"}`);

        // 检查是否是密码问题
        if (error.response.status === 401) {
          log.warn("可能的原因:");
          console.log("  - 管理员密码不正确");
          console.log("  - 管理员账号被禁用");
          console.log("  - JWT配置问题");
        }
      }
    }
  }

  async simulateUserCreation() {
    log.section("模拟用户创建请求");

    if (!this.authToken) {
      log.warn("无认证token，跳过用户创建测试");
      return;
    }

    // 使用与截图相同的用户数据
    const userData = {
      username: "qiaoanqiang",
      email: "1@qq.com",
      phone: "",
      password: "QAQ123456",
      role: "共同管理员", // 注意：这里使用了中文角色名
      status: "active",
    };

    try {
      log.info("尝试创建用户 (模拟前端请求)...");
      log.info(`用户数据: ${JSON.stringify(userData, null, 2)}`);

      const response = await axios.post(
        `${this.prodAPI}/admin/users`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            "Content-Type": "application/json",
            "User-Agent": "Production-Diagnosis-Tool",
          },
          timeout: 30000,
        },
      );

      log.success("用户创建成功！");
      console.log("响应数据:", JSON.stringify(response.data, null, 2));
    } catch (error) {
      log.error(`用户创建失败: ${error.message}`);

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        console.log(`HTTP状态码: ${status}`);
        console.log(`错误响应: ${JSON.stringify(data, null, 2)}`);

        // 详细分析错误类型
        this.analyzeCreationError(status, data, userData);
      } else if (error.code === "ETIMEDOUT") {
        log.error("请求超时 - 可能的原因:");
        console.log("  - 服务器响应缓慢");
        console.log("  - 数据库连接问题");
        console.log("  - 密码加密耗时过长");
      }
    }
  }

  analyzeCreationError(status, data, userData) {
    log.section("错误详细分析");

    switch (status) {
      case 400:
        log.error("客户端请求错误 (400 Bad Request)");
        console.log("可能原因:");
        console.log("  - 必填字段缺失或格式错误");
        console.log('  - 角色字段值无效 ("共同管理员" 可能不存在)');
        console.log("  - 邮箱格式验证失败");
        console.log("  - 密码强度不符合要求");

        // 检查角色字段
        if (userData.role === "共同管理员") {
          log.warn('发现问题: 角色使用了中文 "共同管理员"');
          console.log("建议修复: 检查后端是否支持此角色，或改为英文角色名");
        }
        break;

      case 401:
        log.error("认证失败 (401 Unauthorized)");
        console.log("可能原因:");
        console.log("  - Token已过期");
        console.log("  - Token无效或被篡改");
        console.log("  - 权限不足");
        break;

      case 409:
        log.error("资源冲突 (409 Conflict)");
        console.log("可能原因:");
        console.log("  - 用户名已存在");
        console.log("  - 邮箱已被使用");
        console.log("  - 唯一性约束冲突");
        break;

      case 422:
        log.error("数据验证失败 (422 Unprocessable Entity)");
        console.log("可能原因:");
        console.log("  - 业务规则验证失败");
        console.log("  - 角色权限检查失败");
        console.log("  - 数据关联性错误");
        break;

      case 500:
        log.error("服务器内部错误 (500 Internal Server Error)");
        console.log("这是最可能的问题！可能原因:");
        console.log("  - 数据库连接异常");
        console.log("  - 密码加密过程失败");
        console.log("  - 代码运行时错误");
        console.log("  - 内存或CPU资源不足");
        console.log("  - 依赖服务不可用");
        break;

      default:
        log.error(`未知HTTP错误 (${status})`);
    }

    // 检查具体错误信息
    if (data && data.message) {
      console.log(`\n服务器错误消息: "${data.message}"`);
    }
  }

  async checkProductionDatabase() {
    log.section("生产数据库检查");

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      log.warn("未找到生产数据库连接字符串");
      return;
    }

    try {
      log.info("连接生产数据库...");
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 20000,
      });

      log.success("生产数据库连接成功");

      // 检查用户集合
      const usersCollection = mongoose.connection.db.collection("users");
      const userCount = await usersCollection.countDocuments();
      log.info(`生产环境用户总数: ${userCount}`);

      // 检查目标用户是否存在
      const existingUser = await usersCollection.findOne({
        $or: [{ username: "qiaoanqiang" }, { email: "1@qq.com" }],
      });

      if (existingUser) {
        log.warn("发现冲突用户:");
        console.log(`  用户名: ${existingUser.username}`);
        console.log(`  邮箱: ${existingUser.email}`);
        console.log(`  状态: ${existingUser.status}`);
        console.log(`  创建时间: ${existingUser.createdAt}`);
        console.log(`  是否删除: ${existingUser.deletedAt ? "是" : "否"}`);
      } else {
        log.success("目标用户名和邮箱都可用");
      }

      // 检查数据库性能
      const stats = await mongoose.connection.db.stats();
      console.log(`\n数据库状态:`);
      console.log(
        `  数据库大小: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
      );
      console.log(`  集合数量: ${stats.collections}`);
    } catch (error) {
      log.error(`生产数据库检查失败: ${error.message}`);

      if (error.name === "MongoServerSelectionError") {
        console.log("数据库连接问题可能导致用户创建失败");
      }
    } finally {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
    }
  }

  analyzeRootCause() {
    log.section("根因分析与解决方案");

    console.log("基于诊断结果，最可能的问题原因：");
    console.log("");

    console.log("🔴 高可能性问题：");
    console.log('1. 角色字段错误 - "共同管理员" 可能不是有效的角色值');
    console.log("   解决方案: 检查 User 模型中的角色枚举定义");
    console.log("");

    console.log("2. 生产环境数据库连接不稳定");
    console.log("   解决方案: 检查阿里云 MongoDB 连接池配置");
    console.log("");

    console.log("3. 服务器资源不足导致密码加密超时");
    console.log("   解决方案: 检查服务器 CPU 和内存使用情况");
    console.log("");

    console.log("🟡 中等可能性问题：");
    console.log("4. JWT 配置在生产环境与本地不一致");
    console.log("5. 网络超时导致请求被中断");
    console.log("6. PM2 或 Nginx 配置问题");
    console.log("");

    console.log("📋 建议的排查顺序：");
    console.log('1. 首先检查用户模型中的 role 枚举是否包含 "共同管理员"');
    console.log(
      "2. 查看阿里云服务器的实时日志: pm2 logs 或 tail -f /path/to/logs",
    );
    console.log("3. 监控服务器资源使用: htop 或 free -h");
    console.log("4. 测试数据库连接稳定性");
    console.log("5. 如果以上都正常，检查 Nginx 超时配置");
  }
}

// 运行诊断
async function runDiagnosis() {
  const diagnosis = new ProductionUserCreationDiagnosis();
  await diagnosis.diagnoseProblem();
}

// 处理未捕获的错误
process.on("unhandledRejection", (reason, promise) => {
  console.error("未处理的 Promise 拒绝:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("未捕获的异常:", error);
  process.exit(1);
});

// 执行诊断
runDiagnosis().catch((error) => {
  console.error("诊断失败:", error);
  process.exit(1);
});
