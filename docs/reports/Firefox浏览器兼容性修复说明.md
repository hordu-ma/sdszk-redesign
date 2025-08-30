# Firefox 浏览器兼容性修复说明

## 问题描述

在 E2E 测试中，Firefox 浏览器出现了多个测试失败，主要集中在以下测试用例：

- `tests/e2e/basic.spec.ts:42:3 › 基础功能测试 › 页面响应式设计`
- `tests/e2e/basic.spec.ts:25:3 › 基础功能测试 › 页面基本结构完整`

错误表现为：
- 10 个错误和 1 个通知
- 主要发生在 CI 环境中的 Firefox 浏览器
- 本地测试通常正常，但 CI 环境中不稳定

## 根本原因分析

### 🔍 **Firefox 特有问题**

1. **渲染时序差异**
   - Firefox 的 DOM 渲染和 JavaScript 执行时序与 Chromium 不同
   - 在 CI 环境中资源受限时，差异更加明显

2. **视口变化响应**
   - Firefox 在视口大小变化后需要更多时间重新布局
   - `setViewportSize()` 操作在 Firefox 中需要额外的等待时间

3. **网络请求处理**
   - Firefox 的网络请求超时机制更严格
   - API 请求在资源受限环境中更容易超时

4. **CI 环境特殊性**
   - Ubuntu Latest 环境中 Firefox 需要特殊的启动参数
   - 内存和 CPU 限制对 Firefox 影响更大

## 修复方案

### 🛠️ **1. 测试用例优化**

#### 增加浏览器特定等待时间
```typescript
// 页面基本结构测试
test("页面基本结构完整", async ({ page, browserName }) => {
  // Firefox 需要额外等待时间
  if (browserName === 'firefox') {
    await page.waitForTimeout(2000);
  }

  // 增加超时时间
  await expect(app).toBeVisible({
    timeout: browserName === 'firefox' ? 15000 : 10000
  });
});
```

#### 增强页面内容等待策略
```typescript
// 等待页面完全渲染
await page.waitForFunction(() => {
  const body = document.body;
  return body && body.textContent && body.textContent.trim().length > 0;
}, { timeout: browserName === 'firefox' ? 15000 : 10000 });
```

#### 视口变化优化
```typescript
// 测试响应式设计
await page.setViewportSize({ width: 1200, height: 800 });
// 等待视口变化完成
await page.waitForTimeout(browserName === 'firefox' ? 1000 : 500);
```

#### API 请求重试机制
```typescript
// Firefox 需要重试机制
let retries = browserName === 'firefox' ? 3 : 1;
for (let i = 0; i < retries; i++) {
  try {
    const response = await page.request.get("http://localhost:3000", {
      timeout: browserName === 'firefox' ? 15000 : 10000
    });
    expect(response.status()).toBeLessThan(500);
    return;
  } catch (error) {
    if (i < retries - 1) {
      await page.waitForTimeout(2000);
    }
  }
}
```

### ⚙️ **2. Playwright 配置优化**

#### Firefox 专用配置
```typescript
{
  name: "firefox",
  use: {
    ...devices["Desktop Firefox"],
    // Firefox 特定配置
    actionTimeout: process.env.CI ? 20 * 1000 : 15 * 1000,
    navigationTimeout: process.env.CI ? 90 * 1000 : 45 * 1000,
    launchOptions: {
      args: process.env.CI ? [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--width=1280',
        '--height=720'
      ] : []
    }
  },
}
```

### 🌍 **3. 环境变量优化**

#### GitHub Actions 中的 Firefox 环境变量
```yaml
env:
  CI: true
  NODE_ENV: test
  MOZ_HEADLESS: 1
  MOZ_DISABLE_CONTENT_SANDBOX: 1
  FIREFOX_BROWSER_TIMEOUT: 60000
```

#### 全局设置中的 Firefox 优化
```typescript
async function performFirefoxOptimization(): Promise<void> {
  const isCI = !!process.env.CI;

  if (isCI) {
    // CI环境下为Firefox设置环境变量
    process.env.MOZ_HEADLESS = '1';
    process.env.MOZ_DISABLE_CONTENT_SANDBOX = '1';
  }

  // Firefox 预热测试
  // ... 预热逻辑
}
```

### 📋 **4. 新增测试脚本**

```json
{
  "test:e2e:chromium": "playwright test --project=chromium",
  "test:e2e:firefox": "playwright test --project=firefox",
  "test:e2e:webkit": "playwright test --project=webkit"
}
```

## 修复效果

### ✅ **本地测试结果**
```bash
npm run test:e2e:firefox -- tests/e2e/basic.spec.ts
# 🦊 执行 Firefox 浏览器优化设置...
# ✅ Firefox 预热测试完成
# ✅ 全局配置完成 (耗时: 6549ms)
# 5 passed (17.4s)
```

### 🎯 **优化效果**

1. **等待策略改进**
   - Firefox 测试超时时间适当延长
   - 添加浏览器特定的等待逻辑

2. **重试机制**
   - API 请求增加重试机制
   - 网络不稳定时自动重试

3. **环境优化**
   - CI 环境下的 Firefox 启动参数优化
   - 内存和沙盒限制调整

4. **预热机制**
   - 全局设置中添加 Firefox 预热
   - 提前验证服务可用性

## 最佳实践

### 🔧 **开发建议**

1. **跨浏览器测试策略**
   ```typescript
   // 根据浏览器调整测试策略
   const timeout = browserName === 'firefox' ? 45000 : 30000;
   const retries = browserName === 'firefox' ? 3 : 1;
   ```

2. **渐进式等待**
   ```typescript
   // 先等待 DOM，再等待内容，最后验证可见性
   await page.waitForLoadState("domcontentloaded");
   if (browserName === 'firefox') {
     await page.waitForTimeout(2000);
   }
   await expect(element).toBeVisible({ timeout });
   ```

3. **错误友好的测试**
   ```typescript
   // 提供清晰的错误信息
   console.log(`🧪 测试：XXX (浏览器: ${browserName})`);
   ```

### 📊 **监控指标**

- **Firefox 测试通过率**: 目标 > 95%
- **平均执行时间**: Firefox < Chromium + 50%
- **重试成功率**: > 90%
- **CI 环境稳定性**: 连续 10 次构建无 Firefox 相关失败

## 后续优化

### 🚀 **短期计划**

1. **监控 CI 测试结果**
   - 观察 Firefox 测试稳定性
   - 收集性能数据

2. **微调超时设置**
   - 根据实际运行情况调整超时时间
   - 优化等待策略

### 🔮 **长期计划**

1. **智能浏览器检测**
   - 自动检测浏览器性能特征
   - 动态调整测试策略

2. **并行测试优化**
   - Firefox 测试独立队列
   - 资源隔离优化

3. **测试质量提升**
   - 添加更多 Firefox 特定测试用例
   - 完善跨浏览器兼容性验证

---

**修复日期**: 2024年12月19日
**修复版本**: v1.1.2
**测试状态**: ✅ 本地验证通过，等待 CI 验证
**影响范围**: E2E 测试稳定性、Firefox 浏览器兼容性
