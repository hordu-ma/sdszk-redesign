import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001", // 更改为新端口
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // 允许跨域携带 cookie
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 根据响应类型处理不同的数据
    // 如果是 JSON 数据，返回 data 属性
    const contentType = response.headers["content-type"];
    if (contentType && contentType.includes("application/json")) {
      return response.data;
    }
    // 如果是图片等二进制数据，直接返回响应
    return response.data;
  },
  (error) => {
    console.error("API请求错误:", error);

    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，清除 token 并跳转到登录页面
          localStorage.removeItem("token");
          window.location.href = "/admin/login";
          break;
        case 403:
          // 权限不足
          console.error("没有权限访问该资源");
          break;
        case 500:
          // 服务器错误
          console.error("服务器错误");
          break;
        default:
          console.error(error.response.data?.message || "请求失败");
      }
    }
    return Promise.reject(error);
  }
);

export const uploadConfig = {
  uploadUrl: import.meta.env.VITE_UPLOAD_URL,
  assetsUrl: import.meta.env.VITE_ASSETS_URL,
};

export default api;
