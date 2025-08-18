#!/usr/bin/env node

import { createClient } from "redis";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

console.log("🔍 Redis连接测试开始...\n");

// Redis配置信息
const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    connectTimeout: 5000,
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || "0"),
};

console.log("📋 Redis配置信息:");
console.log(`   主机: ${redisConfig.socket.host}`);
console.log(`   端口: ${redisConfig.socket.port}`);
console.log(`   数据库: ${redisConfig.database}`);
console.log(`   密码: ${redisConfig.password ? "已设置" : "未设置"}`);
console.log(`   启用状态: ${process.env.REDIS_ENABLED || "false"}\n`);

async function testRedisConnection() {
  let client = null;

  try {
    console.log("🔌 正在尝试连接Redis...");

    // 创建Redis客户端
    client = createClient(redisConfig);

    // 设置事件监听器
    client.on("error", (err) => {
      console.error("❌ Redis连接错误:", err.message);
    });

    client.on("connect", () => {
      console.log("✅ Redis连接建立成功");
    });

    client.on("ready", () => {
      console.log("✅ Redis客户端就绪");
    });

    // 连接到Redis
    await client.connect();

    console.log("📊 正在执行Redis功能测试...\n");

    // 测试基本的Redis操作
    const testKey = "test:redis:connection";
    const testValue = "Redis is working!";

    // 1. 测试SET操作
    console.log("1️⃣ 测试SET操作...");
    await client.set(testKey, testValue);
    console.log("   ✅ SET操作成功");

    // 2. 测试GET操作
    console.log("2️⃣ 测试GET操作...");
    const retrievedValue = await client.get(testKey);
    if (retrievedValue === testValue) {
      console.log("   ✅ GET操作成功，数据一致");
    } else {
      console.log("   ❌ GET操作失败，数据不一致");
    }

    // 3. 测试TTL操作
    console.log("3️⃣ 测试TTL操作...");
    await client.expire(testKey, 60);
    const ttl = await client.ttl(testKey);
    console.log(`   ✅ TTL设置成功，剩余时间: ${ttl}秒`);

    // 4. 测试DELETE操作
    console.log("4️⃣ 测试DEL操作...");
    await client.del(testKey);
    const deletedValue = await client.get(testKey);
    if (deletedValue === null) {
      console.log("   ✅ DEL操作成功");
    } else {
      console.log("   ❌ DEL操作失败");
    }

    // 5. 获取Redis信息
    console.log("5️⃣ 获取Redis服务器信息...");
    const info = await client.info("server");
    const lines = info.split("\r\n");
    const serverInfo = {};

    lines.forEach((line) => {
      if (line.includes(":") && !line.startsWith("#")) {
        const [key, value] = line.split(":");
        serverInfo[key] = value;
      }
    });

    console.log(`   Redis版本: ${serverInfo.redis_version || "未知"}`);
    console.log(`   运行模式: ${serverInfo.redis_mode || "未知"}`);
    console.log(`   操作系统: ${serverInfo.os || "未知"}`);
    console.log(`   架构: ${serverInfo.arch_bits || "未知"}位`);
    console.log(`   进程ID: ${serverInfo.process_id || "未知"}`);
    console.log(`   端口: ${serverInfo.tcp_port || "未知"}`);

    console.log("\n🎉 Redis连接测试全部通过！Redis服务运行正常。");
  } catch (error) {
    console.error("\n❌ Redis连接测试失败:");
    console.error(`   错误信息: ${error.message}`);
    console.error(`   错误代码: ${error.code || "未知"}`);

    if (error.code === "ECONNREFUSED") {
      console.error("\n💡 解决建议:");
      console.error("   1. 检查Redis服务是否已启动");
      console.error("   2. 运行: brew services start redis");
      console.error("   3. 或运行: redis-server");
    } else if (error.code === "ENOTFOUND") {
      console.error("\n💡 解决建议:");
      console.error("   1. 检查Redis主机地址是否正确");
      console.error("   2. 检查网络连接");
    } else if (error.message.includes("AUTH")) {
      console.error("\n💡 解决建议:");
      console.error("   1. 检查Redis密码配置");
      console.error("   2. 确认REDIS_PASSWORD环境变量");
    }

    process.exit(1);
  } finally {
    // 清理连接
    if (client) {
      try {
        await client.quit();
        console.log("\n🔚 Redis连接已关闭");
      } catch (err) {
        console.error("关闭连接时出错:", err.message);
      }
    }
  }
}

// 运行测试
testRedisConnection().catch(console.error);
