/**
 * HTTP 请求日志中间件
 * 自动记录所有 API 请求的详细信息
 */

import { logHttpRequest, apiLogger } from "../utils/logger.js";

/**
 * HTTP 请求日志中间件
 * 记录请求开始时间、结束时间、响应状态等信息
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // 记录请求开始
  apiLogger.debug(
    {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
      contentType: req.get("Content-Type"),
      contentLength: req.get("Content-Length"),
      userId: req.user?.id,
      username: req.user?.username,
    },
    "HTTP request started",
  );

  // 监听响应完成事件
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logHttpRequest(req, res, duration);
  });

  // 监听响应关闭事件（客户端断开连接）
  res.on("close", () => {
    if (!res.finished) {
      const duration = Date.now() - startTime;
      apiLogger.warn(
        {
          method: req.method,
          url: req.originalUrl || req.url,
          duration: `${duration}ms`,
          ip: req.ip || req.connection.remoteAddress,
          userId: req.user?.id,
        },
        "HTTP request closed by client",
      );
    }
  });

  next();
};

/**
 * 错误请求日志中间件
 * 专门记录产生错误的请求的详细信息
 */
export const errorRequestLogger = (err, req, res, next) => {
  apiLogger.error(
    {
      error: {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        statusCode: err.statusCode || 500,
      },
      request: {
        method: req.method,
        url: req.originalUrl || req.url,
        headers: {
          userAgent: req.get("User-Agent"),
          contentType: req.get("Content-Type"),
          authorization: req.get("Authorization") ? "[REDACTED]" : undefined,
        },
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.id,
        username: req.user?.username,
        body: req.method !== "GET" ? "[REDACTED]" : undefined, // 不记录敏感的请求体
      },
    },
    `Request error: ${err.message}`,
  );

  next(err);
};

/**
 * 慢请求日志中间件
 * 记录超过指定时间阈值的请求
 */
export const slowRequestLogger = (threshold = 1000) => {
  return (req, res, next) => {
    const startTime = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - startTime;

      if (duration > threshold) {
        apiLogger.warn(
          {
            method: req.method,
            url: req.originalUrl || req.url,
            duration: `${duration}ms`,
            threshold: `${threshold}ms`,
            statusCode: res.statusCode,
            ip: req.ip || req.connection.remoteAddress,
            userId: req.user?.id,
          },
          `Slow request detected (${duration}ms > ${threshold}ms)`,
        );
      }
    });

    next();
  };
};

/**
 * API 访问统计中间件
 * 统计不同端点的访问频率
 */
export const apiStatsLogger = (() => {
  const stats = new Map();
  const REPORT_INTERVAL = 5 * 60 * 1000; // 5分钟报告一次

  // 定期报告统计信息
  setInterval(() => {
    if (stats.size > 0) {
      const sortedStats = Array.from(stats.entries())
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10); // 只报告访问量最高的10个端点

      apiLogger.info(
        {
          topEndpoints: sortedStats.map(([endpoint, data]) => ({
            endpoint,
            count: data.count,
            avgDuration: Math.round(data.totalDuration / data.count),
          })),
          totalRequests: Array.from(stats.values()).reduce(
            (sum, data) => sum + data.count,
            0,
          ),
        },
        "API access statistics report",
      );

      // 清空统计数据
      stats.clear();
    }
  }, REPORT_INTERVAL);

  return (req, res, next) => {
    const startTime = Date.now();
    const endpoint = `${req.method} ${req.route?.path || req.originalUrl || req.url}`;

    res.on("finish", () => {
      const duration = Date.now() - startTime;

      if (!stats.has(endpoint)) {
        stats.set(endpoint, { count: 0, totalDuration: 0 });
      }

      const stat = stats.get(endpoint);
      stat.count++;
      stat.totalDuration += duration;
    });

    next();
  };
})();

/**
 * 安全敏感操作日志中间件
 * 记录涉及安全的操作（登录、权限变更等）
 */
export const securityLogger = (req, res, next) => {
  const securityPaths = [
    "/api/auth",
    "/api/users",
    "/api/admin",
    "/api/settings",
  ];

  const isSecurityPath = securityPaths.some(
    (path) => req.originalUrl?.startsWith(path) || req.url?.startsWith(path),
  );

  if (isSecurityPath) {
    const startTime = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - startTime;

      apiLogger.warn(
        {
          security: true,
          method: req.method,
          url: req.originalUrl || req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent"),
          userId: req.user?.id,
          username: req.user?.username,
          timestamp: new Date().toISOString(),
        },
        "Security-sensitive operation",
      );
    });
  }

  next();
};

export default {
  requestLogger,
  errorRequestLogger,
  slowRequestLogger,
  apiStatsLogger,
  securityLogger,
};
