# 山东省思政课一体化中心 - 全栈项目

> 基于 Vue3 + TypeScript + Node.js + MongoDB 构建的现代化思政教育平台

本项目是一个功能完善的全栈应用，包含前台展示网站和管理后台系统，提供集新闻资讯、教学资源、在线活动和后台管理于一体的思政教育平台。

## 🎯 项目概览

| 项目信息     | 内容                                               |
| ------------ | -------------------------------------------------- |
| **项目名称** | 山东省思想政治理论课一体化教育平台                 |
| **生产域名** | https://horsduroot.com                             |
| **服务器**   | 阿curl https://horsduroot.com/api/health # 生产API |

````

## 📚 相关文档

- 📖 [DEV_GUIDE.md](./DEV_GUIDE.md) - 完整开发指南
- 📂 [docs/](./docs/) - 详细架构文档
- 🔧 [scripts/](./scripts/) - 自动化脚本说明

## 📄 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。(60.205.124.67)            |
| **管理后台** | https://horsduroot.com/admin         |
| **架构类型** | 双前端系统（公众前台 + 管理后台CMS） |

## ️ 核心技术栈

### 前端技术栈

- **核心框架**: Vue 3.5.18 + TypeScript 5.9.2
- **构建工具**: Vite 7.1.2
- **UI组件库**: Element Plus + Ant Design Vue
- **状态管理**: Pinia 3.0.3 + 持久化插件
- **路由**: Vue Router 4.5.1（嵌套路由 + 权限控制）
- **HTTP客户端**: Axios

### 后端技术栈

- **运行环境**: Node.js (ES Modules)
- **Web框架**: Express 4.18.2
- **数据库**: MongoDB + Mongoose 8.17.1
- **认证**: JWT + bcrypt
- **进程管理**: PM2
- **安全组件**: helmet, cors, rate-limit

### 基础设施

- **数据库**: MongoDB (统一使用 `sdszk` 库名)
- **缓存**: Redis (会话管理、数据缓存)
- **Web服务器**: Nginx (SSL + 反向代理)
- **系统**: Ubuntu 20.04 (macOS 开发环境)

## 🚀 快速启动

### 1. 环境要求

- Node.js >= 18.x
- MongoDB >= 6.x
- Redis (可选，用于缓存)
- npm/pnpm (推荐使用 uv 管理 Python 环境)

### 2. 一键启动开发环境（推荐）

> **⚠️ 重要提示**: 为确保开发环境的一致性并避免端口冲突、依赖问题，请**务必**使用以下脚本来启动和停止开发服务器。不要手动执行 `npm run dev` 或 `npm run server:dev`。

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
````

### 3. 手动启动（传统方式）

```bash
# 1. 安装依赖
npm install                          # 前端依赖
cd server && npm install && cd ..    # 后端依赖

# 2. 环境配置初始化
./scripts/development/setup-dev-env.sh    # 自动创建.env配置

# 3. 启动服务（推荐顺序）
npm run server:dev                   # 后端开发服务器 (localhost:3000)
npm run dev                          # 前端开发服务器 (localhost:5173)
```

### 4. 常用开发命令

```bash
# 构建和部署
npm run build:aliyun         # 构建生产版本（使用.env.aliyun配置）
npm run deploy:aliyun        # 部署前端到阿里云
npm run deploy:backend       # 部署后端API服务

# 数据库管理
npm run db:sync              # 快速同步（推荐日常使用）
npm run db:sync-full         # 完整同步工具（交互式菜单）
npm run db:tunnel            # 建立SSH隧道连接生产数据库
npm run db:verify            # 验证本地数据库状态

# 开发工具
./scripts/development/debug-services.sh      # 全面环境诊断
./scripts/development/diagnose-backend.sh    # 后端服务诊断
./scripts/development/cleanup-project.sh     # 完整项目清理
./scripts/kill-ports.sh                      # 强制清理端口进程
```

## 🏗️ 项目结构

### 前端结构

```
src/
├── views/              # 页面组件
│   ├── News.vue       # 前台新闻主页
│   └── admin/         # 管理后台模块
├── components/        # 通用组件
│   ├── common/        # 公共组件
│   └── admin/         # 管理后台专用组件
├── api/               # API接口封装
│   └── modules/       # 按模块组织的API
├── stores/            # Pinia状态管理
└── assets/            # 静态资源
```

### 后端结构

```
server/
├── controllers/       # 业务逻辑控制器
├── models/           # Mongoose数据模型
├── routes/           # API路由定义
├── middleware/       # Express中间件
├── config/           # 配置文件
└── migrations/       # 数据库迁移脚本
```

### 项目根目录

```
sdszk-redesign/
├── scripts/                # 自动化脚本
│   ├── development/        # 开发环境脚本
│   ├── deployment/         # 部署脚本
│   ├── database/           # 数据库管理脚本
│   └── testing/            # 测试脚本
├── docs/                   # 详细架构文档
└── DEV_GUIDE.md           # 核心开发指南
```

### 关键业务模块

- **新闻系统**: center(中心动态) / notice(通知公告) / policy(政策文件)
- **资源系统**: 教学资源上传、分类管理
- **用户系统**: JWT认证 + 角色权限多级验证
- **管理后台**: 完整的CMS内容管理系统

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

## 📡 API路由结构

### 前台API

```
/api/news                   # 新闻资讯
/api/resources              # 教学资源
/api/auth                   # 用户认证
```

### 管理后台API

```
/api/admin/news             # 后台新闻管理
/api/admin/resources        # 后台资源管理
/api/admin/*                # 其他管理功能
```

## 💾 数据库架构

### 核心数据模型

- `User.js` - 用户模型（角色权限管理）
- `News.js` - 新闻文章模型
- `Resource.js` - 教学资源模型
- `NewsCategory.js` / `ResourceCategory.js` - 分类管理
- `Activity.js` / `Favorite.js` / `ViewHistory.js` - 用户行为跟踪

### 数据库连接

- 统一使用 `sdszk` 数据库名
- 本地开发：MongoDB localhost:27017
- 生产环境：通过SSH隧道连接（端口27018）

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

## 🧪 测试

项目配置了完整的测试套件：

```bash
# 单元测试
npm run test                 # Vitest 单元测试
npm run test:ui              # 带UI界面的测试
npm run test:coverage        # 测试覆盖率报告

# E2E测试
npm run test:e2e             # 完整E2E测试
npm run test:e2e:basic       # 基础功能测试
npm run test:e2e:ui          # 测试UI界面
npm run test:e2e:debug       # 调试模式

# 代码质量
npm run lint                 # 前端ESLint检查
npm run lint:backend         # 后端代码检查
npm run format               # Prettier格式化
```

## 🛠️ 故障排除

### 端口冲突

```bash
./scripts/kill-ports.sh              # 清理所有占用端口
lsof -ti:5173 | xargs kill -9        # 强制关闭前端端口
lsof -ti:3000 | xargs kill -9        # 强制关闭后端端口
```

### 数据库连接问题

```bash
# 重启本地数据库服务
brew services restart mongodb-community
redis-server --daemonize yes

# 重新同步数据
npm run db:sync --force
```

### 构建问题

```bash
# 清理依赖和缓存
rm -rf node_modules package-lock.json
npm install
./scripts/development/clear-cache.sh
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

### 开发规范

#### ES Modules规范

- 完全使用ES模块：`"type": "module"`
- 导入语法：`import { ... } from '...'`
- 路径别名：`@/*` 映射到 `./src/*`

#### 代码质量工具

- ESLint + TypeScript规则（支持Vue 3）
- Prettier代码格式化
- Husky Git hooks（pre-commit检查）
- Vitest单元测试 + Playwright E2E测试

请确保您的代码遵循项目已配置的 ESLint 和 Prettier 规范。

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
