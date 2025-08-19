/**
 * 结构化日志工具模块
 * 使用 pino 库提供高性能、结构化的日志记录功能
 */

import pino from 'pino';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 日志配置
const loggerConfig = {
  // 基础配置
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // 生产环境配置
  ...(process.env.NODE_ENV === 'production'
    ? {
      // 生产环境：JSON 格式，便于日志聚合工具解析
      serializers: pino.stdSerializers,
    }
    : {
      // 开发环境：美化输出，便于阅读
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      },
    }
  ),

  // 基础字段
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'localhost',
    service: 'sdszk-server',
    version: process.env.npm_package_version || '1.0.0',
  },

  // 时间戳配置
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,

  // 格式化器
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
};

// 创建主日志器
const logger = pino(loggerConfig);

/**
 * 创建子日志器
 * @param {string} module - 模块名称
 * @param {Object} context - 额外的上下文信息
 * @returns {Object} 子日志器实例
 */
export const createLogger = (module, context = {}) => {
  return logger.child({
    module,
    ...context,
  });
};

/**
 * 数据库操作日志器
 */
export const dbLogger = createLogger('database');

/**
 * 认证相关日志器
 */
export const authLogger = createLogger('auth');

/**
 * API 请求日志器
 */
export const apiLogger = createLogger('api');

/**
 * 系统日志器
 */
export const sysLogger = createLogger('system');

/**
 * 错误日志器
 */
export const errorLogger = createLogger('error');

/**
 * 性能日志器
 */
export const perfLogger = createLogger('performance');

/**
 * 审计日志器
 */
export const auditLogger = createLogger('audit');

/**
 * 安全日志器
 */
export const securityLogger = createLogger('security');

/**
 * 记录 HTTP 请求日志
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {number} duration - 请求处理时间（毫秒）
 */
export const logHttpRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode: res.statusCode,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    duration: `${duration}ms`,
    size: res.get('Content-Length') || 0,
  };

  // 添加用户信息（如果已认证）
  if (req.user) {
    logData.userId = req.user.id;
    logData.username = req.user.username;
  }

  // 根据状态码决定日志级别
  if (res.statusCode >= 500) {
    apiLogger.error(logData, 'HTTP request failed');
  } else if (res.statusCode >= 400) {
    apiLogger.warn(logData, 'HTTP request warning');
  } else {
    apiLogger.info(logData, 'HTTP request completed');
  }
};

/**
 * 记录数据库操作日志
 * @param {string} operation - 操作类型（create, read, update, delete）
 * @param {string} collection - 集合/表名
 * @param {Object} context - 操作上下文
 * @param {number} duration - 操作耗时（毫秒）
 */
export const logDbOperation = (operation, collection, context = {}, duration) => {
  dbLogger.info({
    operation,
    collection,
    duration: duration ? `${duration}ms` : undefined,
    ...context,
  }, `Database ${operation} operation on ${collection}`);
};

/**
 * 记录认证事件
 * @param {string} event - 事件类型（login, logout, register, etc.）
 * @param {Object} context - 事件上下文
 */
export const logAuthEvent = (event, context = {}) => {
  authLogger.info({
    event,
    timestamp: new Date().toISOString(),
    ...context,
  }, `Authentication event: ${event}`);
};

/**
 * 记录错误日志
 * @param {Error} error - 错误对象
 * @param {Object} context - 错误上下文
 */
export const logError = (error, context = {}) => {
  errorLogger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
    },
    ...context,
  }, `Error occurred: ${error.message}`);
};

/**
 * 记录性能指标
 * @param {string} metric - 指标名称
 * @param {number} value - 指标值
 * @param {string} unit - 单位
 * @param {Object} context - 额外上下文
 */
export const logPerformance = (metric, value, unit = 'ms', context = {}) => {
  perfLogger.info({
    metric,
    value,
    unit,
    ...context,
  }, `Performance metric: ${metric} = ${value}${unit}`);
};

/**
 * 记录审计日志
 * @param {string} action - 操作动作
 * @param {Object} context - 操作上下文
 */
export const logAudit = (action, context = {}) => {
  auditLogger.info({
    action,
    timestamp: new Date().toISOString(),
    ...context,
  }, `Audit: ${action}`);
};

/**
 * 系统启动日志
 * @param {Object} config - 系统配置信息
 */
export const logSystemStart = (config = {}) => {
  sysLogger.info({
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV,
    ...config,
  }, 'System started successfully');
};

/**
 * 系统关闭日志
 * @param {string} reason - 关闭原因
 */
export const logSystemShutdown = (reason = 'normal') => {
  sysLogger.info({
    reason,
    uptime: process.uptime(),
  }, 'System shutting down');
};

/**
 * 记录缓存操作
 * @param {string} operation - 操作类型（hit, miss, set, del）
 * @param {string} key - 缓存键
 * @param {Object} context - 额外上下文
 */
export const logCacheOperation = (operation, key, context = {}) => {
  const cacheLogger = createLogger('cache');
  cacheLogger.debug({
    operation,
    key,
    ...context,
  }, `Cache ${operation}: ${key}`);
};

/**
 * 记录CSP违规报告
 * @param {Object} violationReport - CSP违规报告
 * @param {Object} context - 请求上下文（用户代理、IP等）
 */
export const logCSPViolation = (violationReport, context = {}) => {
  securityLogger.warn({
    type: 'csp_violation',
    violation: violationReport,
    timestamp: new Date().toISOString(),
    ...context,
  }, 'Content Security Policy violation detected');
};

/**
 * 记录安全事件
 * @param {string} eventType - 事件类型（brute_force, suspicious_activity, etc.）
 * @param {Object} context - 事件上下文
 */
export const logSecurityEvent = (eventType, context = {}) => {
  securityLogger.warn({
    type: 'security_event',
    eventType,
    timestamp: new Date().toISOString(),
    ...context,
  }, `Security event detected: ${eventType}`);
};

/**
 * 记录安全策略变更
 * @param {string} policy - 策略名称（csp, cors, helmet等）
 * @param {Object} changes - 变更内容
 * @param {Object} context - 变更上下文
 */
export const logSecurityPolicyChange = (policy, changes, context = {}) => {
  securityLogger.info({
    type: 'policy_change',
    policy,
    changes,
    timestamp: new Date().toISOString(),
    ...context,
  }, `Security policy updated: ${policy}`);
};

/**
 * 记录认证失败事件
 * @param {string} reason - 失败原因
 * @param {Object} context - 认证上下文
 */
export const logAuthFailure = (reason, context = {}) => {
  securityLogger.warn({
    type: 'auth_failure',
    reason,
    timestamp: new Date().toISOString(),
    ...context,
  }, `Authentication failed: ${reason}`);
};

// 导出主日志器作为默认导出
export default logger;

// 兼容性：为了方便迁移，提供类似 console 的接口
export const log = {
  debug: (message, meta = {}) => logger.debug(meta, message),
  info: (message, meta = {}) => logger.info(meta, message),
  warn: (message, meta = {}) => logger.warn(meta, message),
  error: (message, meta = {}) => logger.error(meta, message),
  fatal: (message, meta = {}) => logger.fatal(meta, message),
};
