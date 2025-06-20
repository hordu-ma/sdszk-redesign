/**
 * API请求频率限制中间件 - 避免客户端过于频繁地调用同一接口
 */

import rateLimit from "express-rate-limit";

// 默认限制：更宽松的限制，适合生产环境
const defaultRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 200, // 每个IP最多200个请求/分钟
  standardHeaders: true, // 返回标准的RateLimit头部信息
  legacyHeaders: false, // 禁用X-RateLimit-*头部
  message: {
    status: "error",
    message: "请求过于频繁，请稍后再试",
    code: "TOO_MANY_REQUESTS",
  },
  skip: (req) => {
    // 跳过健康检查和静态资源
    return req.path === "/api/health" || req.path.startsWith("/uploads/");
  },
});

// 核心接口频率限制：更宽松的限制
const coreApiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 50, // 每个IP最多50个请求/分钟
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "核心API请求过于频繁，请稍后再试",
    code: "CORE_API_TOO_MANY_REQUESTS",
  },
  keyGenerator: (req) => {
    // 基于IP生成限制键，移除路径以避免过度限制
    return req.ip;
  },
});

// 适用于需要更严格限制的接口（例如用户注册、登录等）
const strictRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 20, // 每个IP最多20个请求/5分钟
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
