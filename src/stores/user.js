// user.js - 用户状态管理
import { defineStore } from "pinia";
import axios from "axios";
import router from "../router";

export const useUserStore = defineStore("user", {
  state: () => ({
    token: localStorage.getItem("admin_token") || "",
    userInfo: JSON.parse(localStorage.getItem("admin_user_info") || "null"),
    loginExpiration: localStorage.getItem("admin_login_expiration") || null,
  }),

  getters: {
    isLoggedIn: (state) => {
      // 检查token是否存在
      if (!state.token || !state.userInfo) {
        return false;
      }

      // 检查登录是否过期
      if (state.loginExpiration) {
        const now = new Date().getTime();
        if (now > parseInt(state.loginExpiration)) {
          return false;
        }
      }

      return true;
    },

    userRole: (state) => {
      return state.userInfo?.role || "viewer";
    },

    isAdmin: (state) => {
      return state.userInfo?.role === "admin";
    },

    isEditor: (state) => {
      return ["admin", "editor"].includes(state.userInfo?.role);
    },

    authHeaders: (state) => {
      return {
        Authorization: `Bearer ${state.token}`,
      };
    },
  },

  actions: {
    /**
     * 登录
     * @param {Object} credentials - 登录凭证
     * @param {string} credentials.username - 用户名
     * @param {string} credentials.password - 密码
     * @param {string} credentials.captcha - 验证码
     * @param {boolean} credentials.remember - 是否记住登录状态
     * @returns {Promise<boolean>} 登录成功返回true，否则返回false
     */
    async login(credentials) {
      try {
        const response = await axios.post("/api/auth/login", credentials);

        const { token, user, expiresIn } = response.data;

        if (!token || !user) {
          throw new Error("登录失败，服务器返回数据异常");
        }

        // 计算过期时间
        const expirationTime =
          new Date().getTime() + (expiresIn || 24 * 60 * 60 * 1000);

        // 存储认证信息
        this.token = token;
        this.userInfo = user;
        this.loginExpiration = expirationTime.toString();

        // 本地存储
        localStorage.setItem("admin_token", token);
        localStorage.setItem("admin_user_info", JSON.stringify(user));
        localStorage.setItem(
          "admin_login_expiration",
          expirationTime.toString()
        );

        // 记住用户名
        if (credentials.remember) {
          localStorage.setItem("admin_username", credentials.username);
        } else {
          localStorage.removeItem("admin_username");
        }

        // 配置axios默认请求头，添加token
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        return true;
      } catch (error) {
        console.error("登录失败:", error);

        // 清除认证信息
        this.logout();

        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(errorMessage);
      }
    },

    /**
     * 注销登录
     */
    async logout() {
      try {
        // 调用登出API
        if (this.isLoggedIn) {
          await axios.post("/api/auth/logout");
        }
      } catch (error) {
        console.error("注销API调用失败:", error);
      } finally {
        // 清除状态
        this.token = "";
        this.userInfo = null;
        this.loginExpiration = null;

        // 清除本地存储
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user_info");
        localStorage.removeItem("admin_login_expiration");

        // 清除请求头
        delete axios.defaults.headers.common["Authorization"];

        // 跳转到登录页
        router.push({ name: "AdminLogin" });
      }
    },

    /**
     * 刷新用户信息
     */
    async refreshUserInfo() {
      try {
        if (!this.isLoggedIn) {
          return false;
        }

        const response = await axios.get("/api/users/me");
        const userData = response.data.data;

        if (userData) {
          this.userInfo = userData;
          localStorage.setItem("admin_user_info", JSON.stringify(userData));
          return true;
        }

        return false;
      } catch (error) {
        console.error("更新用户信息失败:", error);

        // 如果是未授权错误，则登出
        if (error.response?.status === 401) {
          this.logout();
        }

        return false;
      }
    },

    /**
     * 验证当前会话
     */
    async validateSession() {
      try {
        if (!this.isLoggedIn) {
          return false;
        }

        const response = await axios.get("/api/auth/validate");
        return response.data.valid === true;
      } catch (error) {
        console.error("会话验证失败:", error);

        // 如果是未授权错误，则登出
        if (error.response?.status === 401) {
          this.logout();
        }

        return false;
      }
    },

    /**
     * 更新用户密码
     */
    async updatePassword({ currentPassword, newPassword }) {
      try {
        const response = await axios.post("/api/users/password", {
          currentPassword,
          newPassword,
        });

        return response.data.success === true;
      } catch (error) {
        console.error("密码更新失败:", error);
        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(errorMessage);
      }
    },
  },
});

// axios拦截器配置
export const setupAxiosInterceptors = (store) => {
  axios.interceptors.request.use(
    (config) => {
      // 如果已登录，添加token到请求头
      if (store.isLoggedIn) {
        config.headers.Authorization = `Bearer ${store.token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // 处理401未授权错误
      if (error.response?.status === 401) {
        store.logout();
      }
      return Promise.reject(error);
    }
  );
};
