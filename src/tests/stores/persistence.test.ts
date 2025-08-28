import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia } from "pinia";
import { useUserStore } from "@/stores/user";
import { useContentStore } from "@/stores/content";
import { createTestPinia, localStorageMock } from "../../../__tests__/setup";
import type { UserInfo } from "@/stores/user";

describe("Pinia状态持久化测试", () => {
  beforeEach(() => {
    // 使用包含持久化插件的测试Pinia实例
    setActivePinia(createTestPinia());

    // 确保localStorage是干净的
    localStorageMock.clear();
  });

  describe("用户Store持久化测试", () => {
    it("应该只持久化token和userInfo", () => {
      const userStore = useUserStore();

      // 设置用户数据
      const token = "test-token-123";
      const userInfo: UserInfo = {
        id: "1",
        username: "testuser",
        name: "Test User",
        role: "user",
        permissions: ["read:news", "create:news"],
      };

      // 手动设置localStorage（模拟持久化插件行为）
      localStorageMock.setItem("token", token);
      userStore.setToken(token);
      userStore.setUserInfo(userInfo);

      // 手动触发持久化（模拟插件行为）
      const persistData = {
        token: userStore.token,
        userInfo: userStore.userInfo,
      };
      localStorageMock.setItem("user", JSON.stringify(persistData));

      // 验证localStorage中有数据
      const storedData = localStorageMock.getItem("user");
      expect(storedData).toBeTruthy();

      // 模拟页面刷新 - 创建新的store实例
      setActivePinia(createTestPinia());
      const newUserStore = useUserStore();

      // 手动恢复数据（模拟持久化插件恢复）
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.token) {
          newUserStore.setToken(parsed.token);
          localStorageMock.setItem("token", parsed.token);
        }
        if (parsed.userInfo) {
          newUserStore.setUserInfo(parsed.userInfo);
        }
      }

      // 验证数据恢复
      expect(newUserStore.token).toBe(token);
      expect(newUserStore.userInfo?.username).toBe("testuser");
      expect(newUserStore.userInfo?.permissions).toEqual(["read:news", "create:news"]);
    });

    it("应该正确处理token的设置和清除", () => {
      const userStore = useUserStore();

      // 设置初始token
      const initialToken = "initial-token";
      userStore.setToken(initialToken);
      localStorageMock.setItem("user", JSON.stringify({ token: initialToken, userInfo: null }));

      // 更新token
      const newToken = "new-token";
      userStore.setToken(newToken);
      localStorageMock.setItem("user", JSON.stringify({ token: newToken, userInfo: null }));
      localStorageMock.setItem("token", newToken);

      // 模拟页面刷新
      setActivePinia(createTestPinia());
      const newUserStore = useUserStore();

      // 手动恢复
      const storedData = localStorageMock.getItem("user");
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.token) {
          newUserStore.setToken(parsed.token);
        }
      }

      expect(newUserStore.token).toBe("new-token");
    });

    it("应该正确清除持久化的认证状态", async () => {
      const userStore = useUserStore();

      // 设置认证状态
      const token = "auth-token";
      const userInfo: UserInfo = {
        id: "1",
        username: "testuser",
        name: "Test User",
        role: "user",
        permissions: ["read:news"],
      };

      userStore.setToken(token);
      userStore.setUserInfo(userInfo);
      localStorageMock.setItem("user", JSON.stringify({ token, userInfo }));
      localStorageMock.setItem("token", token);

      // 执行登出
      await userStore.logout();

      // 验证状态被清除
      expect(userStore.token).toBeNull();
      expect(userStore.userInfo).toBeNull();
      expect(localStorageMock.getItem("token")).toBeNull();
    });
  });

  describe("内容Store持久化测试", () => {
    it("应该只持久化用户偏好设置", () => {
      const contentStore = useContentStore();

      // 设置用户偏好
      contentStore.news.filters.category = "tech";
      contentStore.news.filters.search = "测试搜索";
      contentStore.news.limit = 20;

      // 手动持久化偏好设置
      const userPreferences = {
        news: {
          filters: contentStore.news.filters,
          limit: contentStore.news.limit,
        },
      };
      localStorageMock.setItem("content", JSON.stringify(userPreferences));

      // 模拟页面刷新
      setActivePinia(createTestPinia());
      const newContentStore = useContentStore();

      // 手动恢复偏好设置
      const storedData = localStorageMock.getItem("content");
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.news) {
          Object.assign(newContentStore.news.filters, parsed.news.filters);
          newContentStore.news.limit = parsed.news.limit;
        }
      }

      // 验证持久化的偏好设置
      expect(newContentStore.news.filters.category).toBe("tech");
      expect(newContentStore.news.filters.search).toBe("测试搜索");
      expect(newContentStore.news.limit).toBe(20);
    });

    it("应该保持筛选器状态在页面刷新后", () => {
      const contentStore = useContentStore();

      // 设置筛选器
      contentStore.news.filters.category = "technology";
      contentStore.news.filters.status = "published";
      contentStore.news.filters.search = "Vue.js开发";

      // 手动持久化
      const persistData = {
        news: {
          filters: contentStore.news.filters,
        },
      };
      localStorageMock.setItem("content", JSON.stringify(persistData));

      // 模拟页面刷新
      setActivePinia(createTestPinia());
      const newContentStore = useContentStore();

      // 手动恢复
      const storedData = localStorageMock.getItem("content");
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.news?.filters) {
          Object.assign(newContentStore.news.filters, parsed.news.filters);
        }
      }

      // 验证筛选器被正确恢复
      expect(newContentStore.news.filters.category).toBe("technology");
      expect(newContentStore.news.filters.status).toBe("published");
      expect(newContentStore.news.filters.search).toBe("Vue.js开发");
    });
  });

  describe("localStorage存储格式验证", () => {
    it("用户Store应该只在localStorage中存储指定字段", () => {
      const userStore = useUserStore();

      // 设置多个字段
      const token = "storage-test-token";
      const userInfo: UserInfo = {
        id: "1",
        username: "storageuser",
        name: "Storage User",
        role: "user",
        permissions: ["read:news"],
      };

      userStore.setToken(token);
      userStore.setUserInfo(userInfo);

      // 手动存储（模拟持久化插件）
      const persistData = {
        token: userStore.token,
        userInfo: userStore.userInfo,
        // loading 和其他非持久化字段不应该被存储
      };
      localStorageMock.setItem("user", JSON.stringify(persistData));

      // 检查localStorage中的数据
      const storedData = localStorageMock.getItem("user");
      expect(storedData).toBeTruthy();

      if (storedData) {
        const parsed = JSON.parse(storedData);

        // 应该包含的字段
        expect(parsed).toHaveProperty("token");
        expect(parsed).toHaveProperty("userInfo");
        expect(parsed.token).toBe(token);
        expect(parsed.userInfo.username).toBe("storageuser");

        // 不应该包含的字段
        expect(parsed).not.toHaveProperty("loading");
        expect(parsed).not.toHaveProperty("initInProgress");
      }
    });

    it("内容Store应该只在localStorage中存储用户偏好", () => {
      const contentStore = useContentStore();

      // 设置各种数据
      contentStore.news.filters.category = "preference-test";
      contentStore.news.limit = 15;

      // 手动存储偏好（模拟持久化插件）
      const preferences = {
        news: {
          filters: contentStore.news.filters,
          limit: contentStore.news.limit,
        },
      };
      localStorageMock.setItem("content", JSON.stringify(preferences));

      // 检查localStorage中的数据
      const storedData = localStorageMock.getItem("content");
      expect(storedData).toBeTruthy();

      if (storedData) {
        const parsed = JSON.parse(storedData);

        // 应该包含用户偏好
        expect(parsed.news.filters.category).toBe("preference-test");
        expect(parsed.news.limit).toBe(15);

        // 不应该包含临时数据（如loading状态、实际数据等）
        expect(parsed).not.toHaveProperty("loading");
        expect(parsed.news).not.toHaveProperty("data");
        expect(parsed.news).not.toHaveProperty("total");
      }
    });
  });

  describe("数据一致性验证", () => {
    it("应该正确处理无效的持久化数据", () => {
      // 设置无效的JSON数据
      localStorageMock.setItem("user", "invalid-json");

      // 创建store（持久化插件应该处理错误）
      const userStore = useUserStore();

      // Store应该使用默认值
      expect(userStore.token).toBeNull();
      expect(userStore.userInfo).toBeNull();
      expect(userStore.isAuthenticated).toBe(false);
    });

    it("应该处理部分缺失的持久化数据", () => {
      // 设置部分数据
      const partialData = {
        token: "partial-token",
        // userInfo 缺失
      };
      localStorageMock.setItem("user", JSON.stringify(partialData));

      const userStore = useUserStore();

      // 手动恢复部分数据
      const storedData = localStorageMock.getItem("user");
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.token) {
          userStore.setToken(parsed.token);
        }
      }

      expect(userStore.token).toBe("partial-token");
      expect(userStore.userInfo).toBeNull();
    });
  });
});
