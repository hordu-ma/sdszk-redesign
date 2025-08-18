import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

// Redis配置
const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    reconnectStrategy: (retries) => {
      const maxRetries = process.env.NODE_ENV === "development" ? 3 : 10;
      if (retries > maxRetries) {
        console.error("Redis: 重连次数超过限制，停止重连");
        return new Error("重连次数过多");
      }
      const delay = Math.min(retries * 100, 3000);
      console.log(`Redis: 将在 ${delay}ms 后进行第 ${retries} 次重连`);
      return delay;
    },
    connectTimeout: process.env.NODE_ENV === "development" ? 3000 : 10000,
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || "0"),
};

// 创建Redis客户端
let redisClient = null;
let isConnected = false;

// 初始化Redis连接
export async function initRedis() {
  // 在开发环境中，如果Redis不可用，直接跳过
  if (process.env.NODE_ENV === "development" && !process.env.REDIS_ENABLED) {
    console.log("🟡 Redis: 开发模式下未启用Redis，使用内存缓存");
    return null;
  }

  try {
    redisClient = createClient(redisConfig);

    // 监听连接事件
    redisClient.on("connect", () => {
      console.log("✅ Redis: 连接成功");
      isConnected = true;
    });

    // 监听就绪事件
    redisClient.on("ready", () => {
      console.log("✅ Redis: 客户端就绪");
    });

    // 监听错误事件
    redisClient.on("error", (err) => {
      console.error("❌ Redis错误:", err.message);
      isConnected = false;
    });

    // 监听重连事件
    redisClient.on("reconnecting", () => {
      console.log("🔄 Redis: 正在重新连接...");
    });

    // 监听结束事件
    redisClient.on("end", () => {
      console.log("🔚 Redis: 连接已关闭");
      isConnected = false;
    });

    // 连接到Redis，设置超时
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("连接超时")), 5000);
    });

    await Promise.race([connectPromise, timeoutPromise]);
    return redisClient;
  } catch (error) {
    console.error("❌ Redis初始化失败:", error.message);
    console.log("🟡 应用将继续运行，使用内存缓存作为降级方案");
    // Redis连接失败不应该导致应用崩溃
    return null;
  }
}

// 获取Redis客户端
export function getRedisClient() {
  return redisClient;
}

// 检查Redis是否连接
export function isRedisConnected() {
  return isConnected && redisClient && redisClient.isReady;
}

// 关闭Redis连接
export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
  }
}

export default {
  initRedis,
  getRedisClient,
  isRedisConnected,
  closeRedis,
};
