# 山东省思政课一体化中心 - 全栈项目

> 基于 Vue3 + TypeScript + Node.js + MongoDB 构建的现代化思政教育平台

本项目是一个功能完善的全栈应用，旨在提供一个集新闻资讯、教学资源、在线活动和后台管理于一体的思政教育平台。

## 🎯 项目概览

| 项目信息     | 内容                                 |
| ------------ | ------------------------------------ |
| **项目名称** | 山东省思想政治理论课一体化教育平台   |
| **生产域名** | https://horsduroot.com               |
| **服务器**   | 阿里云ECS (60.205.124.67)            |
| **管理后台** | https://horsduroot.com/admin         |
| **架构类型** | 双前端系统（公众前台 + 管理后台CMS） |

## 📚 项目文档与指南

本项目拥有详细的开发与架构文档，是理解项目、参与开发的关键。

- 📖 **[开发指南 (DEV_GUIDE.md)](./DEV_GUIDE.md)**: **首选阅读！** 包含项目概览、技术栈、环境配置、部署流程和最佳实践的完整指南
- 📂 **[架构文档](./dev-docs/)**: 包含前端、后端、状态管理、路由等多个层面的详细架构设计文档

## 🛠️ 技术栈架构

<details>
<summary><strong>点击查看详细技术栈</strong></summary>

### 前端技术栈

- **核心框架**: Vue 3.3.4 + TypeScript 5.2.0
- **构建工具**: Vite 4.4.9
- **UI组件库**: Element Plus 2.3.14 + Ant Design Vue 4.0.3
- **状态管理**: Pinia 2.1.6 + 持久化插件
- **路由**: Vue Router 4.2.4（嵌套路由 + 权限控制）
- **HTTP客户端**: Axios ^1.5.0

### 后端技术栈

- **运行环境**: Node.js (ES Modules)
- **Web框架**: Express 4.18.2
- **数据库**: MongoDB + Mongoose 8.1.1
- **认证**: JWT + bcrypt
- **进程管理**: PM2
- **安全组件**: helmet, cors, rate-limit

### 基础设施

- **数据库**: MongoDB (统一使用 `sdszk` 库名)
- **缓存**: Redis (会话管理、数据缓存)
- **Web服务器**: Nginx (SSL + 反向代理)
- **系统**: Ubuntu 20.04

</details>

## 🚀 快速启动

### 1. 环境要求

- Node.js >= 18.x
- MongoDB >= 6.x
- Redis (可选，用于缓存)
- pnpm >= 8.x (推荐)

### 2. 一键启动开发环境（推荐）

```bash
# 克隆项目
git clone <your-repository-url> sdszk-redesign
cd sdszk-redesign

# 🟢 一键启动完整开发环境
./scripts/development/dev-start.sh
# 自动启动: Redis、MongoDB、后端服务器、前端服务器
# 访问: http://localhost:5173 (前端) | http://localhost:3000 (API)

# 🔴 停止开发环境
./scripts/development/dev-stop.sh
# 自动清理所有相关进程和端口
```

### 3. 手动启动（传统方式）

```bash
# 1. 安装依赖
npm install                          # 前端依赖
cd server && npm install && cd ..    # 后端依赖

# 2. 环境配置初始化
./scripts/development/setup-dev-env.sh    # 自动创建.env配置

# 3. 启动服务（推荐顺序）
# 终端1：先启动后端
npm run server:dev                   # 后端开发服务器 (localhost:3000)

# 终端2：再启动前端
npm run dev                          # 前端开发服务器 (localhost:5173)
```

## 🏗️ 项目结构

```
sdszk-redesign/
├── src/                    # 前端源代码 (Vue 3)
│   ├── api/                # API接口定义
│   ├── components/         # 公共组件
│   ├── stores/             # Pinia状态管理
│   ├── views/              # 页面视图
│   └── ...
├── server/                 # 后端源代码 (Node.js + Express)
│   ├── controllers/        # 控制器 (业务逻辑)
│   ├── models/             # Mongoose数据模型
│   ├── routes/             # API路由定义
│   ├── middleware/         # Express中间件
│   └── ...
├── scripts/                # 自动化脚本
│   ├── development/        # 开发环境脚本
│   ├── deployment/         # 部署脚本
│   ├── database/           # 数据库管理脚本
│   └── testing/            # 测试脚本
├── dev-docs/               # 详细架构文档
└── DEV_GUIDE.md           # 核心开发指南
```

## 🔧 环境配置

### 配置文件对应关系

| 环境     | 前端配置           | 后端配置                 | 用途                 |
| -------- | ------------------ | ------------------------ | -------------------- |
| **开发** | `.env.development` | `server/.env`            | 本地开发，API: /api  |
| **生产** | `.env.aliyun`      | `server/.env.production` | 阿里云部署，同域部署 |

### 关键环境变量

#### 前端配置

```bash
# .env.development / .env.aliyun
VITE_API_BASE_URL=/api              # API基础路径
VITE_APP_DEBUG=true/false          # 调试模式
VITE_CACHE_ENABLED=true            # 缓存开关
```

#### 后端配置

```bash
# server/.env / server/.env.production
MONGODB_URI=mongodb://localhost:27017/sdszk  # 数据库连接
JWT_SECRET=<生产环境强密钥>                   # JWT密钥
FRONTEND_URL=https://horsduroot.com          # 前端域名
REDIS_HOST=127.0.0.1                        # Redis主机
PORT=3000                                    # 服务端口
```

## 🚀 生产环境部署

项目的部署流程已高度自动化，通过脚本完成。

### 前端部署

```bash
# 完整前端部署流程
npm run build:aliyun         # 构建生产版本 (.env.aliyun)
npm run deploy:aliyun        # 部署到阿里云服务器

# 或直接使用脚本：
./scripts/deployment/deploy.sh
```

### 后端部署

```bash
# 完整后端部署流程
npm run deploy:backend       # 部署后端服务

# 或直接使用脚本：
./scripts/deployment/deploy-backend.sh
```

### Nginx 配置

```bash
# 更新 Nginx 配置
./scripts/deployment/deploy-nginx.sh
```

> **注意**: 执行部署脚本前，请确保已根据 `DEV_GUIDE.md` 正确配置了服务器免密登录和脚本中的目标路径。

## 💾 数据库管理

项目提供了完整的数据库管理脚本：

```bash
# 快速数据库同步（推荐日常使用）
npm run db:sync

# 完整数据库同步工具（交互式菜单）
npm run db:sync-full

# SSH隧道连接（只读访问）
npm run db:tunnel

# 数据库验证
npm run db:verify
```

## 🧪 测试

项目配置了完整的测试套件：

```bash
# 单元测试
npm run test                 # Vitest 单元测试
npm run test:coverage       # 测试覆盖率报告

# E2E测试
npm run test:e2e            # Playwright E2E测试
npm run test:e2e:ui         # 可视化测试界面

# 代码质量检查
npm run lint                # ESLint 检查
npm run format              # Prettier 格式化
```

## 🛠️ 开发工具脚本

```bash
# 环境诊断和清理
./scripts/development/diagnose-backend.sh    # 后端环境诊断
./scripts/development/cleanup-project.sh     # 项目清理
./scripts/development/clear-cache.sh         # 清理缓存
```

## 🤝 贡献指南

欢迎参与项目贡献！请遵循以下流程：

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feat/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feat/AmazingFeature`)
5. 提交 Pull Request

### Git 提交规范

```bash
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具链更新
```

请确保您的代码遵循项目已配置的 ESLint 和 Prettier 规范。

## 📚 相关文档

- 📖 [DEV_GUIDE.md](./DEV_GUIDE.md) - 完整开发指南
- 📂 [dev-docs/](./dev-docs/) - 详细架构文档
- 🔧 [scripts/](./scripts/) - 自动化脚本说明

## 🎊 快速验证

### 验证开发环境

```bash
# 检查前端服务
curl http://localhost:5173

# 检查后端API
curl http://localhost:3000/api/health
```

### 验证生产环境

```bash
# 检查生产站点
curl https://horsduroot.com

# 检查API健康状态
curl https://horsduroot.com/api/health
```

## 📄 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。
