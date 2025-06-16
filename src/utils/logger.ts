/**
 * 标准化日志工具
 * 开发环境：输出到控制台
 * 生产环境：发送到监控服务
 */

interface LogLevel {
  DEBUG: number;
  INFO: number;
  WARN: number;
  ERROR: number;
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  private level: number;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.level = this.isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;
  }

  private log(
    level: number,
    levelName: string,
    message: string,
    ...args: any[]
  ) {
    if (level >= this.level) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${levelName}]`;

      if (this.isDevelopment) {
        // 开发环境输出到控制台
        const logMethod =
          level >= LOG_LEVELS.ERROR
            ? console.error
            : level >= LOG_LEVELS.WARN
              ? console.warn
              : console.log;
        logMethod(prefix, message, ...args);
      } else if (level >= LOG_LEVELS.ERROR) {
        // 生产环境只记录错误，发送到监控服务
        this.sendToMonitoring(levelName, message, ...args);
      }
    }
  }

  debug(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.DEBUG, "DEBUG", message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.INFO, "INFO", message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.WARN, "WARN", message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.ERROR, "ERROR", message, ...args);
  }

  private sendToMonitoring(level: string, message: string, ...args: any[]) {
    // 集成Sentry或其他监控服务
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(
        `[${level}] ${message}`,
        level.toLowerCase() as any
      );
    }

    // 也可以发送到自定义的日志收集接口
    if (import.meta.env.VITE_LOG_ENDPOINT) {
      fetch(import.meta.env.VITE_LOG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          message,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          args,
        }),
      }).catch(() => {
        // 静默处理日志发送失败
      });
    }
  }
}

export const logger = new Logger();

// 兼容旧的console.log用法的替换建议
export const devLog = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};
