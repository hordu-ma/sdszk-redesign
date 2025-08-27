/**
 * Helmet 安全策略配置模块
 * 提供环境相关的内容安全策略(CSP)和其他安全头配置
 */

import crypto from "crypto";

/**
 * 生成CSP nonce值
 * @returns {string} base64编码的随机nonce
 */
export const generateNonce = () => {
  return crypto.randomBytes(16).toString("base64");
};

/**
 * 开发环境CSP配置 - 相对宽松以支持开发工具
 */
const developmentCSP = {
  directives: {
    defaultSrc: ["'self'"],
    // 开发环境允许unsafe-inline以支持热重载和开发工具
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://cdnjs.cloudflare.com",
    ],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'", // Vite开发服务器需要
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
    ],
    imgSrc: [
      "'self'",
      "data:",
      "https:",
      "http://localhost:*", // 允许本地开发图片
      "blob:",
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdnjs.cloudflare.com",
      "data:",
    ],
    connectSrc: [
      "'self'",
      "ws://localhost:*", // WebSocket支持（Vite HMR）
      "http://localhost:*",
      "https://localhost:*",
      "https://*.google-analytics.com",
      "https://api.example.com", // 根据实际API调整
    ],
    frameSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'", "https:", "data:"],
    childSrc: ["'self'"],
    frameAncestors: ["'self'"],
    formAction: ["'self'"],
    baseUri: ["'self'"],
    upgradeInsecureRequests: [],
  },
};

/**
 * 生产环境CSP配置 - 严格的安全策略
 */
const productionCSP = {
  directives: {
    defaultSrc: ["'self'"],
    // 生产环境移除unsafe-inline，使用nonce或hash
    styleSrc: [
      "'self'",
      "https://fonts.googleapis.com",
      "https://cdnjs.cloudflare.com",
      // 可以添加特定样式的hash值，例如：
      // "'sha256-HASH_VALUE_HERE'"
    ],
    scriptSrc: [
      "'self'",
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      // 可以添加特定脚本的hash值，例如：
      // "'sha256-HASH_VALUE_HERE'"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "https://images.example.com", // 指定图片CDN域名
      "https://*.googleapis.com", // Google服务图片
      "blob:",
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdnjs.cloudflare.com",
      "data:",
    ],
    connectSrc: [
      "'self'",
      "https://*.google-analytics.com",
      "https://api.production-domain.com", // 替换为实际的生产API域名
    ],
    frameSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'", "https://media.example.com"], // 指定媒体文件域名
    childSrc: ["'self'"],
    frameAncestors: ["'none'"], // 防止页面被嵌入iframe
    formAction: ["'self'"],
    baseUri: ["'self'"],
    upgradeInsecureRequests: [],
    // 额外的安全指令
    manifestSrc: ["'self'"],
    workerSrc: ["'self'"],
  },
};

/**
 * 测试环境CSP配置
 */
const testCSP = {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    imgSrc: ["'self'", "data:", "https:", "http:"],
    fontSrc: ["'self'", "data:"],
    connectSrc: ["'self'"],
    frameSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
};

/**
 * 基础Helmet配置
 */
const baseHelmetConfig = {
  // 跨源嵌入器策略 - 根据需要启用
  crossOriginEmbedderPolicy: false,

  // 跨源开放器策略
  crossOriginOpenerPolicy: { policy: "same-origin" },

  // 跨源资源策略
  crossOriginResourcePolicy: { policy: "cross-origin" },

  // DNS预取控制
  dnsPrefetchControl: { allow: false },

  // 强制HTTPS
  hsts: {
    maxAge: 31536000, // 1年
    includeSubDomains: true,
    preload: true,
  },

  // IE不兼容模式
  ieNoOpen: true,

  // 禁用X-Powered-By头
  hidePoweredBy: true,

  // MIME类型嗅探保护
  noSniff: true,

  // 推荐人策略
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },

  // XSS过滤器
  xssFilter: true,
};

/**
 * 获取环境相关的CSP配置
 * @param {string} environment - 环境名称 (development|production|test)
 * @param {string} nonce - 可选的nonce值
 * @returns {object} CSP配置对象
 */
export const getCSPConfig = (environment = "development", nonce = null) => {
  let cspConfig;

  switch (environment) {
    case "production":
      cspConfig = { ...productionCSP };
      break;
    case "test":
      cspConfig = { ...testCSP };
      break;
    case "development":
    default:
      cspConfig = { ...developmentCSP };
      break;
  }

  // 如果提供了nonce，添加到script和style源
  if (nonce && environment === "production") {
    cspConfig.directives.scriptSrc.push(`'nonce-${nonce}'`);
    cspConfig.directives.styleSrc.push(`'nonce-${nonce}'`);
  }

  return cspConfig;
};

/**
 * 获取完整的Helmet配置
 * @param {string} environment - 环境名称
 * @param {object} options - 额外配置选项
 * @returns {object} 完整的Helmet配置
 */
export const getHelmetConfig = (environment = "development", options = {}) => {
  const { nonce, customCSP } = options;

  return {
    ...baseHelmetConfig,
    contentSecurityPolicy: customCSP || getCSPConfig(environment, nonce),
    // 在开发环境中可能需要禁用某些安全头
    ...(environment === "development" && {
      hsts: false, // 开发环境通常不使用HTTPS
    }),
  };
};

/**
 * CSP违规报告处理器
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 */
export const cspViolationHandler = (req, res) => {
  // 使用结构化日志记录CSP违规
  import("../utils/logger.js")
    .then(({ logCSPViolation }) => {
      logCSPViolation(req.body, {
        userAgent: req.get("User-Agent"),
        ip: req.ip,
        referer: req.get("Referer"),
        origin: req.get("Origin"),
      });
    })
    .catch(() => {
      // 降级到console输出
      console.warn("CSP Violation Report:", {
        timestamp: new Date().toISOString(),
        userAgent: req.get("User-Agent"),
        violation: req.body,
        ip: req.ip,
      });
    });

  res.status(204).end();
};

/**
 * 中间件：为每个请求生成新的nonce
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 * @param {function} next - Express next函数
 */
export const nonceMiddleware = (req, res, next) => {
  res.locals.nonce = generateNonce();
  next();
};

export default {
  getHelmetConfig,
  getCSPConfig,
  generateNonce,
  cspViolationHandler,
  nonceMiddleware,
};
