import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "../utils/api";
import { debounce } from "../utils/debounce";

export interface UserInfo {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role: "admin" | "editor" | "user";
  permissions: string[];
  status?: "active" | "inactive" | "banned";
  createdAt?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  loginCount?: number;
}

interface LoginPayload {
  username: string;
  password: string;
  remember?: boolean;
}

interface RegisterPayload {
  username: string;
  password: string;
  email: string;
  phone: string;
  verificationCode: string;
}

export const useUserStore = defineStore(
  "user",
  () => {
    const token = ref<string | null>(null);
    const userInfo = ref<UserInfo | null>(null);
    const loading = ref(false);
    const initInProgress = ref(false); // 添加标记，避免重复初始化

    // 计算属性
    const isAuthenticated = computed(() => !!token.value);
    const isAdmin = computed(() => userInfo.value?.role === "admin");
    const isEditor = computed(
      () => userInfo.value?.role === "editor" || isAdmin.value
    );
    const userPermissions = computed(() => userInfo.value?.permissions || []);

    // 设置token
    function setToken(newToken: string) {
      token.value = newToken;
    }

    // 设置用户信息
    function setUserInfo(user: UserInfo) {
      userInfo.value = user;
    }

    // 权限转换函数：将后端嵌套对象格式转换为前端字符串数组格式
    function transformPermissions(backendPermissions: any): string[] {
      const permissions: string[] = [];

      if (!backendPermissions || typeof backendPermissions !== "object") {
        return permissions;
      }

      // 遍历权限对象，将嵌套结构转换为字符串数组
      try {
        for (const [module, actions] of Object.entries(backendPermissions)) {
          if (actions && typeof actions === "object") {
            for (const [action, hasPermission] of Object.entries(
              actions as Record<string, boolean>
            )) {
              if (hasPermission === true) {
                const permissionKey = `${module}:${action}`;
                permissions.push(permissionKey);

                // 如果有特定资源权限，也加入相应的操作权限
                if (action === "manage") {
                  permissions.push(`${module}:read`);
                  permissions.push(`${module}:create`);
                  permissions.push(`${module}:update`);
                  permissions.push(`${module}:delete`);
                }

                // 特殊处理 settings 模块权限，确保 settings:read 和 settings:update 匹配路由中的要求
                if (module === "settings" && action === "update") {
                  permissions.push("system:setting");
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("权限转换失败:", error);
        return [];
      }

      // 去重并返回权限数组
      return Array.from(new Set(permissions));
    }

    // 登录方法
    async function login(payload: LoginPayload): Promise<boolean> {
      try {
        loading.value = true;
        const response = await api.post("/auth/login", payload);

        // 确保检查response.data是对象且有status属性
        if (
          typeof response.data === "object" &&
          response.data !== null &&
          response.data.status === "success"
        ) {
          const authToken = response.data.token;
          const userData = response.data.data?.user; // 获取用户数据

          if (authToken && userData) {
            token.value = authToken;

            // 转换权限格式
            const transformedPermissions = transformPermissions(
              userData.permissions
            );
            const userWithTransformedPermissions = {
              ...userData,
              permissions: transformedPermissions,
            };

            userInfo.value = userWithTransformedPermissions;

            // 如果选择记住登录状态，保存token
            if (payload.remember) {
              localStorage.setItem("token", authToken);
            }

            // 设置全局请求头
            api.defaults.headers.common["Authorization"] =
              `Bearer ${authToken}`;

            return true;
          }
        }

        // 登录失败时抛出错误
        throw new Error(
          response.data.message || "登录失败，请检查用户名和密码"
        );
      } catch (error: any) {
        console.error("登录错误:", error);
        // 重新抛出错误，让组件能够捕获
        throw new Error(
          error.response?.data?.message ||
            error.message ||
            "登录失败，请检查网络连接"
        );
      } finally {
        loading.value = false;
      }
    }

    // 登出方法
    async function logout(): Promise<void> {
      try {
        // 调用后端登出接口
        await api.post("/auth/logout");
      } catch (error) {
        // 即使后端登出失败，也要清除前端状态
        console.error("后端登出错误:", error);
      } finally {
        // 清除所有认证相关状态
        token.value = null;
        userInfo.value = null;
        localStorage.removeItem("token");

        // 清除全局请求头中的Authorization
        delete api.defaults.headers.common["Authorization"];
      }
    }

    // 注册方法
    async function register(payload: RegisterPayload): Promise<boolean> {
      try {
        loading.value = true;
        const response = await api.post("/auth/register", payload);

        if (response.data?.status === "success") {
          return true;
        }
        return false;
      } catch (error) {
        console.error("注册失败:", error);
        throw error;
      } finally {
        loading.value = false;
      }
    }

    // 发送验证码
    async function sendVerificationCode(phone: string): Promise<boolean> {
      try {
        const response = await api.post("/auth/send-code", { phone });
        return response.data?.status === "success";
      } catch (error) {
        console.error("发送验证码失败:", error);
        throw error;
      }
    }

    // 检查权限
    function hasPermission(permission: string): boolean {
      // 如果是管理员，始终有权限
      if (userInfo.value?.role === "admin") {
        return true;
      }
      return userPermissions.value.includes(permission);
    }

    // 初始化用户信息
    // 防抖版本的用户信息初始化
    const debouncedUserInfoInit = debounce(async () => {
      if (initInProgress.value) return; // 避免并发调用

      const savedToken = localStorage.getItem("token");
      if (!savedToken) return;

      try {
        initInProgress.value = true;
        token.value = savedToken;
        // 设置全局请求头
        api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;

        const { data } = await api.get("/auth/me");
        if (data.status === "success") {
          const userData = data.data.user;

          // 转换权限格式
          const transformedPermissions = transformPermissions(
            userData.permissions
          );
          const userWithTransformedPermissions = {
            ...userData,
            permissions: transformedPermissions,
          };

          userInfo.value = userWithTransformedPermissions;
        } else {
          throw new Error("获取用户信息失败");
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
        await logout();
      } finally {
        initInProgress.value = false;
      }
    }, 500); // 500ms的防抖延迟

    async function initUserInfo(): Promise<void> {
      await debouncedUserInfoInit();
    }

    return {
      token,
      userInfo,
      loading,
      isAuthenticated,
      isAdmin,
      isEditor,
      userPermissions,
      login,
      logout,
      register,
      sendVerificationCode,
      setUserInfo,
      setToken,
      hasPermission,
      initUserInfo,
      transformPermissions,
    };
  },
  {
    persist: true,
  }
);
