> ⛳ 行动清单内容已被拆分为：
>
> - `quality/testing-baseline.md` 覆盖现状与差距
> - `quality/testing-roadmap.md` 分阶段路线
>   新规划请查看以上文件。本文件暂作为历史参考。

# （Legacy）测试改进行动清单

> **基于**: [测试覆盖率评估报告](./testing-coverage-assessment.md)
> **目标**: 从 2.93% 提升到 85% 覆盖率
> **时间**: 2个月计划

## 🚀 阶段一：紧急修复 (第1周)

### 任务 1: 修复失败测试 ⚡

**截止时间**: 本周三
**负责人**: [@开发团队]
**预估工时**: 4小时

- [ ] **修复 `api.test.ts`** (2小时)

  ```bash
  # 问题: Mock配置错误
  # 文件: __tests__/unit/utils/api.test.ts
  # 解决: 修复 vi.mock 配置，确保 createApi 导出
  ```

  - [ ] 检查 `src/utils/api.ts` 的实际导出
  - [ ] 修复 mock 配置使用 `importOriginal`
  - [ ] 验证测试通过

- [ ] **修复 `logger.test.ts`** (1小时)

  ```bash
  # 问题: 生产环境判断逻辑错误
  # 文件: __tests__/unit/utils/logger.test.ts
  # 解决: 修复环境变量 mock 时机
  ```

  - [ ] 调整 mock 执行顺序
  - [ ] 确保生产环境测试隔离
  - [ ] 验证所有用例通过

- [ ] **修复 `performance.test.ts`** (1小时)

  ```bash
  # 问题: PerformanceResourceTiming 类型问题
  # 文件: __tests__/unit/utils/performance.test.ts
  # 解决: 完善类型定义和 mock 数据
  ```

  - [ ] 补充缺失的类型属性
  - [ ] 修复 mock 数据结构
  - [ ] 验证类型检查通过

### 任务 2: API核心模块测试 🔌

**截止时间**: 本周五
**负责人**: [@后端开发]
**预估工时**: 8小时

- [ ] **创建 API 测试基础设施** (2小时)

  ```typescript
  // __tests__/unit/api/setup.ts
  // 统一的 API 测试工具和 mock 配置
  ```

  - [ ] 创建 API mock 工具
  - [ ] 设置统一的测试数据
  - [ ] 配置请求/响应拦截

- [ ] **新闻 API 测试** (2小时)

  ```bash
  # 文件: __tests__/unit/api/news.test.ts
  # 覆盖: src/api/modules/news/
  ```

  - [ ] GET /api/news 列表接口测试
  - [ ] GET /api/news/:id 详情接口测试
  - [ ] POST /api/news 创建接口测试
  - [ ] PUT /api/news/:id 更新接口测试
  - [ ] DELETE /api/news/:id 删除接口测试

- [ ] **资源 API 测试** (2小时)

  ```bash
  # 文件: __tests__/unit/api/resources.test.ts
  # 覆盖: src/api/modules/resources/
  ```

  - [ ] 资源列表和筛选测试
  - [ ] 资源上传和下载测试
  - [ ] 资源分类管理测试

- [ ] **用户 API 测试** (2小时)

  ```bash
  # 文件: __tests__/unit/api/user.test.ts
  # 覆盖: src/api/modules/user/
  ```

  - [ ] 用户认证接口测试
  - [ ] 用户信息管理测试
  - [ ] 权限验证测试

### 任务 3: Composables 基础测试 🎯

**截止时间**: 下周二
**负责人**: [@前端开发]
**预估工时**: 6小时

- [ ] **usePermission 测试** (3小时)

  ```bash
  # 文件: __tests__/unit/composables/usePermission.test.ts
  # 覆盖: src/composables/usePermission.ts
  ```

  - [ ] 权限检查逻辑测试
  - [ ] 角色验证测试
  - [ ] 权限更新响应测试

- [ ] **useRecentlyViewed 测试** (3小时)

  ```bash
  # 文件: __tests__/unit/composables/useRecentlyViewed.test.ts
  # 覆盖: src/composables/useRecentlyViewed.ts
  ```

  - [ ] 浏览记录添加测试
  - [ ] 记录持久化测试
  - [ ] 记录清理逻辑测试

**阶段一完成标准**:

- ✅ 所有测试通过 (0个失败)
- ✅ 覆盖率提升到 15%+
- ✅ CI/CD 流程正常

---

## 🏗️ 阶段二：核心业务 (第2-3周)

### 任务 4: 关键组件测试 🎨

**截止时间**: 第2周周五
**负责人**: [@前端团队]
**预估工时**: 16小时

- [ ] **认证组件测试** (4小时)

  ```bash
  # 组件: src/components/auth/
  # 测试: __tests__/unit/components/auth/
  ```

  - [ ] LoginForm.vue 测试
  - [ ] UserProfile.vue 测试
  - [ ] PermissionGate.vue 测试

- [ ] **数据展示组件测试** (6小时)

  ```bash
  # 组件: src/components/common/
  # 测试: __tests__/unit/components/common/
  ```

  - [ ] DataTable.vue 测试
  - [ ] Pagination.vue 测试
  - [ ] SearchBox.vue 测试
  - [ ] FilterPanel.vue 测试

- [ ] **表单组件测试** (6小时)

  ```bash
  # 组件: src/components/forms/
  # 测试: __tests__/unit/components/forms/
  ```

  - [ ] NewsForm.vue 测试
  - [ ] ResourceForm.vue 测试
  - [ ] FileUpload.vue 测试

### 任务 5: API集成测试 🔗

**截止时间**: 第3周周三
**负责人**: [@全栈开发]
**预估工时**: 12小时

- [ ] **请求/响应流程测试** (4小时)

  ```bash
  # 文件: __tests__/integration/api-flows.test.ts
  ```

  - [ ] 完整 CRUD 流程测试
  - [ ] 请求重试机制测试
  - [ ] 响应数据转换测试

- [ ] **错误处理集成测试** (4小时)

  ```bash
  # 文件: __tests__/integration/error-handling.test.ts
  ```

  - [ ] 网络错误处理测试
  - [ ] 服务器错误处理测试
  - [ ] 用户错误提示测试

- [ ] **认证流程集成测试** (4小时)

  ```bash
  # 文件: __tests__/integration/auth-flow.test.ts
  ```

  - [ ] 登录/登出完整流程
  - [ ] Token 刷新机制测试
  - [ ] 权限验证集成测试

### 任务 6: 服务层测试 ⚙️

**截止时间**: 第3周周五
**负责人**: [@架构师]
**预估工时**: 8小时

- [ ] **业务逻辑服务测试** (4小时)

  ```bash
  # 文件: __tests__/unit/services/
  ```

  - [ ] 数据验证服务测试
  - [ ] 业务规则服务测试
  - [ ] 通知服务测试

- [ ] **数据处理服务测试** (4小时)

  ```bash
  # 覆盖: src/services/
  ```

  - [ ] 数据转换服务测试
  - [ ] 缓存服务测试
  - [ ] 文件处理服务测试

**阶段二完成标准**:

- ✅ 核心组件测试覆盖
- ✅ API集成测试完成
- ✅ 覆盖率达到 40%+

---

## 🚢 阶段三：全面覆盖 (第4-6周)

### 任务 7: 页面级组件测试 📱

**截止时间**: 第5周
**负责人**: [@前端团队]
**预估工时**: 24小时

- [ ] **管理后台页面测试** (12小时)

  ```bash
  # 页面: src/views/admin/
  # 测试: __tests__/unit/views/admin/
  ```

  - [ ] Dashboard.vue 测试
  - [ ] NewsManagement.vue 测试
  - [ ] ResourceManagement.vue 测试
  - [ ] UserManagement.vue 测试

- [ ] **用户界面页面测试** (8小时)

  ```bash
  # 页面: src/views/
  # 测试: __tests__/unit/views/
  ```

  - [ ] Home.vue 测试
  - [ ] NewsDetail.vue 测试
  - [ ] ResourceCenter.vue 测试

- [ ] **路由和导航测试** (4小时)

  ```bash
  # 文件: __tests__/unit/router/
  ```

  - [ ] 路由守卫测试
  - [ ] 导航组件测试
  - [ ] 面包屑导航测试

### 任务 8: 端到端集成测试 🔄

**截止时间**: 第6周
**负责人**: [@QA团队]
**预估工时**: 16小时

- [ ] **用户工作流测试** (8小时)

  ```bash
  # 文件: __tests__/e2e/workflows/
  ```

  - [ ] 用户注册登录流程
  - [ ] 内容浏览和搜索流程
  - [ ] 管理员内容管理流程

- [ ] **数据流完整性测试** (4小时)

  ```bash
  # 文件: __tests__/e2e/data-flows/
  ```

  - [ ] 数据创建到展示完整流程
  - [ ] 数据更新同步测试
  - [ ] 数据删除清理测试

- [ ] **性能和错误边界测试** (4小时)

  ```bash
  # 文件: __tests__/e2e/performance/
  ```

  - [ ] 页面加载性能测试
  - [ ] 大数据量处理测试
  - [ ] 错误边界恢复测试

**阶段三完成标准**:

- ✅ 页面级测试全覆盖
- ✅ 端到端测试建立
- ✅ 覆盖率达到 75%+

---

## 🎯 阶段四：优化完善 (第7-8周)

### 任务 9: 边界和异常测试 ⚠️

**截止时间**: 第7周
**预估工时**: 12小时

- [ ] **边界条件测试** (6小时)
  - [ ] 空数据处理测试
  - [ ] 大数据量处理测试
  - [ ] 极限参数测试

- [ ] **异常场景测试** (6小时)
  - [ ] 网络断开恢复测试
  - [ ] 并发操作冲突测试
  - [ ] 内存泄漏检测测试

### 任务 10: 性能和质量测试 🚀

**截止时间**: 第8周
**预估工时**: 14小时

- [ ] **性能测试** (8小时)
  - [ ] 组件渲染性能测试
  - [ ] API响应时间测试
  - [ ] 内存使用监控测试

- [ ] **可访问性测试** (6小时)
  - [ ] 键盘导航测试
  - [ ] 屏幕阅读器兼容测试
  - [ ] 颜色对比度测试

**阶段四完成标准**:

- ✅ 边界和异常测试完成
- ✅ 性能和可访问性验证
- ✅ 覆盖率达到 85%+

---

## 📋 每日检查清单

### 开发者日常

- [ ] 新增代码同时编写测试
- [ ] 提交前运行完整测试套件
- [ ] 确保覆盖率不低于当前水平
- [ ] 更新相关文档

### 团队周度回顾

- [ ] 检查覆盖率趋势
- [ ] 回顾失败测试原因
- [ ] 优化测试执行效率
- [ ] 分享测试最佳实践

## 🛠️ 工具和资源

### 推荐工具

```bash
# 安装测试相关依赖
npm install --save-dev @vue/test-utils@next
npm install --save-dev @vitest/coverage-v8
npm install --save-dev happy-dom
npm install --save-dev msw
```

### 有用的命令

```bash
# 运行特定模块测试
npm test -- __tests__/unit/api

# 生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm test -- --watch

# 运行端到端测试
npm run test:e2e
```

### 参考资料

- [Vue Test Utils 官方文档](https://test-utils.vuejs.org/)
- [Vitest 官方文档](https://vitest.dev/)
- [测试最佳实践指南](./testing-best-practices.md)

## 🎉 完成标志

### 短期目标 (1个月)

- ✅ 所有失败测试修复
- ✅ 40%+ 语句覆盖率
- ✅ 核心业务逻辑测试覆盖
- ✅ CI/CD 集成完成

### 最终目标 (2个月)

- ✅ 85%+ 语句覆盖率
- ✅ 完整的测试金字塔
- ✅ 自动化质量门禁
- ✅ 团队测试文化建立

---

**更新频率**: 每周更新进度
**责任人**: 技术负责人
**审核人**: 项目经理

> 💡 **重要提醒**: 每完成一个任务，请在对应的复选框打勾，并更新完成时间和实际工时。
