# 山东省大中小学思政课一体化指导中心

> 基于 Vue3 + Node.js + MongoDB 的思政教育综合平台

## 项目简介

本项目是为山东省大中小学思政课教师打造的一体化教育平台，提供资讯发布、资源共享、活动管理和个人中心等功能，旨在促进思政教育的交流与发展。

## 技术栈

### 前端

- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI库**: Ant Design Vue + Element Plus
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **样式**: SCSS

### 后端

- **运行环境**: Node.js
- **框架**: Express
- **数据库**: MongoDB + Mongoose
- **认证**: JWT
- **文件上传**: Multer

## 功能模块

- ✅ **用户认证**: 注册、登录、权限管理
- ✅ **资讯中心**: 中心动态、政策文件、通知公告
- ✅ **资源中心**: 文档、视频、教学资源管理
- ✅ **活动中心**: 第三方活动平台对接
- ✅ **个人中心**: 个人信息、收藏、历史记录
- ✅ **管理后台**: 内容管理、用户管理、系统设置
- 🔄 **AI思政**: 二期功能开发中

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- MongoDB >= 4.4.0
- npm >= 8.0.0

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
```

### 环境配置

```bash
# 复制环境配置文件
cp server/.env.example server/.env

# 编辑环境变量
# MONGODB_URI=mongodb://localhost:27017/sdszk
# JWT_SECRET=your-secret-key
# PORT=3000
```

### 启动项目

```bash
# 启动后端服务
cd server
npm run dev

# 启动前端开发服务器
npm run dev
```

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
