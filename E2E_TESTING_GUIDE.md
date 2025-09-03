# E2E 测试使用指南

> 山东省思政课一体化中心 - Playwright E2E 测试完整指南

## 🎯 概览

本项目使用 Playwright 进行端到端（E2E）测试，确保前端应用和后端API的集成功能正常工作。

## 🚀 快速开始

### 1. 启动开发环境

**重要**: 必须先启动开发服务器，再运行E2E测试

```bash
# 启动所有开发服务（前端+后端+数据库）
bash scripts/development/dev-start.sh
```

### 2. 运行测试

```bash
# 运行所有E2E测试
npm run test:e2e

# 运行基础功能测试
npm run test:e2e:basic

# 运行性能测试
npm run test:e2e:performance

# 以UI模式运行测试（可视化调试）
npm run test:e2e:ui

# 运行测试并生成详细报告
npm run test:e2e:ci
```

### 3. 停止开发环境

```bash
# 停止所有开发服务
bash scripts/development/dev-stop.sh
```

## 📋 测试套件说明

### 基础功能测试 (`basic.spec.ts`)

- ✅ **首页加载测试** - 验证首页正常加载和标题正确
- ✅ **页面结构测试** - 检查Vue应用根元素和基本DOM结构
- ✅ **响应式设计测试** - 验证桌面端和移动端视口适配
- ✅ **API健康检查** - 确认后端API服务可访问
- ✅ **404错误处理** - 测试不存在页面的处理机制

### 性能测试 (`performance.spec.ts`)

- 📊 **基础性能测试** - 页面加载时间和DOM渲染性能
- 🔍 **资源加载测试** - 网络请求数量和资源类型分析
- 💾 **内存和CPU监控** - 性能指标收集和分析
- 🖱️ **交互性能测试** - 页面元素可交互性验证
- 🔄 **稳定性测试** - 多次加载测试，检测性能一致性

## 🛠️ 配置说明

### 服务要求

E2E测试需要以下服务运行：

- **前端服务**: `http://localhost:5173` (Vite开发服务器)
- **后端API**: `http://localhost:3000` (Express服务器)
- **数据库**: MongoDB (由dev-start.sh自动启动)

### 健康检查机制

测试开始前会自动执行健康检查：

```
🔍 执行服务健康检查...
✅ 前端服务 (http://localhost:5173) - 状态码: 200
✅ 后端API服务 (http://localhost:3000) - 状态码: 200
✅ 所有服务健康检查通过，开始运行测试
```

如果服务未启动，会显示明确的解决方案：

```
❌ 服务健康检查失败!

🔧 解决方案：
1. 启动开发环境：bash scripts/development/dev-start.sh
2. 等待服务启动完成（约10-30秒）
3. 重新运行测试：npm run test:e2e:basic
4. 测试完成后停止服务：bash scripts/development/dev-stop.sh
```

## 📊 性能期望值

### 基础性能指标

- **DOM加载时间**: < 15秒
- **完整加载时间**: < 30秒
- **首屏渲染**: < 2秒
- **API响应**: < 500ms

### 稳定性指标

- **加载时间变异系数**: < 20 (超过会显示警告)
- **成功率**: 100%
- **错误恢复**: 自动重试机制

## 🔧 故障排查

### 常见问题

#### 1. 服务未启动

```
Error: 前端服务 (http://localhost:5173) 不可访问
```

**解决方案**: 运行 `bash scripts/development/dev-start.sh`

#### 2. 端口被占用

```
Error: listen EADDRINUSE: address already in use
```

**解决方案**:

- 检查端口占用: `lsof -i :5173` 或 `lsof -i :3000`
- 停止占用进程或运行 `bash scripts/development/dev-stop.sh`

#### 3. 浏览器未安装

```
Executable doesn't exist at .../chrome-mac/headless_shell
```

**解决方案**: 运行 `npx playwright install`

#### 4. 测试超时

```
Test timeout of 30000ms exceeded
```

**解决方案**:

- 检查网络连接
- 确认服务器响应正常
- 考虑增加超时时间

### 调试技巧

#### 1. 可视化调试

```bash
# 打开测试UI界面
npm run test:e2e:ui

# 以有头模式运行（显示浏览器）
npm run test:e2e:headed

# 调试模式（逐步执行）
npm run test:e2e:debug
```

#### 2. 查看测试报告

```bash
# 生成并查看HTML报告
npx playwright show-report

# 查看详细日志
npm run test:e2e:ci
```

#### 3. 截图和录制

测试失败时会自动生成：

- 📸 失败时截图
- 🎥 失败时视频录制
- 📋 详细执行轨迹

## 📁 文件结构

```
tests/
├── e2e/
│   ├── basic.spec.ts          # 基础功能测试
│   └── performance.spec.ts    # 性能测试
├── health-check.ts            # 服务健康检查
└── test-results/              # 测试结果和报告
```

## 🔄 CI/CD 集成

### GitHub Actions 配置

```yaml
- name: 运行E2E测试
  run: |
    bash scripts/development/dev-start.sh
    npm run test:e2e:ci
    bash scripts/development/dev-stop.sh
```

### 环境变量

- `CI=true` - 启用CI模式（更严格的超时和重试）
- 自动启用无头模式和优化的浏览器启动参数

## 🎯 最佳实践

### 1. 测试前准备

- ✅ 确保代码已提交并推送
- ✅ 检查本地开发环境正常
- ✅ 运行单元测试通过

### 2. 测试执行

- ✅ 始终使用脚本启动/停止服务
- ✅ 等待服务完全启动后再运行测试
- ✅ 关注测试输出和性能指标

### 3. 测试后处理

- ✅ 查看测试报告分析结果
- ✅ 保存重要的性能数据
- ✅ 及时停止开发服务释放资源

## 📈 持续改进

### 性能优化

- 定期监控加载时间趋势
- 优化资源加载策略
- 改进缓存机制

### 测试扩展

- 添加更多用户场景测试
- 增加端到端业务流程测试
- 扩展跨浏览器兼容性测试

---

**更新日期**: 2025-09-03
**版本**: 1.0 - 初始版本
**维护者**: 开发团队

如有问题，请参考 `DEV_GUIDE.md` 或联系开发团队。
