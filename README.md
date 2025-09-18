# 山东省思政课一体化中心 - 全栈项目

> 基于 Vue3 + TypeScript + Node.js + MongoDB 构建的现代化思政教育平台

本项目是一个功能完善的全栈CMS应用，包含前台展示网站和管理后台系统，提供集新闻资讯、教学资源、在线活动和用户权限管理于一体的思政教育平台。

## 🎯 项目概览

| 项目信息     | 内容                                 |
| ------------ | ------------------------------------ |
| **项目名称** | 山东省大中小学思政课一体化中心平台   |
| **生产域名** | https://horsduroot.com               |
| **服务器**   | 阿里云 (60.205.124.67)               |
| **管理后台** | https://horsduroot.com/admin         |
| **架构类型** | 双前端系统（公众前台 + 管理后台CMS） |

## 🏗️ 核心技术栈

### 前端技术栈

- **核心框架**: Vue 3.5 + TypeScript 5.9
- **构建工具**: Vite 7.1 + ES Modules
- **UI组件库**: Element Plus + Ant Design Vue
- **状态管理**: Pinia + 持久化
- **路由**: Vue Router 4.5（权限控制）

### 后端技术栈

- **运行环境**: Node.js (ES Modules)
- **Web框架**: Express 4.18
- **数据库**: MongoDB + Mongoose 8.17
- **认证**: JWT + bcrypt + 角色权限系统
- **进程管理**: PM2

### 基础设施

- **数据库**: MongoDB (`sdszk` 库名)
- **缓存**: Redis
- **Web服务器**: Nginx (SSL + 反向代理)

## 🚀 快速启动

### 环境要求

- Node.js >= 18.x
- MongoDB >= 6.x
- Redis (可选)

### 一键启动开发环境（推荐）

**总是使用两个脚本优雅的关闭和启动开发环境，避免端口冲突和孤儿进程。**

```bash
# 🟢 一键启动开发环境
./scripts/development/dev-start.sh
# 自动启动: MongoDB、Redis、后端API、前端服务
# 访问: http://localhost:5173 (前端) | http://localhost:3000 (API)

# 🔴 停止开发环境
./scripts/development/dev-stop.sh
```

### 手动启动(不推荐)

```bash
npm install                          # 安装前端依赖
cd server && npm install && cd ..    # 安装后端依赖
npm run server:dev                   # 启动后端 (localhost:3000)
npm run dev                          # 启动前端 (localhost:5173)
```

## 📊 用户管理系统（已完善）

本项目已完整实现基于角色的权限管理系统（RBAC），包含完整的用户、角色、权限三级管理。

### 🔐 权限系统架构

- **权限模型**: `module:action` 格式（如 `users:read`）
- **角色系统**: 系统管理员、用户管理员、查看者等预定义角色
- **权限验证**: 前端指令 + 后端中间件双重验证

### 🎛️ 管理后台功能

- **用户管理** (`/admin/users/list`): 用户CRUD、状态管理、批量操作
- **角色管理** (`/admin/users/roles`): 角色配置、权限分配、使用统计
- **权限管理** (`/admin/users/permissions`): 权限树展示、模块化管理

### 🗄️ 数据库模型

```javascript
// 核心模型已完整实现
User.js; // 用户模型（JWT认证、软删除）
Role.js; // 角色模型（权限分配、统计功能）
Permission.js; // 权限模型（模块化、权限树）
```

### 🔧 权限初始化

```bash
# 数据库已包含基础权限和角色
# 如需重置，运行：
node scripts/database/init-roles-permissions.js
```

## 🏢 业务模块

### 内容管理

- **新闻系统**: 中心动态、通知公告、政策文件三大分类
- **资源系统**: 教学资源上传、分类管理、版本控制
- **分类管理**: 动态分类、层级结构、权限控制

### 用户交互

- **认证系统**: JWT + 多终端登录
- **行为跟踪**: 浏览历史、收藏管理、操作日志
- **文件上传**: 多格式支持、安全验证

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

```bash
# 一键全栈部署
npm run deploy:quick

# 分别部署
npm run deploy:quick:frontend    # 仅前端
npm run deploy:quick:backend     # 仅后端

# 服务管理
npm run pm2:restart              # 重启服务
npm run pm2:status               # 查看状态
npm run pm2:logs                 # 查看日志
```

### 🔧 完整部署（生产环境）

```bash
# 统一部署管理器
npm run deploy:aliyun            # 全栈部署
npm run deploy:aliyun:frontend   # 仅前端部署
npm run deploy:aliyun:backend    # 仅后端部署
npm run deploy:aliyun:fullstack  # 显式全栈部署
```

### 📊 部署检查

```bash
# 全面健康检查
./scripts/deployment/check-deployment.sh

# 快速检查
./scripts/deployment/check-deployment.sh --quick

# PM2 健康检查
npm run pm2:health
```

### 🛠️ 服务维护

```bash
# PM2 管理
./scripts/deployment/pm2-manager.sh status      # 状态查看
./scripts/deployment/pm2-manager.sh restart     # 安全重启
./scripts/deployment/pm2-manager.sh clean       # 清理异常进程
./scripts/deployment/pm2-manager.sh maintenance # 完整维护

# 快速操作
./scripts/deployment/quick-deploy.sh restart    # 快速重启
./scripts/deployment/quick-deploy.sh status     # 快速状态检查

# 定期维护命令
./scripts/deployment/check-deployment.sh        # 全面健康检查
ssh root@60.205.124.67 "apt update && apt list --upgradable"  # 系统更新检查
```

### 📋 部署最佳实践

1. **部署前检查**：确保代码已提交、测试通过、配置文件完整
2. **选择合适工具**：日常开发用快速部署，生产发布用统一管理器
3. **部署后验证**：运行健康检查确保服务正常
4. **监控维护**：定期检查服务状态和日志

### 环境配置

- **开发环境**: `.env.development` + `server/.env`
- **生产环境**: `.env.aliyun` + `server/.env.production`

## 🧪 测试与质量

```bash
# 测试套件
npm run test              # Vitest单元测试
npm run test:e2e          # Playwright E2E测试
npm run test:coverage     # 测试覆盖率

# 代码质量
npm run lint              # ESLint检查
npm run format            # Prettier格式化
```

## 🛠️ 常用开发命令

```bash
# 数据库管理
npm run db:tunnel         # SSH隧道连接生产库

# 环境诊断
./scripts/development/diagnose-backend.sh    # 后端服务诊断

# 项目维护
./scripts/development/cleanup-project.sh     # 完整项目清理
```

## 🔗 API路由

### 前台API

```
/api/news                 # 新闻资讯
/api/resources            # 教学资源
/api/auth                 # 用户认证
```

### 管理后台API

```
/api/admin/users          # 用户管理
/api/admin/roles          # 角色管理
/api/admin/permissions    # 权限管理
/api/admin/news           # 新闻管理
/api/admin/resources      # 资源管理
```

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
curl https://horsduroot.com/api/health
```

## 📚 相关文档

- 📂 [docs/](./docs/) - 详细架构文档
- 🔧 [scripts/](./scripts/) - 自动化脚本
- 📦 [docs/archive/](./docs/archive/) - 历史文档存档

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

_最后的强调_

1. 总是使用脚本优雅的关闭和启动开发环境，避免端口冲突和孤儿进程。
2. 总是使用scripts/deployment目录下的脚本进行部署，避免遗漏步骤
3. 每次运行git前必须检查诊断栏的错误信息，优先修复。

---
