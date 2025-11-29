import { vi, beforeEach, afterEach } from "vitest";
import { createPinia } from "pinia";
import { createPersistedState } from "pinia-plugin-persistedstate";

// ========== 全局测试环境配置 ==========

// ========== localStorage Mock ==========

// 创建localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => {
      return store[key] || null;
    },
    setItem: (key: string, value: string): void => {
      store[key] = value.toString();
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    key: (index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length(): number {
      return Object.keys(store).length;
    },
  };
})();

// 将localStorage mock设置为全局对象
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// 也为global设置localStorage（用于Node环境）
Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ========== sessionStorage Mock ==========

// 创建sessionStorage mock（基本同localStorage）
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => {
      return store[key] || null;
    },
    setItem: (key: string, value: string): void => {
      store[key] = value.toString();
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    key: (index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length(): number {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
  writable: true,
});

Object.defineProperty(global, "sessionStorage", {
  value: sessionStorageMock,
  writable: true,
});

// ========== Pinia 测试工具 ==========

/**
 * 创建用于测试的Pinia实例
 * 包含持久化插件配置
 */
export function createTestPinia() {
  const pinia = createPinia();

  // 添加持久化插件
  pinia.use(
    createPersistedState({
      storage: {
        getItem: (key: string) => localStorageMock.getItem(key),
        setItem: (key: string, value: string) =>
          localStorageMock.setItem(key, value),
      },
    }),
  );

  return pinia;
}

/**
 * 清理测试环境
 * 在每个测试之前或之后调用
 */
export function cleanupTestEnvironment() {
  // 清理localStorage
  localStorageMock.clear();

  // 清理sessionStorage
  sessionStorageMock.clear();

  // 清理所有timers
  vi.clearAllTimers();

  // 清理所有mocks
  vi.clearAllMocks();
}

// ========== API Mock ==========

// Mock axios/api模块
vi.mock("../src/utils/api", () => ({
  default: {
    defaults: {
      headers: {
        common: {},
      },
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

// ========== Router Mock ==========

// Mock Vue Router
const routerMock = {
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  resolve: vi.fn(),
  currentRoute: {
    value: {
      path: "/",
      name: "home",
      params: {},
      query: {},
      meta: {},
    },
  },
};

vi.mock("../src/router", () => ({
  default: routerMock,
}));

// 导出router mock供测试使用
export { routerMock };

// ========== Ant Design Vue Mock ==========

// Mock message组件
const messageMock = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  loading: vi.fn(),
};

vi.mock("ant-design-vue", () => ({
  message: messageMock,
}));

export { messageMock };

// ========== 全局测试变量 ==========

// 导出mocks供测试使用
export { localStorageMock, sessionStorageMock };

// ========== Vitest Hooks ==========

// 在每个测试文件之前清理环境
beforeEach(() => {
  cleanupTestEnvironment();
});

// 在每个测试之后也清理（确保干净）
afterEach(() => {
  cleanupTestEnvironment();
});

// ========== Console Mock（可选） ==========

// 如果需要，可以mock console方法来减少测试输出
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// 在测试中抑制预期的错误/警告日志
export function suppressConsoleErrors() {
  console.error = vi.fn();
}

export function suppressConsoleWarnings() {
  console.warn = vi.fn();
}

export function restoreConsole() {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
}
