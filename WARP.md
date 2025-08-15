# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

# 山东省思政课一体化中心 - WARP 开发指南

*最后更新：2025-01-15*

## 🎯 项目概览

山东省思政课一体化中心是一个基于 Vue3 + TypeScript + Node.js + MongoDB 构建的现代化思政教育平台，采用前后端分离架构，提供新闻资讯、教学资源、在线活动和后台管理功能。

**核心特点：**
- 🏗️ **双前端系统**：公众前台 + 管理后台CMS
- 📊 **ES Modules**：全面采用现代化模块系统
- 🔄 **前后端同域部署**：通过Nginx代理实现统一访问
- 🎨 **双UI组件库**：Element Plus + Ant Design Vue

---

## 🚀 快速启动

### 环境检查清单
- [ ] Node.js >= 18.x
- [ ] MongoDB >= 6.x  
- [ ] pnpm >= 8.x (推荐) 或 npm
- [ ] Git 版本控制

### 一键启动命令序列

```bash
# 1. 克隆项目并安装依赖
git clone <repository-url> sdszk-redesign && cd sdszk-redesign
npm install && cd server && npm install && cd ..

# 2. 配置环境变量（复制示例文件并修改）
cp .env.development.example .env.development
cp server/.env.example server/.env

# 3. 启动开发环境（需要两个终端）
# 终端1：启动后端服务 (http://localhost:3000)
npm run server:dev

# 终端2：启动前端服务 (http://localhost:5173)  
npm run dev
```

### 开发环境验证
```bash
# 检查前端服务
curl http://localhost:5173

# 检查后端API
curl http://localhost:3000/api/health

# 检查数据库连接
npm run test:api
```

---

## 🛠️ 开发工作流程

### 功能开发流程

1. **需求分析** → 2. **分支创建** → 3. **开发实现** → 4. **本地测试** → 5. **代码审查** → 6. **集成测试** → 7. **生产部署**

### 前后端联调流程

```bash
# 1. 确保后端服务先启动
cd server && npm run start

# 2. 启动前端开发服务器（自动代理到后端）
npm run dev

# 3. API接口测试
npm run test:api
```

### Git 工作流规范

```bash
# 分支命名约定
feat/功能名-简短描述     # 新功能
fix/bug名-简短描述      # 问题修复
docs/文档类型          # 文档更新
refactor/重构模块名    # 代码重构

# 提交信息格式
git commit -m "feat: 添加新闻管理模块的CRUD功能"
git commit -m "fix: 修复用户登录状态丢失问题"
git commit -m "docs: 更新API文档和使用说明"
```

---

## ⚡ 常用命令速查表

### 开发命令
```bash
# 前端开发
npm run dev              # 启动Vite开发服务器 (http://localhost:5173)
npm run preview          # 预览构建产物

# 后端开发  
npm run server:dev       # 启动Nodemon开发服务器 (http://localhost:3000)
npm run server           # 启动生产模式服务器
```

### 构建和部署命令
```bash
# 构建命令
npm run build            # 标准构建
npm run build:aliyun     # 阿里云生产环境构建

# 部署命令
npm run deploy:aliyun    # 前端部署到阿里云
npm run deploy:backend   # 后端部署到服务器
bash scripts/deploy-nginx.sh  # Nginx配置部署
```

### 测试命令
```bash
# 前端测试
npm run test             # Vitest单元测试
npm run test:ui          # 可视化测试界面
npm run test:coverage    # 测试覆盖率报告

# E2E测试
npm run test:e2e         # Playwright端到端测试
npm run test:e2e:ui      # E2E测试可视化界面
npm run test:e2e:report  # 查看测试报告

# API测试
npm run test:api         # 后端API连通性测试
```

### 代码质量命令
```bash
# 代码检查和格式化
npm run lint             # ESLint检查并自动修复
npm run format           # Prettier格式化

# 类型检查
vue-tsc                  # TypeScript类型检查
```

### 数据库维护命令
```bash
# 在server目录下执行
npm run seed             # 填充种子数据
npm run migrate:up       # 运行数据库迁移
npm run migrate:down     # 回滚数据库迁移
```

---

## 🏗️ 架构决策记录

### ES Modules 选择理由
- **现代化标准**：符合ECMAScript官方规范，是JavaScript模块的未来
- **更好的Tree Shaking**：Vite和现代构建工具能更好地进行死代码消除
- **统一的导入语法**：前后端使用一致的 `import/export` 语法
- **更好的TypeScript集成**：类型推导和检查更加准确

### 双UI组件库策略
- **Element Plus**：主要用于管理后台，功能完整，组件丰富
- **Ant Design Vue**：主要用于前台展示，设计精美，用户体验佳
- **权衡考虑**：虽然增加了打包体积，但提供了更灵活的UI选择

### Pinia 状态管理最佳实践
```javascript
// 推荐的store结构
export const useUserStore = defineStore('user', () => {
  // state
  const userInfo = ref(null)
  
  // getters  
  const isLoggedIn = computed(() => !!userInfo.value)
  
  // actions
  const login = async (credentials) => {
    // 登录逻辑
  }
  
  return { userInfo, isLoggedIn, login }
})
```

### 数据库设计原则
- **开发环境**：使用 `sdszk` 数据库，便于本地调试
- **生产环境**：使用 `sdszk-db` 数据库，数据隔离，防止误操作
- **环境变量驱动**：通过 `.env` 文件控制不同环境的数据库连接

---

## 🚨 故障排查指南

### 环境问题

#### 端口占用
```bash
# 检查端口占用
lsof -i :3000  # 后端端口
lsof -i :5173  # 前端端口

# 终止进程
kill -9 <PID>
```

#### 依赖版本冲突
```bash
# 清理依赖缓存
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 检查依赖版本
npm ls --depth=0
```

### 开发问题

#### TypeScript类型错误
```bash
# 类型检查
vue-tsc --noEmit

# 重新生成类型声明
npm run build
```

#### ESLint错误
```bash
# 自动修复ESLint问题
npm run lint

# 检查特定文件
eslint src/components/MyComponent.vue --fix
```

#### 路径别名问题
- 确保 `tsconfig.json` 中配置了 `"@/*": ["./src/*"]`
- Vite配置中正确设置了 `alias: { '@': resolve(__dirname, 'src') }`

### 部署问题

#### PM2进程管理
```bash
# 查看进程状态
pm2 status

# 查看日志
pm2 logs sdszk-server

# 重启服务
pm2 restart sdszk-server

# 查看环境变量
pm2 show sdszk-server
```

#### Nginx配置问题
```bash
# 检查Nginx配置语法
nginx -t

# 重新加载配置
nginx -s reload

# 查看错误日志
tail -f /var/log/nginx/error.log
```

### 数据库问题

#### MongoDB连接失败
```bash
# 检查MongoDB服务状态
systemctl status mongod

# 检查连接
mongo --eval "db.runCommand({connectionStatus : 1})"

# 查看数据库日志
tail -f /var/log/mongodb/mongod.log
```

#### 常见错误解决
- **"connection refused"**：检查MongoDB是否启动，端口是否正确
- **"authentication failed"**：检查用户名密码和数据库权限
- **"collection not found"**：运行数据库迁移 `npm run migrate:up`

---

## 🚀 性能优化建议

### 前端优化策略

#### 代码分割优化
```javascript
// vite.config.ts 中的配置已优化
const manualChunks = {
  'vue-vendor': ['vue', 'vue-router', 'pinia'],
  'ui-vendor': ['element-plus', 'ant-design-vue'],
  'utils-vendor': ['axios', 'echarts']
}
```

#### 懒加载配置
```javascript
// 路由懒加载
const routes = [
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue')
  }
]
```

#### 缓存策略
- **静态资源**：使用文件名hash，长期缓存
- **API响应**：合理使用HTTP缓存头
- **状态持久化**：Pinia配合localStorage

### 后端优化策略

#### 数据库索引
```javascript
// 关键字段添加索引
newsSchema.index({ category: 1, createdAt: -1 })
userSchema.index({ email: 1 }, { unique: true })
```

#### 查询优化
```javascript
// 分页查询优化
const news = await News.find(query)
  .limit(pageSize)
  .skip((page - 1) * pageSize)
  .sort({ createdAt: -1 })
  .lean() // 返回普通对象，减少内存占用
```

### 部署优化配置

#### Nginx配置优化
```nginx
# 启用Gzip压缩
gzip on;
gzip_types text/plain application/json application/javascript text/css;

# 静态资源缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public";
}
```

#### 性能监控
```bash
# PM2监控
pm2 monit

# 系统资源监控
htop
iostat -x 1

# Node.js性能分析
npm install -g clinic
clinic doctor -- node server/app.js
```

---

## 📋 项目核心文件说明

### 配置文件说明
- **package.json**: 项目依赖和脚本定义
- **vite.config.ts**: 前端构建配置，包含性能优化设置
- **tsconfig.json**: TypeScript编译配置
- **.env.development / .env.aliyun**: 前端环境变量
- **server/.env / server/.env.production**: 后端环境变量

### 关键目录结构
```
src/
├── api/             # API接口定义
├── components/      # 公共组件
│   ├── admin/       # 管理后台组件
│   ├── common/      # 通用组件  
│   └── home/        # 首页组件
├── stores/          # Pinia状态管理
├── views/           # 页面组件
│   ├── admin/       # 管理后台页面
│   │   ├── auth/    # 后台登录
│   │   ├── news/    # 新闻管理
│   │   └── resources/ # 资源管理
│   └── auth/        # 前台认证
└── router/          # 路由配置

server/
├── controllers/     # 业务逻辑控制器
├── models/          # MongoDB数据模型
├── routes/          # API路由定义
├── middleware/      # Express中间件
└── migrations/      # 数据库迁移文件
```

### 重要业务模块
- **新闻管理系统**: 支持分类管理(center/notice/policy)
- **资源管理系统**: 教学资源的增删改查
- **用户权限系统**: 基于JWT的多级权限控制
- **文件上传系统**: 支持图片和文档上传

---

## 📚 相关文档链接

- **[README.md](./README.md)**: 项目介绍和基础使用说明
- **[辅助开发上下文指南.md](./辅助开发上下文指南.md)**: 详细的开发环境配置指南  
- **[dev-docs/](./dev-docs/)**: 详细的架构设计文档
- **[.github/instructions/copilot-instructions.md](./.github/instructions/copilot-instructions.md)**: Copilot开发指导

---

**注意事项：**
- 开发时务必先启动后端服务，再启动前端服务
- 提交代码前使用 `npm run lint` 检查代码规范
- 部署前确保通过所有测试用例
- 定期运行 `npm run test:coverage` 检查测试覆盖率

*此文档与项目同步更新，如有疑问请参考相关文档或联系项目维护者。*
