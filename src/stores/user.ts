import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "../utils/api";
import { debounce } from "../utils/debounce";
import type { BackendPermissions, PermissionList } from "../types/permissions";
import router from "@/router";
import { message } from "ant-design-vue";
import { AUTH_ENDPOINTS } from "../constants/api-endpoints";
import { userApi } from "../api/modules/user";

export interface UserInfo {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role: "admin" | "co_admin" | "editor" | "user";
  permissions: PermissionList;
  status?: "active" | "inactive" | "banned";
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  lastLogin?: string;
  lastLoginIp?: string;
  loginCount?: number;
  department?: string;
  position?: string;
  loginHistory?: Array<{
    loginTime: string;
    ip: string;
    userAgent: string;
    success: boolean;
    _id: string;
  }>;
}

interface LoginPayload {
  username: string;
  password: string;
  remember?: boolean;
}

interface RegisterPayload {
  username: string;
  fullName: string;
  password: string;
  email: string;
  phone: string;
  verificationCode: string;
}

interface LoginResponse {
  status: string;
  token: string;
  data?: {
    user: Omit<UserInfo, "permissions"> & {
      permissions: BackendPermissions | PermissionList;
    };
  };
  message?: string;
}

export const useUserStore = defineStore(
  "user",
  () => {
    const token = ref<string | null>(null);
    const userInfo = ref<UserInfo | null>(null);
    const loading = ref(false);
    const initInProgress = ref(false); // 添加标记，避免重复初始化

    // 计算属性 - 增强认证状态检查
    const isAuthenticated = computed(() => {
      // 检查token是否存在且用户信息已加载
      const hasToken = !!token.value;
      const hasUserInfo = !!userInfo.value;

      // 只要内存中有token和用户信息就认为已认证
      // localStorage token 只用于页面刷新时的状态恢复
      return hasToken && hasUserInfo;
    });
    const isAdmin = computed(() => userInfo.value?.role === "admin");
    const isEditor = computed(
      () => userInfo.value?.role === "editor" || isAdmin.value,
    );
    const canAccessAdmin = computed(() => {
      const role = userInfo.value?.role;
      return role === "admin" || role === "co_admin";
    });
    const userPermissions = computed(() => userInfo.value?.permissions || []);

    // ========== 私有辅助方法 ==========

    /**
     * 设置认证令牌
     * @private
     */
    function _setAuthToken(newToken: string | null, persist: boolean = false) {
      token.value = newToken;

      if (newToken) {
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        if (persist) {
          localStorage.setItem("token", newToken);
        }
      } else {
        delete api.defaults.headers.common["Authorization"];
        localStorage.removeItem("token");
      }
    }

    /**
     * 清除认证状态
     * @private
     */
    function _clearAuthState() {
      token.value = null;
      userInfo.value = null;
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
    }

    /**
     * 设置用户信息（内部使用）
     * @private
     */
    function _setUserData(
      userData: Omit<UserInfo, "permissions"> & {
        permissions: BackendPermissions | PermissionList;
        lastLogin?: string;
      } & Record<string, any>,
    ) {
      const transformedPermissions = Array.isArray(userData.permissions)
        ? userData.permissions
        : transformPermissions(userData.permissions);

      // 处理字段映射：lastLogin -> lastLoginAt
      const { lastLogin, ...restUserData } = userData;

      userInfo.value = {
        ...restUserData,
        permissions: transformedPermissions,
        lastLoginAt: lastLogin || userData.lastLoginAt,
      };
    }

    // ========== 权限转换 ==========

    /**
     * 权限转换函数：将后端嵌套对象格式转换为前端字符串数组格式
     */
    function transformPermissions(
      backendPermissions: BackendPermissions | any,
    ): PermissionList {
      const permissions: PermissionList = [];

      if (!backendPermissions || typeof backendPermissions !== "object") {
        return permissions;
      }

      // 遍历权限对象，将嵌套结构转换为字符串数组
      try {
        for (const [module, actions] of Object.entries(backendPermissions)) {
          if (actions && typeof actions === "object") {
            for (const [action, hasPermission] of Object.entries(
              actions as Record<string, boolean>,
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

    // ========== 登录相关方法 ==========

    /**
     * 处理登录响应
     * @private
     */
    function _processLoginResponse(
      response: LoginResponse,
      remember: boolean = false,
    ) {
      if (response.status !== "success") {
        throw new Error(response.message || "登录失败");
      }

      const authToken = response.token;
      const userData = response.data?.user;

      if (!authToken || !userData) {
        throw new Error("登录响应数据不完整");
      }

      // 设置token
      _setAuthToken(authToken, remember);

      // 设置用户信息
      _setUserData(userData);
    }

    /**
     * 执行登录请求
     * @private
     */
    async function _performLogin(
      payload: LoginPayload,
    ): Promise<LoginResponse> {
      const response = await api.post(AUTH_ENDPOINTS.LOGIN, payload);

      if (typeof response.data !== "object" || response.data === null) {
        throw new Error("登录响应格式错误");
      }

      return response.data;
    }

    /**
     * 用户登录
     */
    async function login(payload: LoginPayload): Promise<boolean> {
      try {
        loading.value = true;

        // 执行登录请求
        const response = await _performLogin(payload);

        // 处理登录响应
        _processLoginResponse(response, payload.remember);

        return true;
      } catch (error: any) {
        console.error("登录错误:", error);

        // 登录失败时清理状态
        _clearAuthState();

        // 重新抛出错误，让组件能够捕获
        throw new Error(
          error.response?.data?.message ||
            error.message ||
            "登录失败，请检查网络连接",
        );
      } finally {
        loading.value = false;
      }
    }

    /**
     * 用户登出
     */
    async function logout(): Promise<void> {
      try {
        // 调用后端登出接口
        await api.post(AUTH_ENDPOINTS.LOGOUT);
      } catch (error) {
        // 即使后端登出失败，也要清除前端状态
        console.error("后端登出错误:", error);
      } finally {
        _clearAuthState();
      }
    }

    // ========== 用户信息管理 ==========

    /**
     * 获取当前用户信息
     * @private
     */
    async function _fetchCurrentUser(): Promise<void> {
      const { data } = await api.get(AUTH_ENDPOINTS.ME);

      if (data.status !== "success") {
        throw new Error("获取用户信息失败");
      }

      const userData = data.data.user;
      _setUserData(userData);
    }

    /**
     * 稳定的认证状态检查
     */
    function isAuthenticationValid(): boolean {
      const hasToken = !!token.value;
      const hasUserInfo = !!userInfo.value;

      // 只检查内存中的状态，localStorage token 仅用于持久化
      return hasToken && hasUserInfo;
    }

    /**
     * 安全的认证状态检查 - 提供给组件使用
     */
    function checkAuthenticationSafely(): boolean {
      try {
        // 首先检查基本状态
        if (!isAuthenticationValid()) {
          // 尝试从localStorage恢复（仅在页面刷新等情况下）
          const savedToken = localStorage.getItem("token");
          if (savedToken && !token.value) {
            // 静默恢复token，但不触发用户信息获取
            token.value = savedToken;
            // 返回false，让组件知道需要等待完整初始化
            return false;
          }
          return false;
        }
        return true;
      } catch (error) {
        console.error("认证状态检查失败:", error);
        return false;
      }
    }

    /**
     * 组合函数：为组件提供完整的认证检查和处理
     * 使用方法：const { requireAuth, isReady } = userStore.useAuthGuard()
     */
    function useAuthGuard() {
      const isReady = computed(() => !initInProgress.value);

      /**
       * 要求认证的函数 - 在组件中调用
       * @param onFail 认证失败时的回调
       */
      const requireAuth = async (onFail?: () => void): Promise<boolean> => {
        try {
          // 如果正在初始化中，等待完成
          if (initInProgress.value) {
            await new Promise((resolve) => {
              const checkInterval = setInterval(() => {
                if (!initInProgress.value) {
                  clearInterval(checkInterval);
                  resolve(true);
                }
              }, 100);

              // 5秒超时
              setTimeout(() => {
                clearInterval(checkInterval);
                resolve(false);
              }, 5000);
            });
          }

          // 检查认证状态
          if (!checkAuthenticationSafely()) {
            // 尝试自动恢复（仅当内存中没有token但localStorage中有时）
            const savedToken = localStorage.getItem("token");
            if (savedToken && !token.value) {
              // 从localStorage恢复token，可能只是用户信息丢失，尝试重新获取
              try {
                await initUserInfo();
                if (isAuthenticated.value) {
                  return true;
                }
              } catch (error) {
                console.error("自动恢复用户信息失败:", error);
              }
            }

            // 认证失败，执行失败回调
            if (onFail) {
              onFail();
            } else {
              // 默认处理：显示错误并跳转登录
              message.error("请先登录");
              router.push("/admin/login");
            }
            return false;
          }

          return true;
        } catch (error) {
          console.error("认证检查异常:", error);
          if (onFail) {
            onFail();
          } else {
            message.error("认证检查失败，请重新登录");
            router.push("/admin/login");
          }
          return false;
        }
      };

      return {
        requireAuth,
        isReady,
        isAuthenticated,
      };
    }

    /**
     * 初始化用户信息（防抖版本）
     */
    const debouncedUserInfoInit = debounce(async () => {
      if (initInProgress.value) return; // 避免并发调用

      const savedToken = localStorage.getItem("token");
      if (!savedToken) return;

      try {
        initInProgress.value = true;

        // 恢复token
        _setAuthToken(savedToken, false);

        // 获取用户信息
        await _fetchCurrentUser();
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

    /**
     * 刷新用户权限
     */
    async function refreshPermissions(): Promise<boolean> {
      try {
        loading.value = true;

        // 调用后端API刷新权限
        const response = await userApi.refreshPermissions();

        if (response.success && response.data?.user) {
          // 更新用户信息，包括最新的权限
          const userData = response.data.user;
          _setUserData({
            ...userData,
            name: userData.name || userData.username,
            permissions: userData.permissions || [],
          });
          message.success("权限已刷新");
          return true;
        }

        return false;
      } catch (error: any) {
        console.error("刷新权限失败:", error);
        message.error("刷新权限失败，请重新登录");
        return false;
      } finally {
        loading.value = false;
      }
    }

    // ========== 注册相关方法 ==========

    async function register(payload: RegisterPayload): Promise<boolean> {
      try {
        loading.value = true;
        const response = await api.post(AUTH_ENDPOINTS.REGISTER, payload);

        if (response.data?.status === "success") {
          // 注册成功后自动登录
          if (response.data.token && response.data.data?.user) {
            _setAuthToken(response.data.token, true);
            _setUserData(response.data.data.user);
          }
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

    async function sendVerificationCode(phone: string): Promise<boolean> {
      try {
        const response = await api.post(AUTH_ENDPOINTS.SEND_CODE, { phone });
        if (response.data?.status === "success") {
          // 开发环境下，如果返回了验证码，在控制台显示
          if (response.data.code && process.env.NODE_ENV === "development") {
            console.log(`\n🔐 验证码: ${response.data.code}\n`);
          }
          return true;
        }
        return false;
      } catch (error: any) {
        console.error("发送验证码失败:", error);
        // 如果是频率限制错误，抛出包含等待时间的错误
        if (error.response?.status === 429) {
          const waitTime = error.response?.data?.waitTime;
          if (waitTime) {
            throw new Error(`请等待 ${waitTime} 秒后重试`);
          }
        }
        throw error;
      }
    }

    // ========== 权限检查 ==========

    function hasPermission(permission: string): boolean {
      // 如果是管理员，始终有权限
      if (userInfo.value?.role === "admin") {
        return true;
      }

      const permissions = userInfo.value?.permissions || [];

      // 支持字符串数组格式的权限检查
      if (Array.isArray(permissions)) {
        return permissions.includes(permission);
      }

      // 支持对象格式的权限检查（向后兼容）
      if (typeof permissions === "object" && permissions !== null) {
        const [module, action] = permission.split(":");
        return permissions[module]?.[action] === true;
      }

      return false;
    }

    // ========== 公开方法（保持向后兼容） ==========

    // 保留原有的公开方法以确保兼容性
    function setToken(newToken: string) {
      _setAuthToken(newToken, true);
    }

    function setUserInfo(user: UserInfo) {
      userInfo.value = user;
    }

    return {
      // 状态
      token,
      userInfo,
      loading,

      // 计算属性
      isAuthenticated,
      isAdmin,
      isEditor,
      canAccessAdmin,
      userPermissions,

      // 方法
      login,
      logout,
      register,
      sendVerificationCode,
      setUserInfo,
      setToken,
      hasPermission,
      initUserInfo,
      transformPermissions,

      // 新增的安全检查方法
      checkAuthenticationSafely,
      isAuthenticationValid,

      // 组合函数：用于组件中的认证检查
      useAuthGuard,

      // 权限刷新
      refreshPermissions,
    };
  },
  {
    persist: {
      // 只持久化核心认证数据，避免持久化临时状态
      paths: ["token", "userInfo"],
    } as any,
  },
);
