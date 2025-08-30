---
applyTo: "**"
---

# 山东省思政课一体化中心 - Copilot开发指南

## 🎯 项目核心信息

### 基本信息

- **项目名称**: 山东省思想政治理论课一体化教育平台
- **生产域名**: https://horsduroot.com
- **服务器**: 阿里云ECS (60.205.124.67)
- **管理后台**: https://horsduroot.com/admin
- **架构类型**: 双前端系统（公众前台 + 管理后台CMS）

### 数据库环境

- **统一库名**: `sdszk` (开发和生产环境统一)
- **主数据库**: MongoDB
- **缓存系统**: Redis (会话管理、数据缓存)
- **部署方式**: 前后端同域部署，通过Nginx反向代理

## 🛠️ 技术栈规范

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

### ES Modules规范

- **模块类型**: `"type": "module"` 完全使用ES模块
- **导入语法**: `import { ... } from '...'`
- **路径别名**: `@/*` 映射到 `./src/*`
- **文件扩展名**: `.js`, `.ts`, `.vue` 需明确指定

## 📁 核心目录结构

### 前端结构

```
src/
├── views/           # 页面组件
│   ├── News.vue    # 前台新闻主页
│   ├── admin/      # 管理后台模块
│   │   ├── news/   # 后台新闻管理
│   │   ├── auth/   # 后台登录
│   │   └── ...
│   └── user/       # 用户中心
├── components/      # 公共组件
├── api/            # API接口定义
├── stores/         # Pinia状态管理
└── router/         # 路由配置
```

### 后端结构

```
server/
├── controllers/    # 业务逻辑控制器
├── models/        # MongoDB数据模型
├── routes/        # 路由定义
├── middleware/    # 中间件
└── .env           # 开发环境配置
```

### 脚本目录结构

```
scripts/
├── development/    # 开发环境脚本
│   ├── dev-start.sh        # 一键启动开发环境
│   ├── dev-stop.sh         # 停止开发环境
│   ├── setup-dev-env.sh    # 环境配置初始化
│   └── cleanup-project.sh  # 项目清理
├── deployment/     # 部署脚本
│   ├── deploy.sh           # 前端部署
│   ├── deploy-backend.sh   # 后端部署
│   └── deploy-nginx.sh     # Nginx配置部署
├── database/       # 数据库管理脚本
│   ├── quick-sync.sh       # 快速数据库同步
│   └── sync-database.sh    # 完整数据库同步
└── testing/        # 测试脚本
```

## 🔧 环境配置重点

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

## 🚀 开发环境启动流程

### 推荐方式：一键启动

```bash
# 🟢 启动完整开发环境 (推荐)
./scripts/development/dev-start.sh
# 自动启动: Redis、MongoDB、后端服务器、前端服务器
# 访问: http://localhost:5173 (前端) | http://localhost:3000 (API)

# 🔴 停止开发环境
./scripts/development/dev-stop.sh
# 自动清理所有相关进程和端口
```

### 传统方式：手动启动

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

## 📋 开发规范

### 基础规则

- **语言**: 总是用中文回答问题
- **模块系统**: JavaScript/TypeScript 总是选择 ES Modules
- **代码风格**: 遵循ESLint + Prettier规范
- **核心文档**: 始终以项目根目录的 `DEV_GUIDE.md` 作为核心开发指南

### 工作流程规则

- **Agent模式**: 执行代码修改前要先确认，获得许可后执行
- **任务分解**: 超过三步的任务要拆解步骤，分步执行
- **删除确认**: 每次执行代码删除工作，务必获得确认许可后执行
- **Git提醒**: 每隔10分钟，提醒进行 `git add` 和 `git commit` 操作

### Git工作流和版本管理

- **分支策略**: main主分支，生产环境代码
- **提交规范**: feat/fix/docs/style/refactor/test/chore前缀
- **Hooks自动化**: ESLint + Prettier + TypeScript检查
- **发布流程**: 日常开发 → 部署脚本 → 生产验证

## 🛠️ NPM脚本命令

### 开发环境

```bash
npm run dev              # 前端开发服务器
npm run server:dev       # 后端开发服务器
npm run preview          # 预览构建结果
```

### 构建部署

```bash
npm run build:aliyun     # 构建生产版本
npm run deploy:aliyun    # 前端部署到阿里云
npm run deploy:backend   # 后端部署
```

### 数据库管理

```bash
npm run db:sync          # 快速数据库同步
npm run db:sync-full     # 完整数据库同步工具
npm run db:tunnel        # SSH隧道连接
npm run db:verify        # 数据库验证
```

### 测试套件

```bash
npm run test             # Vitest 单元测试
npm run test:coverage    # 测试覆盖率报告
npm run test:e2e         # Playwright E2E测试
npm run test:e2e:ui      # 可视化测试界面
```

### 代码质量

```bash
npm run lint             # ESLint 检查
npm run lint:backend     # 后端代码检查
npm run format           # Prettier 格式化
```

## 🗂️ 核心业务模块

### 新闻管理系统

- **前台**: `/news` → `News.vue` (新闻列表主页)
- **后台**: `/admin/news/list` → `admin/news/NewsList.vue` (管理界面)
- **分类系统**: center(中心动态) / notice(通知公告) / policy(政策文件)

### 资源管理系统

- **前台**: `/resources` → `Resources.vue`
- **后台**: `/admin/resources/*` → 资源管理模块

### 用户权限系统

- **前台认证**: `/auth` → `AuthPage.vue`
- **后台认证**: `/admin/login` → `AdminLogin.vue`
- **权限控制**: 基于JWT + 角色权限的多级验证

## 🎯 关键API路由

### 前台接口

- `/api/auth` - 用户认证管理
- `/api/news` - 新闻资讯接口
- `/api/resources` - 教学资源接口
- `/api/health` - 健康检查接口

### 后台管理接口

- `/api/admin/auth` - 管理员认证
- `/api/admin/news` - 后台新闻管理
- `/api/admin/resources` - 后台资源管理
- `/api/admin/*` - 管理后台专用接口

## 🎯 开发最佳实践

### 代码规范

- **命名约定**: 使用驼峰命名法，组件使用PascalCase
- **文件组织**: 按功能模块分组，保持目录结构清晰
- **类型安全**: 充分利用TypeScript类型系统
- **组件设计**: 遵循单一职责原则，提高复用性

### 性能优化

- **代码分割**: 利用Vite的自动代码分割
- **懒加载**: 路由和组件按需加载
- **缓存策略**: 合理配置前端缓存
- **API优化**: 使用频率限制和数据分页

### 安全考虑

- **认证授权**: JWT令牌 + 角色权限控制
- **输入验证**: 前后端双重验证
- **CORS配置**: 严格的跨域策略
- **敏感信息**: 环境变量管理

### 调试技巧

- **分层调试**: 前端→API→数据库逐层排查
- **日志记录**: 合理使用console.log和morgan
- **错误处理**: 统一的错误处理机制
- **监控工具**: 利用开发者工具和扩展

## 🛠️ 部署调试技巧

### 自动化脚本使用

```bash
# 环境诊断
./scripts/development/diagnose-backend.sh    # 后端环境诊断
./scripts/development/cleanup-project.sh     # 项目清理
./scripts/development/clear-cache.sh         # 清理缓存

# 部署脚本
./scripts/deployment/deploy.sh               # 前端部署
./scripts/deployment/deploy-backend.sh       # 后端部署
./scripts/deployment/deploy-nginx.sh         # Nginx配置部署
```

### zip打包隐藏文件注意事项

- ❌ **错误写法**：`zip -r package.zip ./` 或 `zip -r package.zip ./*` (不包含隐藏文件)
- ✅ **正确写法**：`zip -r package.zip .` (包含所有文件包括隐藏文件)
- **验证方法**：`unzip -l package.zip | grep -E "^\\s*[0-9]+.*\\."` 查看隐藏文件

### PM2环境变量诊断命令

```bash
# 查看进程详情
pm2 show <app-name>

# 查看环境变量
pm2 env <process-id>

# 测试dotenv加载
node -e "require('dotenv').config(); console.log('KEY:', process.env.KEY);"

# 检查应用端口
netstat -tlnp | grep <port>
```

### 应用配置生效验证方法

```bash
# 健康检查端点验证环境信息
curl -s http://localhost:3000/api/health

# 生产环境健康检查
curl -s https://horsduroot.com/api/health

# CORS验证
curl -H 'Origin: https://horsduroot.com' -I http://localhost:3000/api/health | grep access-control

# 数据库连接验证：通过健康检查API确认数据库状态
# 端口验证：确认应用监听正确端口
```

### 部署脚本调试技巧

- **分步验证**：每个关键步骤后添加验证命令
- **文件时间戳**：`ls -la` 确认文件更新时间
- **进程重启确认**：`pm2 status` 查看重启时间和状态
- **备份验证**：确认备份目录创建成功

### 常见环境文件问题排查清单

- □ 源文件是否存在且内容正确
- □ 复制命令是否正确执行
- □ zip打包是否包含隐藏文件
- □ 服务器解压是否成功
- □ 应用是否正确加载dotenv
- □ 环境变量是否在运行时生效
- □ PM2进程是否使用了正确的工作目录

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

## 📚 相关文档

- 📖 [DEV_GUIDE.md](../../../DEV_GUIDE.md) - 完整开发指南
- 📂 [dev-docs/](../../../dev-docs/) - 详细架构文档
- 🔧 [scripts/](../../../scripts/) - 自动化脚本说明
