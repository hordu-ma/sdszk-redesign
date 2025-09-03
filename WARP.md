# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## 项目概述

这是一个基于 Vue 3 + Node.js + MongoDB 的全栈思政教育平台，包含前台展示网站和管理后台系统。

- **生产地址**: https://horsduroot.com
- **管理后台**: https://horsduroot.com/admin
- **架构**: 双前端系统（公众前台 + 管理后台CMS）

## 核心技术栈

### 前端

- Vue 3.5.18 + TypeScript 5.9.2
- Vite 7.1.2（构建工具）
- Element Plus + Ant Design Vue（UI组件库）
- Pinia 3.0.3（状态管理）
- Vue Router 4.5.1（路由，支持嵌套路由和权限控制）

### 后端

- Node.js（ES Modules）
- Express 4.18.2
- MongoDB + Mongoose 8.17.1
- JWT + bcrypt 认证
- Redis 缓存
- PM2 进程管理

## 常用开发命令

### 开发环境启动

```bash
# 🟢 一键启动完整开发环境（推荐）
./scripts/development/dev-start.sh

# 🔴 停止所有开发服务
./scripts/development/dev-stop.sh

# 传统方式：前端 + 后端分别启动
npm run dev                  # 前端开发服务器 (localhost:5173)
npm run server:dev           # 后端开发服务器 (localhost:3000)
```

### 构建和部署

```bash
# 生产环境构建和部署
npm run build:aliyun         # 构建生产版本（使用.env.aliyun配置）
npm run deploy:aliyun        # 部署前端到阿里云
npm run deploy:backend       # 部署后端API服务

# 或使用脚本
./scripts/deployment/deploy.sh          # 前端部署
./scripts/deployment/deploy-backend.sh  # 后端部署
./scripts/deployment/deploy-nginx.sh    # Nginx配置更新
```

### 测试命令

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

### 数据库管理

```bash
# 数据库同步（从生产环境到本地）
npm run db:sync              # 快速同步（推荐日常使用）
npm run db:sync-full         # 完整同步工具（交互式菜单）
npm run db:tunnel            # 建立SSH隧道连接生产数据库
npm run db:verify            # 验证本地数据库状态
```

### 开发工具

```bash
# 环境诊断
./scripts/development/debug-services.sh      # 全面环境诊断
./scripts/development/diagnose-backend.sh    # 后端服务诊断
./scripts/development/monitor.sh             # 系统监控

# 清理工具
./scripts/development/clear-cache.sh         # 清理缓存
./scripts/development/cleanup-project.sh     # 完整项目清理
./scripts/kill-ports.sh                      # 强制清理端口进程
```

## 项目架构

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

### 关键业务模块

- **新闻系统**: center(中心动态) / notice(通知公告) / policy(政策文件)
- **资源系统**: 教学资源上传、分类管理
- **用户系统**: JWT认证 + 角色权限多级验证
- **管理后台**: 完整的CMS内容管理系统

## 配置文件说明

### 环境配置对应关系

| 环境 | 前端配置           | 后端配置                 | 用途                      |
| ---- | ------------------ | ------------------------ | ------------------------- |
| 开发 | `.env.development` | `server/.env`            | 本地开发，API路径: `/api` |
| 生产 | `.env.aliyun`      | `server/.env.production` | 阿里云部署                |

### 关键环境变量

```bash
# 前端 (.env.development / .env.aliyun)
VITE_API_BASE_URL=/api              # API基础路径
VITE_APP_DEBUG=true/false          # 调试模式

# 后端 (server/.env / server/.env.production)
MONGODB_URI=mongodb://localhost:27017/sdszk
JWT_SECRET=<强密钥>
FRONTEND_URL=https://horsduroot.com
REDIS_HOST=127.0.0.1
PORT=3000
```

## 数据库架构

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

## API路由结构

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

## 开发规范

### ES Modules规范

- 完全使用ES模块：`"type": "module"`
- 导入语法：`import { ... } from '...'`
- 路径别名：`@/*` 映射到 `./src/*`

### Git提交规范

```
feat: 添加新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具更新
```

### 代码质量工具

- ESLint + TypeScript规则（支持Vue 3）
- Prettier代码格式化
- Husky Git hooks（pre-commit检查）
- Vitest单元测试 + Playwright E2E测试

## 常见问题解决

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

## 快速验证

### 验证开发环境

```bash
curl http://localhost:5173           # 前端
curl http://localhost:3000/api/health # 后端API
```

### 验证生产环境

```bash
curl https://horsduroot.com          # 生产网站
curl https://horsduroot.com/api/health # 生产API
```

## 相关文档

- `DEV_GUIDE.md` - 完整开发指南
- `README.md` - 项目说明和快速开始
- `docs/` - 详细架构和开发文档
- `scripts/` - 自动化脚本使用说明
