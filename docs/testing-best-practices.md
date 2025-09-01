# 测试最佳实践指南

> **适用项目**: 山东省大中小学思政课一体化教育平台
> **技术栈**: Vue 3 + TypeScript + Vitest + Pinia
> **更新时间**: 2025-01-01

## 📚 目录

- [测试原则](#测试原则)
- [测试分层策略](#测试分层策略)
- [单元测试最佳实践](#单元测试最佳实践)
- [组件测试指南](#组件测试指南)
- [集成测试规范](#集成测试规范)
- [Mock 策略](#mock-策略)
- [测试数据管理](#测试数据管理)
- [性能测试](#性能测试)
- [代码组织](#代码组织)
- [常见陷阱](#常见陷阱)

## 🎯 测试原则

### 1. 测试金字塔原则

```
        E2E Tests (少量)
      ▲ 慢、昂贵、脆弱
     /|\
    / | \   Integration Tests (适量)
   /  |  \  ▲ 中等速度和成本
  /   |   \
 /    |    \ Unit Tests (大量)
/_____|_____\ ▲ 快速、便宜、可靠
```

### 2. FIRST 原则

- **Fast** (快速): 测试应该快速执行
- **Independent** (独立): 测试之间不应相互依赖
- **Repeatable** (可重复): 测试结果应该一致
- **Self-Validating** (自验证): 测试应该有明确的通过/失败结果
- **Timely** (及时): 测试应该及时编写

### 3. AAA 模式

```typescript
describe("UserStore", () => {
  it("should login user successfully", async () => {
    // Arrange (准备)
    const store = useUserStore();
    const userData = { username: "test", password: "123456" };

    // Act (执行)
    await store.login(userData);

    // Assert (断言)
    expect(store.isAuthenticated).toBe(true);
    expect(store.user.username).toBe("test");
  });
});
```

## 🏗️ 测试分层策略

### 单元测试 (70%)

- **范围**: 独立的函数、类、组合式函数
- **特点**: 快速、隔离、专注于逻辑
- **工具**: Vitest + 基础 Mock

### 集成测试 (20%)

- **范围**: 模块间交互、API集成
- **特点**: 验证模块协作、数据流
- **工具**: Vitest + MSW + Test DB

### 端到端测试 (10%)

- **范围**: 完整用户工作流
- **特点**: 真实环境、用户视角
- **工具**: Playwright + 测试环境

## 🔧 单元测试最佳实践

### Pinia Store 测试

```typescript
// __tests__/unit/stores/user.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useUserStore } from "@/stores/user";

describe("useUserStore", () => {
  beforeEach(() => {
    // 为每个测试创建新的 Pinia 实例
    setActivePinia(createPinia());
  });

  describe("初始状态", () => {
    it("应该有正确的初始状态", () => {
      const store = useUserStore();

      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe("登录功能", () => {
    it("应该成功登录并设置用户信息", async () => {
      // Arrange
      const store = useUserStore();
      const mockApi = vi.fn().mockResolvedValue({
        success: true,
        data: { user: { id: 1, username: "test" }, token: "abc123" },
      });

      // Mock API 调用
      vi.mock("@/api", () => ({
        userApi: { login: mockApi },
      }));

      // Act
      await store.login({ username: "test", password: "123456" });

      // Assert
      expect(store.isAuthenticated).toBe(true);
      expect(store.user).toEqual({ id: 1, username: "test" });
      expect(store.token).toBe("abc123");
      expect(mockApi).toHaveBeenCalledWith({
        username: "test",
        password: "123456",
      });
    });

    it("应该处理登录错误", async () => {
      const store = useUserStore();
      const mockApi = vi.fn().mockRejectedValue(new Error("登录失败"));

      vi.mock("@/api", () => ({
        userApi: { login: mockApi },
      }));

      await expect(
        store.login({ username: "test", password: "wrong" }),
      ).rejects.toThrow("登录失败");

      expect(store.isAuthenticated).toBe(false);
    });
  });
});
```

### 工具函数测试

```typescript
// __tests__/unit/utils/debounce.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { debounce, throttle } from "@/utils/debounce";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("应该延迟执行函数", () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    // 连续调用
    debouncedFn();
    debouncedFn();
    debouncedFn();

    // 还未到延迟时间，不应该执行
    expect(mockFn).not.toHaveBeenCalled();

    // 快进时间
    vi.advanceTimersByTime(100);

    // 应该只执行一次
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("应该传递正确的参数", () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn("arg1", "arg2");
    vi.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
  });
});
```

## 🎨 组件测试指南

### 基础组件测试

```typescript
// __tests__/unit/components/common/Button.test.ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Button from "@/components/common/Button.vue";

describe("Button", () => {
  it("应该渲染默认按钮", () => {
    const wrapper = mount(Button, {
      props: { text: "Click me" },
    });

    expect(wrapper.text()).toBe("Click me");
    expect(wrapper.classes()).toContain("btn");
    expect(wrapper.classes()).toContain("btn-primary");
  });

  it("应该响应点击事件", async () => {
    const wrapper = mount(Button, {
      props: { text: "Click me" },
    });

    await wrapper.trigger("click");

    expect(wrapper.emitted("click")).toBeTruthy();
    expect(wrapper.emitted("click")).toHaveLength(1);
  });

  it("应该支持不同类型", () => {
    const wrapper = mount(Button, {
      props: { text: "Danger", type: "danger" },
    });

    expect(wrapper.classes()).toContain("btn-danger");
  });

  it("应该在禁用时不响应点击", async () => {
    const wrapper = mount(Button, {
      props: { text: "Disabled", disabled: true },
    });

    await wrapper.trigger("click");

    expect(wrapper.emitted("click")).toBeFalsy();
    expect(wrapper.attributes("disabled")).toBeDefined();
  });
});
```

### 复杂组件测试

```typescript
// __tests__/unit/components/NewsForm.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import NewsForm from "@/components/forms/NewsForm.vue";

describe("NewsForm", () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = mount(NewsForm, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              news: {
                categories: [
                  { id: 1, name: "政策解读" },
                  { id: 2, name: "教学资源" },
                ],
              },
            },
          }),
        ],
      },
      props: {
        mode: "create",
      },
    });
  });

  it("应该渲染表单字段", () => {
    expect(wrapper.find('[data-testid="title-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="category-select"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="content-editor"]').exists()).toBe(true);
  });

  it("应该验证必填字段", async () => {
    const submitBtn = wrapper.find('[data-testid="submit-btn"]');

    await submitBtn.trigger("click");

    expect(wrapper.find(".error-message").text()).toContain("标题不能为空");
  });

  it("应该在有效数据时提交表单", async () => {
    const titleInput = wrapper.find('[data-testid="title-input"]');
    const categorySelect = wrapper.find('[data-testid="category-select"]');
    const contentEditor = wrapper.find('[data-testid="content-editor"]');

    await titleInput.setValue("测试新闻");
    await categorySelect.setValue("1");
    await contentEditor.setValue("测试内容");

    const submitBtn = wrapper.find('[data-testid="submit-btn"]');
    await submitBtn.trigger("click");

    expect(wrapper.emitted("submit")).toBeTruthy();
    expect(wrapper.emitted("submit")[0][0]).toEqual({
      title: "测试新闻",
      category: "1",
      content: "测试内容",
    });
  });
});
```

### Composables 测试

```typescript
// __tests__/unit/composables/usePermission.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createTestingPinia } from "@pinia/testing";
import { usePermission } from "@/composables/usePermission";
import { useUserStore } from "@/stores/user";

describe("usePermission", () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia());
  });

  it("应该正确检查权限", () => {
    const userStore = useUserStore();
    userStore.user = {
      id: 1,
      username: "admin",
      permissions: ["news:create", "news:edit", "user:manage"],
    };

    const { hasPermission, hasAnyPermission, hasAllPermissions } =
      usePermission();

    expect(hasPermission("news:create")).toBe(true);
    expect(hasPermission("news:delete")).toBe(false);
    expect(hasAnyPermission(["news:create", "news:delete"])).toBe(true);
    expect(hasAllPermissions(["news:create", "news:edit"])).toBe(true);
    expect(hasAllPermissions(["news:create", "news:delete"])).toBe(false);
  });

  it("应该在未登录时返回false", () => {
    const { hasPermission } = usePermission();

    expect(hasPermission("any:permission")).toBe(false);
  });
});
```

## 🔗 集成测试规范

### API 集成测试

```typescript
// __tests__/integration/api/news.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { rest } from "msw";
import { newsApi } from "@/api/modules/news";

const server = setupServer(
  rest.get("/api/news", (req, res, ctx) => {
    const page = req.url.searchParams.get("page") || "1";
    return res(
      ctx.json({
        success: true,
        data: [
          { id: 1, title: "测试新闻1", category: "政策解读" },
          { id: 2, title: "测试新闻2", category: "教学资源" },
        ],
        pagination: {
          total: 2,
          page: parseInt(page),
          limit: 10,
        },
      }),
    );
  }),

  rest.post("/api/news", (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: { id: 3, ...req.body },
      }),
    );
  }),
);

describe("News API Integration", () => {
  beforeEach(() => server.listen());
  afterEach(() => server.resetHandlers());

  it("应该获取新闻列表", async () => {
    const response = await newsApi.getList({ page: 1, limit: 10 });

    expect(response.success).toBe(true);
    expect(response.data).toHaveLength(2);
    expect(response.pagination.total).toBe(2);
  });

  it("应该创建新闻", async () => {
    const newsData = {
      title: "新新闻",
      content: "新闻内容",
      category: "政策解读",
    };

    const response = await newsApi.create(newsData);

    expect(response.success).toBe(true);
    expect(response.data.title).toBe("新新闻");
  });
});
```

### Store 集成测试

```typescript
// __tests__/integration/stores/news-workflow.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createTestingPinia } from "@pinia/testing";
import { useNewsStore } from "@/stores/news";
import { useUserStore } from "@/stores/user";

describe("News Workflow Integration", () => {
  let newsStore: any;
  let userStore: any;

  beforeEach(() => {
    setActivePinia(createTestingPinia());
    newsStore = useNewsStore();
    userStore = useUserStore();
  });

  it("应该完成新闻创建到发布的完整流程", async () => {
    // 模拟用户登录
    userStore.user = { id: 1, username: "editor", role: "editor" };
    userStore.token = "mock-token";

    // 创建新闻
    const newsData = {
      title: "测试新闻",
      content: "测试内容",
      category: "政策解读",
    };

    const createdNews = await newsStore.createNews(newsData);
    expect(createdNews.id).toBeDefined();
    expect(newsStore.news.find((n) => n.id === createdNews.id)).toBeTruthy();

    // 发布新闻
    await newsStore.publishNews(createdNews.id);
    const publishedNews = newsStore.news.find((n) => n.id === createdNews.id);
    expect(publishedNews.status).toBe("published");

    // 验证新闻出现在列表中
    await newsStore.fetchNews({ status: "published" });
    expect(newsStore.news.some((n) => n.id === createdNews.id)).toBe(true);
  });
});
```

## 🎭 Mock 策略

### API Mock

```typescript
// __tests__/mocks/api.ts
import { vi } from "vitest";

export const createMockApi = () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
});

export const mockUserApi = {
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  updateProfile: vi.fn(),
};

export const mockNewsApi = {
  getList: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};
```

### 组件 Mock

```typescript
// __tests__/mocks/components.ts
import { vi } from "vitest";

// Mock 富文本编辑器
vi.mock("@/components/common/RichEditor.vue", () => ({
  default: {
    name: "MockRichEditor",
    template: '<div data-testid="rich-editor"></div>',
    emits: ["update:modelValue"],
    props: ["modelValue"],
  },
}));

// Mock 文件上传组件
vi.mock("@/components/common/FileUpload.vue", () => ({
  default: {
    name: "MockFileUpload",
    template: '<div data-testid="file-upload"></div>',
    emits: ["upload:success"],
    props: ["accept", "multiple"],
  },
}));
```

### 外部依赖 Mock

```typescript
// __tests__/setup.ts
import { vi } from "vitest";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal("localStorage", localStorageMock);

// Mock window.location
delete (window as any).location;
window.location = { href: "", reload: vi.fn() } as any;

// Mock console 方法（减少测试输出噪音）
vi.stubGlobal("console", {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
});
```

## 📊 测试数据管理

### 测试数据工厂

```typescript
// __tests__/factories/user.ts
import { faker } from "@faker-js/faker";

export const createUser = (overrides = {}) => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  username: faker.internet.userName(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: "user",
  permissions: [],
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

export const createAdmin = (overrides = {}) =>
  createUser({
    role: "admin",
    permissions: ["*"],
    ...overrides,
  });

export const createEditor = (overrides = {}) =>
  createUser({
    role: "editor",
    permissions: ["news:create", "news:edit", "resource:create"],
    ...overrides,
  });
```

```typescript
// __tests__/factories/news.ts
export const createNews = (overrides = {}) => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  title: faker.lorem.sentence(),
  content: faker.lorem.paragraphs(3),
  summary: faker.lorem.paragraph(),
  category: faker.helpers.arrayElement(["政策解读", "教学资源", "通知公告"]),
  author: createUser(),
  status: "published",
  publishDate: faker.date.past().toISOString(),
  viewCount: faker.number.int({ min: 0, max: 1000 }),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});
```

### 测试数据使用

```typescript
// __tests__/unit/components/NewsCard.test.ts
import { createNews } from "@/__tests__/factories/news";

describe("NewsCard", () => {
  it("应该显示新闻信息", () => {
    const news = createNews({
      title: "特定标题",
      category: "政策解读",
    });

    const wrapper = mount(NewsCard, {
      props: { news },
    });

    expect(wrapper.find(".news-title").text()).toBe("特定标题");
    expect(wrapper.find(".news-category").text()).toBe("政策解读");
  });
});
```

## ⚡ 性能测试

### 组件渲染性能

```typescript
// __tests__/performance/component-rendering.test.ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createNews } from "@/__tests__/factories/news";
import NewsList from "@/components/NewsList.vue";

describe("NewsList Performance", () => {
  it("应该在合理时间内渲染大量数据", () => {
    const largeNewsList = Array.from({ length: 1000 }, () => createNews());

    const startTime = performance.now();

    const wrapper = mount(NewsList, {
      props: { news: largeNewsList },
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    expect(wrapper.findAll(".news-item")).toHaveLength(1000);
    expect(renderTime).toBeLessThan(100); // 应该在100ms内完成
  });
});
```

### 内存泄漏检测

```typescript
// __tests__/performance/memory-leak.test.ts
describe("Memory Leak Detection", () => {
  it("应该正确清理组件资源", async () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

    // 创建和销毁大量组件
    for (let i = 0; i < 100; i++) {
      const wrapper = mount(SomeComponent);
      await wrapper.vm.$nextTick();
      wrapper.unmount();
    }

    // 强制垃圾回收
    if (global.gc) {
      global.gc();
    }

    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // 内存增长应该在合理范围内
    expect(memoryIncrease).toBeLessThan(1024 * 1024); // 小于1MB
  });
});
```

## 📁 代码组织

### 目录结构

```
__tests__/
├── unit/                    # 单元测试
│   ├── components/          # 组件测试
│   │   ├── common/         # 通用组件
│   │   ├── forms/          # 表单组件
│   │   └── charts/         # 图表组件
│   ├── composables/        # 组合式函数测试
│   ├── stores/             # 状态管理测试
│   ├── utils/              # 工具函数测试
│   └── services/           # 服务层测试
├── integration/            # 集成测试
│   ├── api/               # API集成测试
│   ├── workflows/         # 业务流程测试
│   └── stores/            # Store集成测试
├── e2e/                   # 端到端测试
│   ├── admin/             # 管理后台测试
│   ├── user/              # 用户界面测试
│   └── workflows/         # 完整流程测试
├── performance/           # 性能测试
├── mocks/                 # Mock数据和函数
├── factories/             # 测试数据工厂
├── fixtures/              # 静态测试数据
├── helpers/               # 测试辅助函数
└── setup.ts              # 测试环境设置
```

### 命名约定

```typescript
// 测试文件命名
ComponentName.test.ts; // 组件测试
functionName.test.ts; // 函数测试
storeName.test.ts; // Store测试
apiName.integration.test.ts; // API集成测试
workflow.e2e.test.ts; // 端到端测试

// 测试用例命名
describe("功能模块", () => {
  describe("具体场景", () => {
    it("应该在特定条件下产生预期结果", () => {});
  });
});
```

## 🚨 常见陷阱

### 1. 测试间的状态污染

```typescript
// ❌ 错误：全局状态没有清理
describe("UserStore", () => {
  const store = useUserStore();

  it("测试1", () => {
    store.login(user1);
    // ...
  });

  it("测试2", () => {
    // 这里可能受到测试1的影响
    expect(store.isAuthenticated).toBe(false); // 可能失败
  });
});

// ✅ 正确：每个测试前清理状态
describe("UserStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // 测试用例...
});
```

### 2. 异步测试处理不当

```typescript
// ❌ 错误：没有等待异步操作
it("应该更新数据", () => {
  store.fetchData();
  expect(store.loading).toBe(false); // 可能还在加载中
});

// ✅ 正确：等待异步操作完成
it("应该更新数据", async () => {
  await store.fetchData();
  expect(store.loading).toBe(false);
});
```

### 3. Mock 过度或不足

```typescript
// ❌ 错误：Mock 过度，失去了测试意义
vi.mock("@/utils/validation", () => ({
  validateEmail: vi.fn(() => true),
  validatePassword: vi.fn(() => true),
}));

// ✅ 正确：只 Mock 外部依赖
vi.mock("@/api/user", () => ({
  login: vi.fn(),
}));
// 保持业务逻辑的真实性
```

### 4. 测试实现细节而非行为

```typescript
// ❌ 错误：测试实现细节
it("应该调用特定方法", () => {
  const spy = vi.spyOn(component, "internalMethod");
  component.doSomething();
  expect(spy).toHaveBeenCalled();
});

// ✅ 正确：测试行为和结果
it("应该显示成功消息", async () => {
  await component.doSomething();
  expect(wrapper.find(".success-message").exists()).toBe(true);
});
```

### 5. 测试数据硬编码

```typescript
// ❌ 错误：硬编码测试数据
const user = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
};

// ✅ 正确：使用工厂函数
const user = createUser({
  name: "John Doe", // 只覆盖需要的字段
});
```

## 📈 测试覆盖率目标

### 推荐覆盖率标准

| 模块类型         | 最小覆盖率 | 推荐覆盖率 | 说明                 |
| ---------------- | ---------- | ---------- | -------------------- |
| **核心业务逻辑** | 90%        | 95%        | Store、Service等     |
| **工具函数**     | 85%        | 90%        | Utils、Helpers等     |
| **组件**         | 70%        | 80%        | Vue组件              |
| **API层**        | 80%        | 85%        | API调用和处理        |
| **整体项目**     | 75%        | 85%        | 所有代码的平均覆盖率 |

### 覆盖率监控

```json
// vitest.config.ts 中的覆盖率配置
{
  "coverage": {
    "thresholds": {
      "statements": 75,
      "branches": 70,
      "functions": 75,
      "lines": 75
    },
    "include": ["src/**/*.{js,ts,vue}"],
    "exclude": ["src/**/*.d.ts", "src/main.ts", "src/types/**/*"]
  }
}
```

## 🛠️ 工具推荐

### 测试工具

- **Vitest**: 快速的单元测试框架
- **@vue/test-utils**: Vue组件测试工具
- **@pinia/testing**: Pinia状态管理测试
- **MSW**: API Mock工具
- **Playwright**: 端到端测试
- **@faker-js/faker**: 测试数据生成

### IDE插件

- **Vitest Runner**: VSCode中运行测试
- **Jest Snippets**: 测试代码片段
- **Coverage Gutters**: 覆盖率可视化

### CI/CD集成

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

---

**参考资料**:

- [Vue Test Utils 官方文档](https://test-utils.vuejs.org/)
- [Vitest 官方文档](https://vitest.dev/)
- [Testing Library 最佳实践](https://testing-library.com/docs/guiding-principles)
- [Jest 测试最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)

**更新记录**:

- 2025-01-01: 创建初始版本
- 定期更新: 根据项目实践经验更新
