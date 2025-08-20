/**
 * CORS 配置模块
 * 根据环境提供不同级别的安全策略
 */

import { sysLogger } from '../utils/logger.js';

/**
 * 获取生产环境允许的域名列表
 * @returns {string[]} 生产环境域名白名单
 */
const getProductionOrigins = () => {
  const origins = [
    "https://hordu-ma.github.io", // GitHub Pages域名
    "https://horsduroot.com", // 主域名
    "https://www.horsduroot.com", // 带www的域名
  ];

  // 从环境变量中添加额外的生产域名
  if (process.env.FRONTEND_URL) {
    const envOrigins = process.env.FRONTEND_URL
      .split(",")
      .map((url) => url.trim())
      .filter(url => url.startsWith('https://'));

    origins.push(...envOrigins);
  }

  // 添加其他生产环境域名
  if (process.env.PRODUCTION_DOMAINS) {
    const prodDomains = process.env.PRODUCTION_DOMAINS
      .split(",")
      .map((url) => url.trim())
      .filter(url => url.startsWith('https://'));

    origins.push(...prodDomains);
  }

  return [...new Set(origins)]; // 去重
};

/**
 * 获取开发环境允许的域名列表
 * @returns {string[]} 开发环境域名白名单
 */
const getDevelopmentOrigins = () => {
  const developmentPorts = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:5178",
    "http://localhost:5179",
    "http://localhost:5180",
    "http://localhost:5181",
    "http://localhost:5182",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5176",
    "http://127.0.0.1:3000",
  ];

  // 从环境变量添加额外的开发端口
  if (process.env.DEV_PORTS) {
    const devPorts = process.env.DEV_PORTS
      .split(",")
      .map((port) => {
        const trimmed = port.trim();
        return trimmed.startsWith('http') ? trimmed : `http://localhost:${trimmed}`;
      });

    developmentPorts.push(...devPorts);
  }

  return [
    ...getProductionOrigins(), // 开发环境也支持生产域名
    ...developmentPorts,
  ];
};

/**
 * CORS origin 检查函数
 * @param {string} origin - 请求来源
 * @param {Function} callback - 回调函数
 */
const corsOriginHandler = (origin, callback) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = isProduction ? getProductionOrigins() : getDevelopmentOrigins();

  // 处理无 origin 的请求
  if (!origin) {
    // 生产环境也允许无origin请求（支持nginx代理、curl、健康检查等）
    sysLogger.debug({
      origin: 'undefined',
      environment: isProduction ? 'production' : 'development',
      note: 'Allowing request without origin header (nginx proxy, health checks, etc.)'
    }, 'CORS: 允许无origin请求');
    return callback(null, true);
  }

  // 检查origin是否在白名单中
  if (allowedOrigins.includes(origin)) {
    sysLogger.debug({ origin, environment: isProduction ? 'production' : 'development' }, 'CORS: 允许的origin');
    return callback(null, true);
  }

  // 记录被拒绝的请求
  sysLogger.warn({
    rejectedOrigin: origin,
    allowedOriginsCount: allowedOrigins.length,
    environment: isProduction ? 'production' : 'development',
    security: true
  }, 'CORS: 拒绝未授权的origin');

  callback(new Error(`Not allowed by CORS - Origin ${origin} not in whitelist`));
};

/**
 * 获取 CORS 配置
 * @returns {Object} CORS 配置对象
 */
export const getCorsConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  const config = {
    origin: corsOriginHandler,
    credentials: true,
    methods: isProduction
      ? ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
      : ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Requested-With",
      "Accept",
      "Origin",
      ...(isProduction ? [] : ["X-Debug-Mode", "X-Development-Mode"])
    ],
    exposedHeaders: [
      "set-cookie",
      "Set-Cookie",
      ...(isProduction ? [] : ["X-Total-Count", "X-Debug-Info"])
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    // 生产环境缓存预检请求24小时，开发环境1小时
    maxAge: isProduction ? 86400 : 3600,
  };

  // 记录 CORS 配置信息
  sysLogger.info({
    environment: isProduction ? 'production' : 'development',
    allowedOriginsCount: isProduction ? getProductionOrigins().length : getDevelopmentOrigins().length,
    maxAge: config.maxAge,
    credentialsEnabled: config.credentials
  }, 'CORS configuration loaded');

  return config;
};

/**
 * 验证 CORS 配置
 * @returns {boolean} 配置是否有效
 */
export const validateCorsConfig = () => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const origins = isProduction ? getProductionOrigins() : getDevelopmentOrigins();

    if (origins.length === 0) {
      sysLogger.error('CORS: 没有配置任何允许的域名');
      return false;
    }

    // 检查生产环境是否只有 HTTPS 域名
    if (isProduction) {
      const insecureOrigins = origins.filter(origin => !origin.startsWith('https://'));
      if (insecureOrigins.length > 0) {
        sysLogger.warn({
          insecureOrigins,
          environment: 'production'
        }, 'CORS: 生产环境发现非HTTPS域名');
      }
    }

    sysLogger.info({
      environment: isProduction ? 'production' : 'development',
      totalOrigins: origins.length,
      httpsOrigins: origins.filter(o => o.startsWith('https://')).length,
      httpOrigins: origins.filter(o => o.startsWith('http://')).length
    }, 'CORS configuration validated');

    return true;
  } catch (error) {
    sysLogger.error({ error: error.message }, 'CORS: 配置验证失败');
    return false;
  }
};

/**
 * 获取当前环境的域名列表（用于调试）
 * @returns {string[]} 当前环境允许的域名列表
 */
export const getAllowedOrigins = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? getProductionOrigins() : getDevelopmentOrigins();
};

export default {
  getCorsConfig,
  validateCorsConfig,
  getAllowedOrigins,
  corsOriginHandler
};
