# 山东省思政课一体化中心 - 开发指南

> 精简版开发指南，专注核心流程和关键信息

## 🎯 项目概览

| 项目信息     | 内容                               |
| ------------ | ---------------------------------- |
| **项目名称** | 山东省思想政治理论课一体化教育平台 |
| **生产域名** | https://horsduroot.com             |
| **服务器**   | 阿里云ECS (60.205.124.67)          |
| **管理后台** | https://horsduroot.com/admin       |
| **架构类型** | Vue3前端 + Node.js后端 + MongoDB   |

## 🛠️ 技术栈

**前端**: Vue 3.3.4 + TypeScript + Vite + Element Plus
**后端**: Node.js + Express + MongoDB + JWT认证
**部署**: PM2 + Nginx + SSL + 阿里云ECS

## 🚀 快速部署

### 一键部署脚本（推荐）

```bash
# 前端部署
./scripts/deployment/deploy.sh

# 后端部署
./scripts/deployment/deploy-backend.sh

# Nginx配置部署（配置变更时）
./scripts/deployment/deploy-nginx.sh
```

### 部署特性

✅ **自动备份与回滚** - 部署失败自动恢复
✅ **健康检查** - 部署后自动验证服务状态
✅ **错误处理** - 完善的错误检测和日志记录
✅ **部署锁** - 防止并发部署冲突
✅ **Pre-flight检查** - 部署前验证环境和依赖

### 环境配置

```bash
# 前端环境文件
.env.aliyun          # 阿里云生产环境配置

# 后端环境文件
server/.env          # 开发环境配置
server/.env.production  # 生产环境配置
```

## 🔧 开发环境

### 本地启动

```bash
# 启动前端开发服务器
npm run dev

# 启动后端API服务器
npm run server:dev

# 启动数据库
npm run dev:db
```

### 自动化脚本

```bash
# 一键启动开发环境
./scripts/development/dev-start.sh

# 一键停止开发环境
./scripts/development/dev-stop.sh

# 环境诊断
./scripts/development/dev-health.sh
```

## 💾 数据库管理

### 核心脚本

```bash
# 快速同步生产数据到本地
./scripts/database/quick-sync.sh

# 完整数据库同步工具
./scripts/database/sync-database.sh

# 数据库验证
./scripts/database/verify-database.sh

# SSH隧道连接（只读）
./scripts/database/mongodb-tunnel.sh
```

### 数据库配置

- **生产**: MongoDB Atlas / 阿里云MongoDB
- **开发**: 本地MongoDB (sdszk数据库)
- **连接**: 统一使用 `sdszk` 数据库名

## 📁 核心项目结构

```
sdszk-redesign/
├── src/                    # 前端源代码
│   ├── views/             # 页面组件
│   ├── components/        # 通用组件
│   ├── api/              # API接口
│   └── stores/           # Pinia状态管理
├── server/               # 后端源代码
│   ├── app.js           # 入口文件
│   ├── routes/          # 路由定义
│   ├── models/          # 数据模型
│   └── middleware/      # 中间件
└── scripts/             # 自动化脚本
    ├── deployment/      # 部署脚本
    ├── development/     # 开发脚本
    └── database/        # 数据库脚本
```

## 🔗 核心API路由

### 前台接口

- `/api/news` - 新闻资讯
- `/api/resources` - 教学资源
- `/api/auth` - 用户认证

### 后台接口

- `/api/admin/news` - 新闻管理
- `/api/admin/resources` - 资源管理
- `/api/admin/users` - 用户管理

## 🎯 部署流程详解

### 1. 前端部署流程

```bash
./scripts/deployment/deploy.sh
```

**执行步骤**:

1. Pre-flight检查（工具、SSH连接、Git状态）
2. 构建前端项目（Vite + TypeScript）
3. 创建服务器备份
4. 上传文件到服务器
5. 设置文件权限
6. 重载Nginx配置
7. 健康检查验证
8. 生成部署报告

### 2. 后端部署流程

```bash
./scripts/deployment/deploy-backend.sh
```

**执行步骤**:

1. Pre-flight检查（Node.js、配置文件、PM2）
2. 隔离环境构建项目
3. 安装生产依赖
4. 打包部署文件
5. 创建服务器备份
6. 上传并解压部署包
7. PM2重启服务
8. 健康检查验证
9. 生成部署报告

### 3. 回滚机制

每次部署都会自动创建备份，如需回滚：

```bash
# 查看回滚信息文件
ls /tmp/*-rollback-*.info

# 使用回滚信息手动恢复
source /tmp/frontend-rollback-XXXXXX.info
ssh $SERVER_USER@$SERVER_IP "mv $BACKUP_DIR $DEPLOY_PATH"
```

## 🔍 故障排查

### 部署问题

```bash
# 检查部署锁
ls /tmp/*-deploy.lock

# 查看最近部署日志
ssh root@60.205.124.67 "pm2 logs sdszk-backend --lines 50"

# 检查Nginx状态
ssh root@60.205.124.67 "nginx -t && systemctl status nginx"
```

### 服务状态检查

```bash
# 检查所有服务状态
ssh root@60.205.124.67 "pm2 status && systemctl status nginx"

# 检查端口占用
ssh root@60.205.124.67 "netstat -tlnp | grep ':3000'"

# 测试网站访问
curl -I https://horsduroot.com
```

### 常见错误解决

| 错误类型       | 检查方法            | 解决方案                    |
| -------------- | ------------------- | --------------------------- |
| 部署失败       | 查看部署日志        | 使用自动回滚或手动恢复备份  |
| 服务无响应     | `pm2 status`        | `pm2 restart sdszk-backend` |
| Nginx错误      | `nginx -t`          | 检查配置文件语法            |
| 数据库连接失败 | 检查.env.production | 验证MONGODB_URI配置         |

## 📊 NPM脚本速查

### 开发脚本

```bash
npm run dev              # 启动前端开发服务器
npm run server:dev       # 启动后端开发服务器
npm run dev:db          # 启动本地数据库
```

### 构建脚本

```bash
npm run build:aliyun    # 构建生产版本
npm run preview         # 预览构建结果
```

### 部署脚本

```bash
npm run deploy:frontend  # 等同于 ./scripts/deployment/deploy.sh
npm run deploy:backend   # 等同于 ./scripts/deployment/deploy-backend.sh
```

### 测试脚本

```bash
npm run test            # 运行单元测试
npm run test:e2e        # 运行E2E测试
npm run lint            # 代码检查
```

## 🎊 快速验证

### 验证开发环境

```bash
# 检查所有服务是否正常
curl http://localhost:5173        # 前端服务
curl http://localhost:3000/api/health  # 后端API
mongosh --eval "db.adminCommand('ping')"  # 数据库
```

### 验证生产环境

```bash
# 检查网站访问
curl -I https://horsduroot.com
curl -I https://www.horsduroot.com

# 检查API服务
curl https://horsduroot.com/api/health

# 检查管理后台
curl -I https://horsduroot.com/admin
```

## 📚 重要提醒

1. **部署前** - 确保代码已提交，测试通过
2. **部署中** - 观察日志输出，注意错误信息
3. **部署后** - 验证网站功能，检查服务状态
4. **紧急情况** - 使用自动生成的回滚信息快速恢复

---

**更新日期**: 2025-09-03
**版本**: 2.0 - 安全增强版部署脚本
