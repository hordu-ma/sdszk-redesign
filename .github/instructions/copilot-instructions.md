---
applyTo: "**"
---

# 山东省思政课一体化中心 - Copilot开发指南

## 🎯 项目核心信息

### 基本信息

- **项目名称**: 山东省思政课一体化中心
- **域名**: https://horsduroot.com
- **服务器**: 阿里云ECS (60.205.124.67)
- **管理员登录**: https://horsduroot.com/login/admin

### 架构特点

- **双前端系统**: 公众前台 + 管理后台CMS
- **数据库环境**: 开发和生产环境统一使用`sdszk`
- **部署方式**: 前后端同域部署，通过Nginx代理

## 🛠️ 技术栈规范

### 前端技术栈

- **核心框架**: Vue 3.3.4 + TypeScript 5.2.0
- **构建工具**: Vite 4.4.9
- **UI组件库**: Element Plus 2.3.14 + Ant Design Vue 4.0.3
- **状态管理**: Pinia 2.1.6 + 持久化插件
- **路由**: Vue Router 4.2.4 (嵌套路由 + 权限控制)
- **HTTP客户端**: Axios ^1.5.0

### 后端技术栈

- **运行环境**: Node.js (ES Modules)
- **Web框架**: Express 4.18.2
- **数据库**: MongoDB + Mongoose 8.1.1
- **认证**: JWT + bcrypt
- **进程管理**: PM2

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

## 🔧 环境配置重点

### 配置文件对应

- **前端开发**: `.env.development` + `npm run dev`
- **前端生产**: `.env.aliyun` + `npm run build:aliyun`
- **后端开发**: `server/.env` + `npm run server:dev`
- **后端生产**: `server/.env.production` → `server-dist/.env`

### 部署脚本

- `./scripts/deploy.sh` - 前端静态文件部署
- `./scripts/deploy-backend.sh` - 后端API服务部署
- `./scripts/deploy-nginx.sh` - Nginx配置部署

## 📋 开发规范

### 基础规则

- **语言**: 总是用中文回答问题
- **模块系统**: JavaScript/TypeScript 总是选择 ES Modules
- **代码风格**: 遵循ESLint + Prettier规范

### 工作流程规则

- **Agent模式**: 执行代码修改前要先确认，获得许可后执行
- **任务分解**: 超过三步的任务要拆解步骤，分步执行
- **删除确认**: 每次执行代码删除工作，务必获得确认许可后执行
- **Git提醒**: 每隔10分钟，提醒进行 `git add` 和 `git commit` 操作
- **上下文保持**: 每隔十分钟，重新回顾"辅助开发上下文指南.md"文档

### Git工作流和版本管理

- **分支策略**: main主分支，生产环境代码
- **提交规范**: feat/fix/docs/style/refactor/test/chore前缀
- **Hooks自动化**: ESLint + Prettier + TypeScript检查
- **发布流程**: 日常开发 → 部署脚本 → 生产验证

### 开发服务器启动顺序

- **前端开发**: 务必先启动后端服务器 (`cd server && npm run start`)，再启动前端 (`npm run dev`)

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

- `/api/auth` - 用户认证管理
- `/api/news` - 新闻资讯接口
- `/api/admin/news` - 后台新闻管理
- `/api/resources` - 教学资源接口
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
