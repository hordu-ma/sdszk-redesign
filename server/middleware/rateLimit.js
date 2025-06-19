/**
 * API请求频率限制中间件 - 避免客户端过于频繁地调用同一接口
 */

import rateLimit from "express-rate-limit";

// 默认限制：100次请求/分钟
const defaultRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 每个IP最多100个请求/分钟
  standardHeaders: true, // 返回标准的RateLimit头部信息
  legacyHeaders: false, // 禁用X-RateLimit-*头部
  message: {
    status: "error",
    message: "请求过于频繁，请稍后再试",
    code: "TOO_MANY_REQUESTS",
  },
});

// 核心接口频率限制：15次请求/分钟
const coreApiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 15, // 每个IP最多15个请求/分钟
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "核心API请求过于频繁，请稍后再试",
    code: "CORE_API_TOO_MANY_REQUESTS",
  },
  keyGenerator: (req) => {
    // 基于IP和路径组合生成限制键
    return `${req.ip}-${req.path}`;
  },
});

// 适用于需要更严格限制的接口（例如用户注册、登录等）
const strictRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 10, // 每个IP最多10个请求/5分钟
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "敏感操作请求过于频繁，请稍后再试",
    code: "STRICT_TOO_MANY_REQUESTS",
  },
});

/**
 * 应用频率限制中间件
 * @param {Object} app Express应用实例
 */
const applyRateLimits = (app) => {
  // 全局默认限制
  app.use(defaultRateLimit);

  // 特定路径限制

  // 核心分类API - 用于首页等高频场景
  app.use("/api/news-categories/core", coreApiRateLimit);
  app.use("/api/resources", coreApiRateLimit);

  // 严格限制的API
  app.use("/api/auth/login", strictRateLimit);
  app.use("/api/auth/register", strictRateLimit);
  app.use("/api/auth/send-code", strictRateLimit);
  app.use("/api/auth/reset-password", strictRateLimit);

  console.log("API请求频率限制中间件已应用");
};

export { applyRateLimits, defaultRateLimit, coreApiRateLimit, strictRateLimit };
