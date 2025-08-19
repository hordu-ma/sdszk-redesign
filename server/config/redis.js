/**
 * Redis 配置和连接管理
 * 使用结构化日志记录连接状态和错误
 */

import { createClient } from "redis";
import { sysLogger, logError } from "../utils/logger.js";

// Redis连接配置
const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    reconnectStrategy: (retries) => {
      const maxRetries = process.env.NODE_ENV === "development" ? 3 : 10;
      if (retries > maxRetries) {
        sysLogger.error({ retries, maxRetries }, "Redis: 重连次数超过限制，停止重连");
        return new Error("重连次数过多");
      }
      const delay = Math.min(retries * 100, 3000);
      sysLogger.info({ retries, delay }, `Redis: 将在 ${delay}ms 后进行第 ${retries} 次重连`);
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
  // 开发模式下的可选Redis支持
  if (process.env.NODE_ENV === "development" && !process.env.REDIS_ENABLED) {
    sysLogger.warn("Redis: 开发模式下未启用Redis，使用内存缓存");
    return null;
  }

  try {
    redisClient = createClient(redisConfig);

    // 连接事件监听
    redisClient.on("connect", () => {
      sysLogger.info("Redis: 连接成功");
      isConnected = true;
    });

    // 就绪事件
    redisClient.on("ready", () => {
      sysLogger.info("Redis: 客户端就绪");
    });

    // 错误事件
    redisClient.on("error", (err) => {
      logError(err, { context: 'redis-connection' });
      isConnected = false;
    });

    // 重连事件
    redisClient.on("reconnecting", () => {
      sysLogger.info("Redis: 正在重新连接...");
    });

    // 连接结束事件
    redisClient.on("end", () => {
      sysLogger.info("Redis: 连接已关闭");
      isConnected = false;
    });

    // 连接到Redis，设置超时
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("连接超时")), 5000);
    });

    await Promise.race([connectPromise, timeoutPromise]);
    sysLogger.info("Redis: 初始化成功");
    return redisClient;
  } catch (error) {
    logError(error, { context: 'redis-initialization' });
    sysLogger.warn("Redis初始化失败，应用将继续运行，使用内存缓存作为降级方案");
    // Redis连接失败不应该导致应用崩溃
    return null;
  }
}

// 获取Redis客户端
export function getRedisClient() {
  return redisClient;
}

// 检查Redis连接状态
export function isRedisConnected() {
  return isConnected && redisClient && redisClient.isOpen;
}

// 关闭Redis连接
export async function closeRedis() {
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.quit();
      sysLogger.info("Redis: 连接已正常关闭");
    } catch (error) {
      logError(error, { context: 'redis-shutdown' });
      // 强制关闭连接
      await redisClient.disconnect();
      sysLogger.warn("Redis: 强制断开连接");
    }
    redisClient = null;
    isConnected = false;
  }
}

// Redis操作包装器，提供自动重试和错误处理
export async function redisOperation(operation, key, value = null, options = {}) {
  if (!isRedisConnected()) {
    sysLogger.debug({ operation, key }, "Redis不可用，跳过操作");
    return null;
  }

  try {
    const startTime = Date.now();
    let result;

    switch (operation) {
      case 'get':
        result = await redisClient.get(key);
        break;
      case 'set':
        result = await redisClient.set(key, value, options);
        break;
      case 'del':
        result = await redisClient.del(key);
        break;
      case 'exists':
        result = await redisClient.exists(key);
        break;
      case 'expire':
        result = await redisClient.expire(key, value);
        break;
      default:
        throw new Error(`不支持的Redis操作: ${operation}`);
    }

    const duration = Date.now() - startTime;
    sysLogger.debug({
      operation,
      key,
      duration: `${duration}ms`,
      success: true
    }, `Redis操作完成: ${operation}`);

    return result;
  } catch (error) {
    logError(error, {
      context: 'redis-operation',
      operation,
      key
    });
    return null;
  }
}

export default {
  initRedis,
  getRedisClient,
  isRedisConnected,
  closeRedis,
  redisOperation,
};
