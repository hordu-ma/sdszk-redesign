// api.github-pages.ts - GitHub Pages专用的API配置
import axios from "axios";
import { setupInterceptors } from "./interceptors";
import { API_CONFIG, ERROR_CONFIG } from "@/config";

// 检查API URL是否指向阿里云服务器（而不是CORS代理）
const isDirectApiUrl =
  API_CONFIG.baseURL &&
  !API_CONFIG.baseURL.includes("allorigins.win") &&
  !API_CONFIG.baseURL.includes("corsproxy.io") &&
  !API_CONFIG.baseURL.includes("cors.sh") &&
  !API_CONFIG.baseURL.includes("yacdn.org");

// 创建axios实例 - GitHub Pages专用版本
const api = axios.create({
  baseURL: API_CONFIG.baseURL || "",
  timeout: API_CONFIG.timeout * 2, // 增加超时时间，代理可能需要更长响应时间
  headers: {
    "Content-Type": "application/json",
    // 添加额外的头信息以帮助CORS代理
    "X-Requested-With": "XMLHttpRequest",
  },
  // 关键设置：如果直接连接阿里云API且已配置CORS，可以启用凭证
  withCredentials: isDirectApiUrl,
});

// 自定义错误处理拦截器
api.interceptors.response.use(
  (response) => {
    console.log("✅ GitHub Pages API响应成功:", response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ GitHub Pages API错误:", {
      url: error?.config?.url,
      status: error?.response?.status,
      message: error?.message,
      data: error?.response?.data,
    });

    // 返回一个友好的错误消息
    const errorMessage = isDirectApiUrl
      ? "API请求失败。请检查阿里云服务器是否正常运行，以及CORS配置是否正确。"
      : "API请求失败。可能是CORS代理服务暂时不可用，请稍后再试。";

    return Promise.reject({
      ...error,
      friendlyMessage: errorMessage,
    });
  }
);

// 添加常规拦截器
setupInterceptors(api);

// 调试日志
console.log("🌍 GitHub Pages API Configuration:");
console.log(`📡 baseURL: ${API_CONFIG.baseURL}`);
console.log(`⏱️ timeout: ${API_CONFIG.timeout * 2}ms`);
console.log(`🔒 withCredentials: ${isDirectApiUrl}`);
console.log(
  `🔌 连接模式: ${isDirectApiUrl ? "直接连接阿里云API" : "CORS代理模式"}`
);

export default api;
