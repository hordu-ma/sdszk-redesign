# 山东省思政课一体化中心 - 全栈项目

> 基于 Vue3 + TypeScript + Node.js + MongoDB 构建的现代化思政教育平台。

[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/your-repo/sdszk-redesign/blob/main/LICENSE)
[![Vue3](https://img.shields.io/badge/Vue.js-3.3.4-4FC08D.svg)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.4.9-646CFF.svg)](https://vitejs.dev/)

本项目是一个功能完善的全栈应用，旨在提供一个集新闻资讯、教学资源、在线活动和后台管理于一体的思政教育平台。

## 📚 项目文档与指南

本项目拥有详细的开发与架构文档，是理解项目、参与开发的关键。

- 📖 **[辅助开发上下文指南](./辅助开发上下文指南.md)**: **首选阅读！** 包含项目概览、技术栈、环境配置、部署流程和最佳实践的完整指南。
- 📂 **[架构文档](./dev-docs/)**: 包含前端、后端、状态管理、路由等多个层面的详细架构设计文档。

## 🛠 技术栈

<details>
<summary><strong>点击查看详细技术栈</strong></summary>

### 前端技术栈

- **核心框架**: Vue 3.3.4 + TypeScript 5.2.0
- **构建工具**: Vite 4.4.9
- **UI组件库**: Element Plus 2.3.14 + Ant Design Vue 4.0.3
- **状态管理**: Pinia 2.1.6
- **路由**: Vue Router 4.2.4
- **HTTP客户端**: Axios ^1.5.0
- **开发工具**: ESLint + Prettier + Husky

### 后端技术栈

- **运行环境**: Node.js (ES Modules)
- **Web框架**: Express 4.18.2
- **数据库**: MongoDB + Mongoose 8.1.1
- **认证**: JWT + bcrypt
- **进程管理**: PM2

</details>

## 🚀 本地开发环境启动

### 1. 环境要求

- Node.js >= 18.x
- MongoDB >= 6.x
- pnpm >= 8.x (推荐)

### 2. 安装与配置

```bash
# 1. 克隆项目到本地
git clone <your-repository-url> sdszk-redesign
cd sdszk-redesign

# 2. 安装前端依赖
npm install # 或者 pnpm install

# 3. 安装后端依赖
cd server
npm install # 或者 pnpm install
cd ..

# 4. 创建前端开发环境变量文件 .env.development
#    可以从 .env.development.example 复制 (如果存在)
#    并根据需要修改 VITE_API_BASE_URL
cp .env.development.example .env.development

# 5. 创建后端开发环境变量文件 server/.env
#    可以从 server/.env.example 复制 (如果存在)
#    并配置数据库连接 (MONGODB_URI) 和 JWT_SECRET
cp server/.env.example server/.env
```

### 3. 启动服务

建议打开两个终端窗口，分别启动前端和后端服务。

```bash
# 终端 1: 启动前端Vite开发服务器 (默认访问 http://localhost:5173)
npm run dev

# 终端 2: 启动后端Node.js开发服务器 (默认运行在 http://localhost:3000)
npm run server:dev
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
├── scripts/                # 自动化部署脚本
├── dev-docs/               # 详细架构文档
└── 辅助开发上下文指南.md   # 核心开发指南
```

## 🚀 生产环境部署

项目的部署流程已高度自动化，通过脚本完成。

- **前端部署**:

  - 执行 `npm run build:aliyun` 来构建生产环境的前端静态文件。
  - 执行 `bash scripts/deploy.sh` 将构建产物同步到服务器。

- **后端部署**:

  - 执行 `bash scripts/deploy-backend.sh` 将后端代码同步到服务器并使用PM2重启服务。

- **Nginx 配置**:
  - 执行 `bash scripts/deploy-nginx.sh` 来更新服务器的Nginx配置。

> **注意**: 执行部署脚本前，请确保已根据 `辅助开发上下文指南.md` 正确配置了服务器免密登录和脚本中的目标路径。

## 🤝 贡献指南

欢迎参与项目贡献！请遵循以下流程：

1.  Fork 本仓库。
2.  创建您的特性分支 (`git checkout -b feat/AmazingFeature`)。
3.  提交您的更改 (`git commit -m 'feat: Add some AmazingFeature'`)。
4.  推送到分支 (`git push origin feat/AmazingFeature`)。
5.  提交 Pull Request。

请确保您的代码遵循项目已配置的 ESLint 和 Prettier 规范。

## 📄 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。
