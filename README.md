# 山东省大中小学思政课一体化指导中心

> 基于 Vue3 + Node.js + MongoDB 的现代化思政教育平台

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com)

## 🚀 快速开始

### 环境要求

- Node.js >= 18.x
- MongoDB >= 6.x
- npm >= 8.x

### 安装与运行

```bash
# 克隆项目
git clone [repository-url]
cd sdszk-redesign

# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install && cd ..

# 配置环境变量
cp .env.development.example .env.development

# 启动开发环境
npm run dev                 # 前端开发服务器 (localhost:5173)
npm run dev:server          # 后端开发服务器 (localhost:3000)

# 生产构建
npm run build              # 构建前端项目
```

## 📚 项目文档

- 📖 **[完整文档索引](./PROJECT_DOCS_INDEX.md)** - 所有文档的导航入口
- 🚀 **[部署指南](./DEPLOYMENT_GUIDE.md)** - 生产环境部署完整指南
- ⚡ **[性能优化报告](./OPTIMIZATION_COMPLETE_REPORT.md)** - 性能优化策略和结果
- 🔧 **[代码质量报告](./SYNTAX_FIXES_REPORT.md)** - 代码修复和优化记录
- 🧪 **[测试执行报告](./test-execution-report.md)** - 当前测试状态和计划

## ⭐ 核心特性

### 🎯 功能模块

- 🏠 **首页展示** - 轮播图、新闻动态、教师风采展示
- 📰 **资讯中心** - 中心动态、政策文件、通知公告
- 📚 **资源中心** - 教学资源、文档下载、分类管理
- 🎉 **活动中心** - 第三方活动平台对接
- 👤 **个人中心** - 个人信息、收藏管理、浏览历史
- ⚙️ **管理后台** - 内容管理、用户管理、系统设置
- 🤖 **AI思政** - 智能问答和内容推荐 (开发中)

### 🛠 技术栈

- **前端**: Vue 3 + TypeScript + Vite + Element Plus + Ant Design Vue
- **后端**: Node.js + Express + MongoDB + Mongoose + JWT
- **部署**: Docker + Nginx + SSL
- **工具**: ESLint + Prettier + Vitest + Playwright

## 🏗 项目结构

```
sdszk-redesign/
├── src/                    # 前端源代码
│   ├── components/         # Vue 组件
│   ├── views/             # 页面视图
│   ├── stores/            # Pinia 状态管理
│   ├── api/               # API 接口层
│   └── styles/            # 全局样式
├── server/                 # 后端源代码
│   ├── controllers/       # 业务控制器
│   ├── models/           # 数据模型
│   ├── routes/           # 路由定义
│   └── middleware/       # 中间件
├── scripts/               # 自动化脚本
└── docs/                 # 项目文档
```

## 🎨 界面预览

- **现代化设计** - 简洁美观的用户界面
- **响应式布局** - 完美适配桌面端和移动端
- **思政主题** - 符合教育特色的红色主题设计
- **用户体验** - 直观的导航和流畅的交互

## 📊 项目状态

- ✅ **核心功能** - 100% 完成
- ✅ **性能优化** - 已完成
- ✅ **代码质量** - 已通过检查
- 🧪 **功能测试** - 15% 完成
- 🚀 **生产就绪** - 可部署状态

# JWT_SECRET=your-secret-key

# PORT=3000

````

### 启动项目

```bash
# 启动后端服务
cd server
npm run dev

# 启动前端开发服务器
npm run dev
````

### 初始化数据

```bash
# 运行数据库迁移
cd server
npm run migrate:up

# 创建种子数据
npm run seed
```

## 部署说明

详细的部署指南请参考 `scripts/deploy.sh`

## 开发计划

详细的开发计划请查看 [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)

## 项目结构

```
├── src/                 # 前端源码
│   ├── views/          # 页面组件
│   ├── components/     # 公共组件
│   ├── stores/         # 状态管理
│   └── utils/          # 工具函数
├── server/             # 后端源码
│   ├── controllers/    # 控制器
│   ├── models/         # 数据模型
│   ├── routes/         # 路由
│   └── middleware/     # 中间件
└── public/             # 静态资源
```

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情
