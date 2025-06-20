// api.ts - Axios API 配置
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { setupInterceptors } from "./interceptors";
import { API_CONFIG, ERROR_CONFIG } from "@/config";
import type { ApiResponse } from "@/services/api.types";

// 重试配置接口
interface RetryConfig extends AxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

// 检查是否需要重试
const shouldRetry = (error: AxiosError): boolean => {
  // 如果配置不允许重试，直接返回false
  if (!ERROR_CONFIG.enableRetry) return false;

  const config = error.config as RetryConfig;

  // 如果已经重试了最大次数，不再重试
  if (config._retryCount && config._retryCount >= ERROR_CONFIG.maxRetries) {
    return false;
  }

  // 不重试401（未认证）和403（无权限）错误
  if (error.response?.status === 401 || error.response?.status === 403) {
    return false;
  }

  // 只重试网络错误、超时和5xx错误
  return (
    !error.response ||
    error.code === "ECONNABORTED" ||
    (error.response && error.response.status >= 500)
  );
};

// 创建axios实例
const api = axios.create({
  baseURL: API_CONFIG.baseURL || (import.meta.env.DEV ? "" : "/"),
  timeout: API_CONFIG.timeout,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // 允许跨域携带 cookie
});

// 调试信息
console.log("🚀 API Configuration:");
console.log(
  "- baseURL:",
  API_CONFIG.baseURL || (import.meta.env.DEV ? "(使用代理)" : "/")
);
console.log("- timeout:", API_CONFIG.timeout);
console.log("- Environment:", import.meta.env.MODE);
console.log("- API_CONFIG:", API_CONFIG);

// 请求拦截器：添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：处理错误和重试
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig;

    if (shouldRetry(error)) {
      config._retryCount = (config._retryCount || 0) + 1;

      // 等待延迟时间
      const delayTime = ERROR_CONFIG.retryDelay * config._retryCount;
      await new Promise((resolve) => setTimeout(resolve, delayTime));

      // 重试请求
      return api(config);
    }

    return Promise.reject(error);
  }
);

// 添加响应转换器
api.interceptors.response.use((response) => {
  // 如果响应是blob类型（文件下载），直接返回
  if (response.config.responseType === "blob") {
    return response.data;
  }

  const responseData = response.data;

  // 如果响应包含status='error'且有message，则抛出错误
  if (responseData?.status === "error" && responseData?.message) {
    const error = new Error(responseData.message);
    (error as any).response = {
      status: response.status,
      data: {
        message: responseData.message,
        status: responseData.status,
        code: responseData.code || "API_ERROR",
      },
    };
    return Promise.reject(error);
  }

  // 返回原始响应数据
  return response;
});

// 设置其他拦截器
setupInterceptors(api);

export default api;
export { ApiResponse };
