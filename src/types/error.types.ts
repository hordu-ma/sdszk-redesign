// 错误响应类型
export interface ApiErrorResponse {
  message: string;
  code: string;
  status: number;
  errors?: Record<string, string[]>;
  details?: unknown;
  timestamp?: string;
  path?: string;
}

// 错误处理选项
export interface ErrorHandlerOptions {
  showNotification?: boolean;
  redirectOnAuth?: boolean;
  logError?: boolean;
}

// 错误显示配置
export interface ErrorDisplayConfig {
  title?: string;
  message: string;
  description?: string;
  type?: "error" | "warning" | "info";
  duration?: number;
}
