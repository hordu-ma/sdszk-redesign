import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
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
    return response.data;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，清除 token 并跳转到登录页面
          localStorage.removeItem("token");
          window.location.href = "/login";
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
          console.error(error.response.data.message || "请求失败");
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
