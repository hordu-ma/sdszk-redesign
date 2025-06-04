# 山东省思政教育平台 - 项目文档索引

## 📋 项目概述

山东省思政教育平台是基于 Vue3 + Express + MongoDB 的现代化思政教育信息管理系统。

## 📚 核心文档

### 🚀 部署与运维

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - 完整的生产环境部署指南
  - Docker 容器化部署
  - Nginx 反向代理配置
  - 环境变量配置
  - SSL 证书设置
  - 监控和备份策略

### ⚡ 性能优化

- **[OPTIMIZATION_COMPLETE_REPORT.md](./OPTIMIZATION_COMPLETE_REPORT.md)** - 性能优化完整报告
  - 代码分割策略
  - 构建优化配置
  - 资源压缩和缓存
  - 性能指标和基准

### 🔧 代码质量

- **[SYNTAX_FIXES_REPORT.md](./SYNTAX_FIXES_REPORT.md)** - 代码语法修复报告
  - SCSS 语法现代化
  - TypeScript 错误修复
  - ESLint 配置优化
  - Prettier 代码格式化

### 🧪 测试状态

- **[test-execution-report.md](./test-execution-report.md)** - 当前测试执行报告
  - 已完成测试项目 (15% 完成率)
  - 发现的问题和修复建议
  - 下一阶段测试计划

## 🛠 技术架构

### 前端技术栈

- **Vue 3** - 现代响应式框架
- **TypeScript** - 类型安全
- **Vite** - 现代构建工具
- **Element Plus + Ant Design Vue** - UI 组件库
- **Pinia** - 状态管理
- **Vue Router** - 路由管理

### 后端技术栈

- **Node.js + Express** - 服务器框架
- **MongoDB + Mongoose** - 数据库
- **JWT** - 身份认证
- **Multer** - 文件上传
- **bcrypt** - 密码加密

### 部署技术栈

- **Docker** - 容器化
- **Nginx** - 反向代理
- **SSL/TLS** - 安全传输
- **Redis** - 缓存（可选）

## 📁 项目结构

```
sdszk-redesign/
├── src/                    # 前端源代码
│   ├── components/         # Vue 组件
│   ├── views/             # 页面视图
│   ├── stores/            # Pinia 状态管理
│   ├── router/            # 路由配置
│   ├── api/               # API 接口
│   ├── styles/            # 样式文件
│   └── types/             # TypeScript 类型定义
├── server/                 # 后端源代码
│   ├── controllers/       # 控制器
│   ├── models/           # 数据模型
│   ├── routes/           # 路由定义
│   ├── middleware/       # 中间件
│   └── utils/            # 工具函数
├── scripts/               # 自动化脚本
├── public/               # 静态资源
└── dist/                 # 构建输出
```

## 🎯 核心功能

### 前台功能

- 🏠 **首页展示** - 轮播图、新闻动态、教师风采
- 📰 **资讯中心** - 新闻浏览、分类筛选、搜索功能
- 📚 **资源中心** - 教学资源、文档下载
- 👤 **个人中心** - 用户信息、收藏管理、浏览历史
- 🔍 **智能搜索** - 全文搜索、分类筛选

### 后台管理

- 📊 **数据统计** - 访问量、用户活跃度统计
- 📝 **内容管理** - 新闻发布、资源上传、分类管理
- 👥 **用户管理** - 用户权限、角色分配
- ⚙️ **系统设置** - 站点配置、参数设置

## 🔐 安全特性

- **JWT 身份认证** - 无状态认证机制
- **权限控制** - 基于角色的访问控制 (RBAC)
- **输入验证** - 服务端数据验证
- **CORS 配置** - 跨域请求安全
- **密码加密** - bcrypt 哈希加密
- **文件上传安全** - 类型和大小限制

## 📈 性能优化

- **代码分割** - 按需加载，减少初始包体积
- **资源压缩** - Gzip/Brotli 压缩
- **缓存策略** - 浏览器缓存和 CDN 缓存
- **图片优化** - WebP 格式，懒加载
- **数据库优化** - 索引优化，查询优化

## 🚀 快速开始

### 开发环境启动

```bash
# 安装依赖
npm install

# 启动前端开发服务器
npm run dev

# 启动后端服务器
cd server && npm start

# 运行测试
npm test
```

### 生产环境部署

```bash
# 构建项目
npm run build

# Docker 部署
docker-compose -f docker-compose.prod.yml up -d
```

## 🎨 UI/UX 设计

- **响应式设计** - 适配桌面端和移动端
- **现代化界面** - 简洁美观的用户界面
- **用户体验** - 直观的导航和交互
- **主题色彩** - 符合思政教育特色的红色主题
- **无障碍访问** - 支持键盘导航和屏幕阅读器

## 📞 联系信息

- **项目负责人**: 开发团队
- **技术支持**: 详见 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **问题反馈**: 通过 GitHub Issues 提交

## 📝 更新日志

- **2025-06-04**: 完成性能优化和代码质量修复
- **2025-06-04**: 完成基础功能测试 (15%)
- **2025-06-04**: 完成语法错误修复和代码格式化

---

> 📌 **重要提示**: 在进行任何部署操作前，请仔细阅读 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 文档。
