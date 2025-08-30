import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia } from "pinia";
import { useUserStore, type UserInfo } from "../../../src/stores/user";
import api from "../../../src/utils/api";
import {
  createTestPinia,
  localStorageMock,
  messageMock,
  routerMock,
} from "../../setup";

describe("useUserStore", () => {
  let store: ReturnType<typeof useUserStore>;

  beforeEach(() => {
    // 使用测试专用的Pinia实例（包含持久化插件）
    setActivePinia(createTestPinia());

    // 创建store实例
    store = useUserStore();

    // 清除所有mocks
    vi.clearAllMocks();
  });

  describe("初始状态", () => {
    it("应该初始化时没有用户信息和token", () => {
      expect(store.token).toBeNull();
      expect(store.userInfo).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(store.loading).toBe(false);
    });
  });

  describe("token管理", () => {
    it("应该能够设置token", () => {
      const token = "test-token";

      // 设置token
      store.setToken(token);

      // 验证token被设置
      expect(store.token).toBe(token);
      expect(localStorageMock.getItem("token")).toBe(token);
      expect(api.defaults.headers.common["Authorization"]).toBe(
        `Bearer ${token}`,
      );
    });

    it("应该在设置token时不自动认证", () => {
      const token = "test-token";

      // 仅设置token（没有用户信息）
      store.setToken(token);

      // token存在但没有用户信息，认证状态应该是false
      expect(store.token).toBe(token);
      expect(store.userInfo).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe("用户信息管理", () => {
    it("应该能够设置用户信息", () => {
      const userInfo: UserInfo = {
        id: "1",
        username: "testuser",
        name: "Test User",
        role: "user",
        permissions: ["read:news", "read:resources"],
      };

      store.setUserInfo(userInfo);

      expect(store.userInfo).toEqual(userInfo);
      expect(store.isAdmin).toBe(false);
      expect(store.isEditor).toBe(false);
    });

    it("应该正确识别管理员角色", () => {
      const adminUser: UserInfo = {
        id: "1",
        username: "admin",
        name: "Admin User",
        role: "admin",
        permissions: [],
      };

      store.setUserInfo(adminUser);

      expect(store.isAdmin).toBe(true);
      expect(store.isEditor).toBe(true); // 管理员也是编辑者
    });

    it("应该正确识别编辑者角色", () => {
      const editorUser: UserInfo = {
        id: "1",
        username: "editor",
        name: "Editor User",
        role: "editor",
        permissions: ["edit:news"],
      };

      store.setUserInfo(editorUser);

      expect(store.isAdmin).toBe(false);
      expect(store.isEditor).toBe(true);
    });
  });

  describe("权限检查", () => {
    it("应该能够正确转换权限", () => {
      const backendPermissions = {
        news: {
          read: true,
          create: true,
          update: false,
          delete: false,
        },
        resources: {
          read: true,
          manage: true,
        },
      };

      const transformed = store.transformPermissions(backendPermissions);

      expect(transformed).toContain("news:read");
      expect(transformed).toContain("news:create");
      expect(transformed).toContain("resources:read");
      expect(transformed).toContain("resources:manage");
      expect(transformed).not.toContain("news:update");
      expect(transformed).not.toContain("news:delete");
    });

    it("应该能够正确检查权限", () => {
      const userInfo: UserInfo = {
        id: "1",
        username: "testuser",
        name: "Test User",
        role: "user",
        permissions: ["read:news", "create:news"],
      };

      store.setUserInfo(userInfo);

      expect(store.hasPermission("read:news")).toBe(true);
      expect(store.hasPermission("create:news")).toBe(true);
      expect(store.hasPermission("delete:news")).toBe(false);
    });

    it("管理员应该拥有所有权限", () => {
      const adminUser: UserInfo = {
        id: "1",
        username: "admin",
        name: "Admin User",
        role: "admin",
        permissions: [],
      };

      store.setUserInfo(adminUser);

      expect(store.hasPermission("any:permission")).toBe(true);
      expect(store.hasPermission("delete:everything")).toBe(true);
    });
  });

  describe("完整认证状态", () => {
    it("应该在有token和用户信息时认证成功", () => {
      const token = "test-token";
      const userInfo: UserInfo = {
        id: "1",
        username: "testuser",
        name: "Test User",
        role: "user",
        permissions: ["read:news"],
      };

      // 设置token到localStorage（模拟持久化）
      localStorageMock.setItem("token", token);

      // 设置store状态
      store.setToken(token);
      store.setUserInfo(userInfo);

      // 现在应该认证成功
      expect(store.isAuthenticated).toBe(true);
    });

    it("应该在缺少token或用户信息时认证失败", () => {
      // 测试1: 只有token没有用户信息
      const token = "test-token";
      store.setToken(token);
      expect(store.isAuthenticated).toBe(false);

      // 清理状态
      store.setToken("");

      // 测试2: 只有用户信息没有token
      const userInfo: UserInfo = {
        id: "1",
        username: "testuser",
        name: "Test User",
        role: "user",
        permissions: ["read:news"],
      };
      store.setUserInfo(userInfo);
      expect(store.isAuthenticated).toBe(false);

      // 测试3: 都没有
      store.setUserInfo(null as any);
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe("登录功能", () => {
    it("应该能够成功登录", async () => {
      const loginPayload = {
        username: "testuser",
        password: "password123",
      };

      const mockResponse = {
        data: {
          status: "success",
          token: "jwt-token",
          data: {
            user: {
              id: "1",
              username: "testuser",
              name: "Test User",
              role: "user",
              permissions: {
                news: {
                  read: true,
                  create: false,
                },
              },
            },
          },
        },
      };

      // Mock API 响应
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await store.login(loginPayload);

      expect(result).toBe(true);
      expect(store.token).toBe("jwt-token");
      expect(store.userInfo?.username).toBe("testuser");
      expect(store.userPermissions).toContain("news:read");

      // 在测试环境中，由于没有真正的持久化插件，我们需要手动验证token设置
      expect(api.defaults.headers.common["Authorization"]).toBe(
        "Bearer jwt-token",
      );

      // 现在应该认证成功（需要手动设置localStorage来满足认证条件）
      localStorageMock.setItem("token", "jwt-token");
      expect(store.isAuthenticated).toBe(true);
    });

    it("应该在登录失败时抛出错误", async () => {
      const loginPayload = {
        username: "wronguser",
        password: "wrongpassword",
      };

      const mockError = {
        response: {
          data: {
            message: "用户名或密码错误",
          },
        },
      };

      // Mock API 错误响应
      vi.mocked(api.post).mockRejectedValue(mockError);

      await expect(store.login(loginPayload)).rejects.toThrow(
        "用户名或密码错误",
      );

      // 确保状态被清除
      expect(store.token).toBeNull();
      expect(store.userInfo).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe("登出功能", () => {
    it("应该能够成功登出", async () => {
      // 先设置登录状态
      const token = "test-token";
      const userInfo: UserInfo = {
        id: "1",
        username: "testuser",
        name: "Test User",
        role: "user",
        permissions: ["read:news"],
      };

      localStorageMock.setItem("token", token);
      store.setToken(token);
      store.setUserInfo(userInfo);

      // Mock API 响应
      vi.mocked(api.post).mockResolvedValue({ data: { status: "success" } });

      await store.logout();

      // 验证状态被清除
      expect(store.token).toBeNull();
      expect(store.userInfo).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(localStorageMock.getItem("token")).toBeNull();
      expect(api.defaults.headers.common["Authorization"]).toBeUndefined();
    });
  });

  describe("用户信息初始化", () => {
    it("应该能够初始化用户信息", async () => {
      // 设置localStorage中的token
      const token = "saved-token";
      localStorageMock.setItem("token", token);

      const mockUserResponse = {
        data: {
          status: "success",
          data: {
            user: {
              id: "1",
              username: "testuser",
              name: "Test User",
              role: "user",
              permissions: {
                news: {
                  read: true,
                },
              },
            },
          },
        },
      };

      // Mock API 响应
      vi.mocked(api.get).mockResolvedValue(mockUserResponse);

      await store.initUserInfo();

      expect(store.token).toBe(token);
      expect(store.userInfo?.username).toBe("testuser");
      expect(api.defaults.headers.common["Authorization"]).toBe(
        `Bearer ${token}`,
      );
    });
  });

  describe("认证检查", () => {
    it("应该正确检查认证状态", () => {
      // 未认证状态
      expect(store.checkAuthenticationSafely()).toBe(false);

      // 设置完整认证状态
      const token = "test-token";
      const userInfo: UserInfo = {
        id: "1",
        username: "testuser",
        name: "Test User",
        role: "user",
        permissions: ["read:news"],
      };

      localStorageMock.setItem("token", token);
      store.setToken(token);
      store.setUserInfo(userInfo);

      expect(store.checkAuthenticationSafely()).toBe(true);
    });

    it("应该提供useAuthGuard组合函数", () => {
      const { requireAuth, isReady, isAuthenticated } = store.useAuthGuard();

      expect(typeof requireAuth).toBe("function");
      expect(isReady).toBeDefined();
      expect(isAuthenticated).toBeDefined();
    });
  });
});
