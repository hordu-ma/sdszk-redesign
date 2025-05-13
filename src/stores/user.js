// user.js - 用户状态管理
import { defineStore } from "pinia";
import api from "@/utils/api";
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
    async login(credentials) {
      try {
        const response = await api.post("/api/auth/login", credentials);
        const { token, user, expiresIn } = response;

        // 设置token和用户信息
        this.setToken(token);
        this.setUserInfo(user);
        this.setLoginExpiration(expiresIn);

        return true;
      } catch (error) {
        console.error("登录失败:", error);
        throw error;
      }
    },

    async logout() {
      try {
        await api.post("/api/auth/logout");
      } catch (error) {
        console.error("登出请求失败:", error);
      } finally {
        this.clearUserData();
        router.push("/admin/login");
      }
    },

    async fetchUserInfo() {
      try {
        const response = await api.get("/api/users/profile");
        this.setUserInfo(response.data);
        return response.data;
      } catch (error) {
        console.error("获取用户信息失败:", error);
        throw error;
      }
    },

    async updateProfile(userData) {
      try {
        const response = await api.put("/api/users/profile", userData);
        this.setUserInfo(response.data);
        return response.data;
      } catch (error) {
        console.error("更新用户信息失败:", error);
        throw error;
      }
    },

    setToken(token) {
      this.token = token;
      localStorage.setItem("admin_token", token);
    },

    setUserInfo(userInfo) {
      this.userInfo = userInfo;
      localStorage.setItem("admin_user_info", JSON.stringify(userInfo));
    },

    setLoginExpiration(expiresIn) {
      const expirationTime = new Date().getTime() + expiresIn * 1000;
      this.loginExpiration = expirationTime;
      localStorage.setItem("admin_login_expiration", expirationTime);
    },

    clearUserData() {
      this.token = "";
      this.userInfo = null;
      this.loginExpiration = null;
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user_info");
      localStorage.removeItem("admin_login_expiration");
    },

    // 权限检查
    checkPermission(permission) {
      if (!this.userInfo || !this.userInfo.permissions) {
        return false;
      }
      return this.userInfo.permissions.includes(permission);
    },
  },
});
