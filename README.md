# 山东省思政课一体化中心平台

> Vue3 + TypeScript + Node.js + MongoDB 的全栈 CMS / 内容与权限管理平台

本仓库包含前台展示与后台管理（双入口），支持新闻/资源管理、用户与角色权限（RBAC）、活动与日志等核心业务功能。完整深入文档请跳转：`docs/README.md`。

## 🎯 项目概览

| 项目信息     | 内容                               |
| ------------ | ---------------------------------- |
| **项目名称** | 山东省大中小学思政课一体化中心平台 |
| **生产域名** | https://www.sdszk.cn               |
| **服务器**   | 阿里云 (8.141.113.21)              |
| **管理后台** | https://www.sdszk.cn/admin         |
| **架构类型** | 双前端系统(公众前台 + 管理后台CMS) |

## 🏗️ 技术栈速览

| 层   | 核心技术                      | 说明                             |
| ---- | ----------------------------- | -------------------------------- |
| 前端 | Vue 3.5 / TypeScript / Vite   | 按需加载 + 模块化 API 封装       |
| UI   | Element Plus / Ant Design Vue | 组合使用，后续将评估裁剪         |
| 状态 | Pinia                         | 支持持久化与权限派生             |
| 后端 | Node.js / Express             | 模块化路由 + 中间件链            |
| 数据 | MongoDB + Mongoose            | 主要模型见下方结构               |
| 缓存 | Redis                         | 热点数据 / 验证码 / 未来队列预留 |
| 进程 | PM2                           | 进程守护 / 健康检查脚本配合      |
| 代理 | Nginx                         | SSL / 反向代理 / 静态托管        |

## 🚀 快速开始（开发）

前置依赖：Node.js >= 18，MongoDB 6+（本地或远程），可选 Redis。

```bash
# 安装依赖
npm install && cd server && npm install && cd ..

# 一键启动（推荐：自动启动前后端+依赖）
./scripts/development/dev-start.sh

# 停止
./scripts/development/dev-stop.sh

# 或手动（如需调试分离进程）
npm run server:dev &   # API :3000
npm run dev            # Frontend :5173
```

健康检查：`curl http://localhost:3000/api/health` & `http://localhost:5173`。

## � 权限与安全（概述）

RBAC（三层：用户/角色/权限）+ 基于 `module:action` 语义的细粒度控制；前端基于指令/路由守卫，后端统一 `protect -> permission` 中间件。初始化或重置：`node scripts/database/init-roles-permissions.js`。详细模型与策略将在 `docs/security/` 中提供（Batch 2）。

## 🏢 业务范围（精简）

内容（新闻 / 资源 / 分类） + 用户交互（收藏 / 浏览 / 操作日志） + 后台管理（角色 / 权限 / 设置）。完整字段与行为：参考后续架构文档分拆。

## 📁 项目结构

```
sdszk-redesign/
├── src/                    # 前端源码
│   ├── views/             # 页面组件
│   │   ├── News.vue      # 前台新闻
│   │   └── admin/        # 管理后台
│   ├── api/modules/       # API封装
│   ├── stores/           # Pinia状态管理
│   └── components/       # 组件库
├── server/                # 后端源码
│   ├── controllers/      # 业务控制器
│   ├── models/          # 数据模型
│   ├── routes/          # API路由
│   └── middleware/      # 中间件
├── scripts/              # 自动化脚本
│   ├── development/     # 开发环境
│   ├── deployment/      # 部署脚本
│   └── database/        # 数据库管理
└── docs/                # 详细文档
```

## 🚀 阿里云部署

**总是使用scripts/deployment目录下的脚本进行部署，避免遗漏步骤。**

### 🎯 部署工具概览

| 工具                  | 用途           | 特点                         |
| --------------------- | -------------- | ---------------------------- |
| `deploy-aliyun.sh`    | 统一部署管理器 | 功能完整、错误处理、回滚支持 |
| `quick-deploy.sh`     | 快速部署工具   | 简化操作、快速迭代           |
| `check-deployment.sh` | 部署状态检查   | 全面诊断、健康评分           |
| `pm2-manager.sh`      | PM2服务管理    | 进程维护、日志监控           |

### ⚡ 快速部署（推荐）

## � 部署（速览）

使用 `scripts/deployment/` 下脚本（`quick-deploy.sh` / `deploy-aliyun.sh` / 健康检查 `check-deployment.sh`）。详见：`docs/deployment-guide.md`。

1. **部署前检查**：确保代码已提交、测试通过、配置文件完整
2. **选择合适工具**：日常开发用快速部署，生产发布用统一管理器
3. **部署后验证**：运行健康检查确保服务正常
4. **监控维护**：定期检查服务状态和日志

### 环境配置

- **开发环境**: `.env.development` + `server/.env`
- **生产环境**: `.env.aliyun` + `server/.env.production`

## 🧪 测试（概览）

Vitest（单元 & 组件）+ Playwright（E2E）+ 计划中的覆盖率门禁（见测试重构后文档）。暂存策略文档：`docs/testing-best-practices.md`（即将拆分）。

## 🛠️ 常用脚本

更多脚本用途即将汇总至：`docs/reference/scripts-catalog.md`

```bash
./scripts/development/dev-start.sh   # 启动所有
./scripts/development/dev-stop.sh    # 停止所有
./scripts/deployment/check-deployment.sh  # 部署健康检查
```

## 🔗 API（示例路径）

公众：`/api/news`, `/api/resources`, `/api/auth`；后台：`/api/admin/*`。未来将集中到 `docs/reference/api-index.md`。

## 🤝 开发规范

### Git提交规范

```bash
feat: 新功能        fix: 修复bug
docs: 文档更新      style: 格式调整
refactor: 重构      test: 测试
chore: 构建工具     perf: 性能优化
```

### 代码规范

- ES Modules (`"type": "module"`)
- TypeScript严格模式
- ESLint + Prettier自动格式化
- Husky Git hooks质量控制

## 🚨 故障排除

### 常见问题

```bash
# 端口冲突
./scripts/development/dev-stop.sh    # 优雅停止开发环境

# 数据库连接
brew services restart mongodb-community
redis-server --daemonize yes

# 依赖问题
rm -rf node_modules package-lock.json
npm install
```

### 验证环境

```bash
# 开发环境
curl http://localhost:5173
curl http://localhost:3000/api/health

# 生产环境
curl https://www.sdszk.cn/api/health
```

## 🤖 AI 协作（临时保留）

### 环境变量访问最佳实践

由于安全策略，大模型无法直接读取 `.env` 文件。当需要了解环境变量配置时，请参考：

1. **📖 环境变量文档** - [`docs/environment-variables.md`](./docs/environment-variables.md)
   - 包含完整的环境变量说明
   - 前端和后端配置示例
   - 安全最佳实践指南

2. **🔧 模板文件** - 可通过以下方式查看配置结构：

   ```bash
   # 查看环境变量模板（去敏感化）
   cat .env.example          # 前端环境变量模板
   cat server/.env.example   # 后端环境变量模板
   ```

3. **📋 配置文件位置**：
   - **前端**: `.env`, `.env.development`, `.env.aliyun`
   - **后端**: `server/.env`, `server/.env.test`, `server/.env.ci`

### 大模型工作流程建议

1. **环境变量需求** → 查阅 `docs/environment-variables.md`
2. **项目结构了解** → 参考上方"项目结构"章节
3. **API接口信息** → 查看"API路由"章节
4. **部署相关** → 使用 `scripts/deployment/` 目录下的脚本
5. **开发环境** → 使用 `scripts/development/` 目录下的脚本

### 安全注意事项

- ✅ 所有真实的敏感信息（密码、密钥）都在 `.env` 文件中，已被安全过滤
- ✅ 可安全讨论环境变量结构和配置方法
- ✅ 模板文件 (`.env.example`) 仅包含示例值，可安全访问
- ⚠️ 如需提供实际配置，请手动去敏感化后分享

## 📚 文档导航

- 文档首页：`docs/README.md`
- 部署：`docs/deployment-guide.md`
- 环境变量：`docs/environment-variables.md`
- 架构：`docs/architecture/system-overview.md`
- 模块详解：`docs/architecture/backend-modules.md`
- 测试策略：`docs/quality/testing-strategy.md`
- 测试基线：`docs/quality/testing-baseline.md`
- 测试路线：`docs/quality/testing-roadmap.md`
- 安全（RBAC）：`docs/security/rbac-model.md`
- 认证策略：`docs/security/auth-strategy.md`
- 历史审查：`docs/archive/2025-09-audit.md`

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

本 README 专注“入口 + 导航”，深度内容请进入 `docs/`。
