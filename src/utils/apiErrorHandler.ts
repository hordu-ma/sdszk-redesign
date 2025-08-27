import type { AxiosError } from "axios";
import router from "@/router";
import { message, notification } from "ant-design-vue";
import { useUserStore } from "@/stores/user";
import { ERROR_CODES, STATUS_CODES } from "@/config";
import type {
  ApiErrorResponse,
  ErrorHandlerOptions,
} from "@/types/error.types";

// 自定义 API 错误类
export class ApiError extends Error {
  code: string;
  status: number;
  errors?: Record<string, string[]>;
  details?: unknown;
  timestamp: string;
  path?: string;

  constructor(
    message: string,
    code: string,
    status: number,
    options?: {
      errors?: Record<string, string[]>;
      details?: unknown;
      timestamp?: string;
      path?: string;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.errors = options?.errors;
    this.details = options?.details;
    this.timestamp = options?.timestamp || new Date().toISOString();
    this.path = options?.path;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  getFormattedMessage(): string {
    if (this.errors) {
      const errorMessages = Object.entries(this.errors)
        .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
        .join("\n");
      return `${this.message}\n${errorMessages}`;
    }
    return this.message;
  }

  is(code: string): boolean {
    return this.code === code;
  }

  isAuthError(): boolean {
    return (
      this.status === STATUS_CODES.UNAUTHORIZED ||
      this.is(ERROR_CODES.AUTH_EXPIRED) ||
      this.is(ERROR_CODES.INVALID_TOKEN)
    );
  }

  isPermissionError(): boolean {
    return (
      this.status === STATUS_CODES.FORBIDDEN ||
      this.is(ERROR_CODES.PERMISSION_DENIED)
    );
  }

  isValidationError(): boolean {
    return (
      this.status === STATUS_CODES.BAD_REQUEST ||
      this.is(ERROR_CODES.VALIDATION_ERROR)
    );
  }

  isNetworkError(): boolean {
    return this.is(ERROR_CODES.NETWORK_ERROR);
  }
}

// 保存 store 实例
let userStore: ReturnType<typeof useUserStore>;

// 初始化 store
const initStore = () => {
  if (!userStore) {
    userStore = useUserStore();
  }
  return userStore;
};

// 日志记录函数
const logError = (error: ApiError) => {
  if (import.meta.env.DEV || import.meta.env.VITE_APP_DEBUG === "true") {
    console.error(
      `API Error:
      Code: ${error.code}
      Status: ${error.status}
      Message: ${error.message}
      Path: ${error.path || "N/A"}
      Time: ${error.timestamp}
      Details: ${error.details ? JSON.stringify(error.details, null, 2) : "N/A"}
      ${error.errors ? `Validation Errors:\n${JSON.stringify(error.errors, null, 2)}` : ""}`,
    );
  }
};

// 错误通知函数
const showErrorNotification = (error: ApiError) => {
  notification.error({
    message: "请求错误",
    description: error.getFormattedMessage(),
    duration: 5,
  });
};

// 处理验证错误
const handleValidationError = (error: ApiError) => {
  if (error.errors) {
    Object.values(error.errors).forEach((errors: string[]) => {
      errors.forEach((errorMessage) => message.error(errorMessage));
    });
  } else {
    message.error(error.message);
  }
};

// 处理认证错误
const handleAuthError = async (error: ApiError) => {
  const store = initStore();

  // 检查是否真的需要登出 - 避免误报
  if (store.isAuthenticated) {
    // 如果用户实际已登录，可能是临时的网络问题或token同步问题
    console.warn("检测到认证错误，但用户状态显示已登录，尝试刷新认证状态");

    // 尝试重新初始化用户信息
    try {
      await store.initUserInfo();
      // 如果重新初始化成功，显示警告而不是强制登出
      message.warning("认证状态已刷新，请重试操作");
      return;
    } catch (refreshError) {
      console.error("认证状态刷新失败:", refreshError);
    }
  }

  // 只有在真正需要时才登出
  await store.logout();
  message.error(error.message || "登录已过期，请重新登录");
  router.push("/admin/login");
};

// 处理权限错误
const handlePermissionError = (error: ApiError) => {
  message.error(error.message || "您没有权限执行此操作");
  router.push("/admin/403");
};

// 主要的错误处理函数
export const handleApiError = async (
  error: AxiosError<ApiErrorResponse>,
  options: ErrorHandlerOptions = {},
): Promise<never> => {
  const {
    showNotification = true,
    redirectOnAuth = true,
    logError: enableLogging = true,
  } = options;

  // 处理响应错误
  if (error.response) {
    const { status, data } = error.response;

    // 构造 API 错误对象
    const apiError = new ApiError(
      data?.message || "请求失败",
      data?.code || ERROR_CODES.SERVER_ERROR,
      status,
      {
        errors: data?.errors,
        details: data?.details,
        timestamp: data?.timestamp || new Date().toISOString(),
        path: error.config?.url,
      },
    );

    // 记录错误日志
    if (enableLogging) {
      logError(apiError);
    }

    // 根据错误类型处理
    if (apiError.isAuthError() && redirectOnAuth) {
      await handleAuthError(apiError);
    } else if (apiError.isPermissionError()) {
      handlePermissionError(apiError);
    } else if (apiError.isValidationError()) {
      handleValidationError(apiError);
    } else if (showNotification) {
      // 根据状态码处理其他错误
      switch (status) {
        case STATUS_CODES.NOT_FOUND:
          message.error(apiError.message || "请求的资源不存在");
          break;
        case STATUS_CODES.TIMEOUT:
          message.error("请求超时，请稍后重试");
          break;
        case 429: // Too Many Requests
          message.error("请求过于频繁，请稍后重试");
          break;
        case STATUS_CODES.SERVER_ERROR:
          showErrorNotification(apiError);
          break;
        default:
          if (status >= 500) {
            showErrorNotification(apiError);
          } else {
            message.error(apiError.message || "操作失败，请重试");
          }
      }
    }

    return Promise.reject(apiError);
  }

  // 处理请求错误（网络问题等）
  if (error.request) {
    const networkError = new ApiError(
      "网络连接失败，请检查您的网络",
      ERROR_CODES.NETWORK_ERROR,
      0,
    );
    if (enableLogging) {
      logError(networkError);
    }
    if (showNotification) {
      message.error(networkError.message);
    }
    return Promise.reject(networkError);
  }

  // 处理其他错误
  const unknownError = new ApiError(
    "发生未知错误",
    ERROR_CODES.UNKNOWN_ERROR,
    0,
    {
      details: error,
    },
  );
  if (enableLogging) {
    logError(unknownError);
  }
  if (showNotification) {
    showErrorNotification(unknownError);
  }
  return Promise.reject(unknownError);
};

// 导出错误处理工具
export const ErrorUtils = {
  isApiError: (error: unknown): error is ApiError => error instanceof ApiError,
  createError: (
    message: string,
    code: string,
    status: number,
    options?: {
      errors?: Record<string, string[]>;
      details?: unknown;
      timestamp?: string;
      path?: string;
    },
  ): ApiError => new ApiError(message, code, status, options),
};
