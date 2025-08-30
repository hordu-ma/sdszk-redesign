# 山东省思政课一体化中心 - 开发指南

> 快速上手开发指南，为每次重新进入项目提供核心上下文支撑

## 🎯 项目概览

| 项目信息     | 内容                                 |
| ------------ | ------------------------------------ |
| **项目名称** | 山东省思想政治理论课一体化教育平台   |
| **生产域名** | https://horsduroot.com               |
| **服务器**   | 阿里云ECS (60.205.124.67)            |
| **管理后台** | https://horsduroot.com/admin         |
| **架构类型** | 双前端系统（公众前台 + 管理后台CMS） |

## 🛠️ 技术栈架构

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

## 📁 项目结构

```
sdszk-redesign/
├── src/                    # 前端源代码
│   ├── views/News.vue     # 前台新闻主页
│   ├── views/admin/       # 管理后台模块
│   ├── api/               # API接口定义
│   ├── stores/            # Pinia状态管理
│   └── components/        # 公共组件
├── server/                # 后端源代码
│   ├── controllers/       # 业务逻辑控制器
│   ├── models/           # Mongoose数据模型
│   ├── routes/           # API路由定义
│   ├── middleware/       # Express中间件
│   └── .env              # 开发环境配置
├── scripts/              # 部署脚本
│   ├── deploy.sh         # 前端部署
│   ├── deploy-backend.sh # 后端部署
│   └── deploy-nginx.sh   # Nginx配置部署
└── docs/                 # 项目文档
```

## 🔧 环境配置

### 配置文件对应关系

| 环境     | 前端配置           | 后端配置                 | 用途                 |
| -------- | ------------------ | ------------------------ | -------------------- |
| **开发** | `.env.development` | `server/.env`            | 本地开发，API: /api  |
| **生产** | `.env.aliyun`      | `server/.env.production` | 阿里云部署，同域部署 |

### 关键环境变量

#### 前端 (.env.development / .env.aliyun)

```bash
VITE_API_BASE_URL=/api              # API基础路径
VITE_APP_DEBUG=true/false          # 调试模式
VITE_CACHE_ENABLED=true            # 缓存开关
```

#### 后端 (server/.env / server/.env.production)

```bash
MONGODB_URI=mongodb://localhost:27017/sdszk  # 数据库连接
JWT_SECRET=<生产环境强密钥>                   # JWT密钥
FRONTEND_URL=https://horsduroot.com          # 前端域名
REDIS_HOST=127.0.0.1                        # Redis主机
PORT=3000                                    # 服务端口
```

## 🚀 快速启动

### 自动化开发环境

#### 一键启动/停止脚本

```bash
# 🟢 启动完整开发环境 (推荐)
./scripts/development/dev-start.sh
# 自动启动: Redis、MongoDB、后端服务器、前端服务器
# 访问: http://localhost:5173 (前端) | http://localhost:3000 (API)

# 🔴 停止开发环境
./scripts/development/dev-stop.sh
# 自动清理所有相关进程和端口
```

#### 手动启动（传统方式）

```bash
# 1. 安装依赖
npm install                   # 前端依赖
cd server && npm install      # 后端依赖

# 2. 环境配置初始化
./scripts/development/setup-dev-env.sh    # 自动创建.env配置

# 3. 启动服务（推荐顺序）
# 终端1：先启动后端
npm run server:dev           # 后端开发服务器 (localhost:3000)

# 终端2：再启动前端
npm run dev                  # 前端开发服务器 (localhost:5173)
```

### 生产环境部署

#### 前端部署

```bash
# 完整前端部署流程
npm run build:aliyun         # 构建生产版本 (.env.aliyun)
npm run deploy:aliyun        # 或使用: ./scripts/deployment/deploy.sh

# 手动步骤：
./scripts/deployment/deploy.sh
# ├── 构建检查和Git状态验证
# ├── 使用vite.config.aliyun.ts构建
# ├── SSH连接测试
# ├── 可选备份现有文件
# ├── rsync同步到/var/www/frontend
# ├── 设置正确的文件权限
# ├── 重载Nginx配置
# └── 验证部署结果
```

#### 后端部署

```bash
# 完整后端部署流程
npm run deploy:backend       # 或使用: ./scripts/deployment/deploy-backend.sh

# 部署步骤：
./scripts/deployment/deploy-backend.sh
# ├── 检查.env.production配置文件
# ├── 创建server-dist构建目录
# ├── 复制服务器代码和生产配置
# ├── 安装生产依赖
# ├── 打包为server-deploy.zip
# ├── 上传到服务器/tmp目录
# ├── 服务器端自动解压和部署
# ├── PM2重启sdszk-backend服务
# └── 验证部署状态
```

#### 完整生产部署

```bash
# 完整系统部署 (Docker化)
./scripts/deployment/deploy-prod.sh
# 使用docker-compose.prod.yml重建整个系统栈

# Nginx配置更新
./scripts/deployment/deploy-nginx.sh
# 同步nginx-ssl.conf到服务器并重载配置
```

## 🔗 核心API路由

### 前台接口

- `/api/news` - 新闻资讯接口
- `/api/resources` - 教学资源接口
- `/api/auth` - 用户认证管理

### 后台管理接口

- `/api/admin/news` - 后台新闻管理
- `/api/admin/resources` - 后台资源管理
- `/api/admin/*` - 管理后台专用接口

### 业务模块

- **新闻系统**: center(中心动态) / notice(通知公告) / policy(政策文件)
- **资源系统**: 教学资源上传、分类管理
- **权限系统**: JWT + 角色权限多级验证

## 💾 数据库管理

### 数据库同步脚本详解

#### 1. 快速同步（推荐日常使用）

```bash
# 一键从生产环境同步到本地
npm run db:sync              # 等价于: ./scripts/database/quick-sync.sh

# 脚本功能：
# ├── 检查MongoDB Tools和SSH连接
# ├── 自动备份本地数据（安全措施）
# ├── 从生产服务器导出sdszk数据库
# ├── 下载并解压数据
# ├── 清空本地sdszk数据库
# ├── 恢复生产数据到本地
# ├── 清除Redis缓存
# └── 清理临时文件

# 强制执行（跳过确认）
./scripts/database/quick-sync.sh --force
```

#### 2. 完整同步工具（交互式菜单）

```bash
# 多功能数据库同步工具
npm run db:sync-full         # 等价于: ./scripts/database/sync-database.sh

# 功能菜单：
# 1️⃣  从生产环境备份数据到本地
# 2️⃣  将生产环境数据同步到本地开发环境
# 3️⃣  备份本地数据
# 4️⃣  恢复本地数据（从备份文件）
# 5️⃣  通过SSH隧道连接生产环境
# 6️⃣  查看备份文件列表
# 7️⃣  清理旧备份文件
```

#### 3. SSH隧道连接（只读访问）

```bash
# 建立到生产数据库的安全隧道
npm run db:tunnel            # 等价于: ./scripts/database/mongodb-tunnel.sh

# 连接后可在MongoDB Compass中使用:
# mongodb://localhost:27018/sdszk

# 手动建立隧道：
ssh -L 27018:localhost:27017 root@60.205.124.67 -f -N

# 关闭隧道：
pkill -f "ssh -L 27018:localhost:27017"
```

#### 4. 数据库验证

```bash
# 验证本地数据库状态
npm run db:verify            # 等价于: ./scripts/database/verify-database.sh

# 检查内容：
# ├── 数据库连接状态
# ├── 各集合的文档数量
# ├── 索引状态
# └── 数据完整性验证
```

### 核心数据模型

- `User.js` - 用户模型（角色权限）
- `News.js` - 新闻文章模型
- `Resource.js` - 教学资源模型
- `*Category.js` - 分类模型系列（新闻分类、资源分类）

### 数据库备份策略

```bash
# 备份文件位置: database-backups/
# 命名格式: {type}-backup-{timestamp}.tar.gz
# 类型:
# ├── local-backup-*        - 本地数据备份
# └── production-backup-*   - 生产数据备份
```

## 🎯 开发规范与测试

### ES Modules规范

- **模块类型**: `"type": "module"` 完全使用ES模块
- **导入语法**: `import { ... } from '...'`
- **路径别名**: `@/*` 映射到 `./src/*`
- **文件扩展名**: `.js`, `.ts`, `.vue` 需明确指定

### Git提交规范

```bash
feat: 添加新功能      # 新功能
fix: 修复bug         # Bug修复
docs: 文档更新       # 文档变更
style: 代码格式      # 样式调整
refactor: 重构       # 代码重构
test: 测试相关       # 测试更新
chore: 构建/工具     # 构建或工具变更
```

### 完整测试套件

#### 单元测试

```bash
npm run test              # Vitest单元测试
npm run test:ui           # 带UI界面的测试
npm run test:coverage     # 生成测试覆盖率报告
npm run test:integration  # 集成测试
```

#### E2E测试 (Playwright)

```bash
# 基础E2E测试
npm run test:e2e          # 全量E2E测试
npm run test:e2e:basic    # 基础功能测试
npm run test:e2e:performance  # 性能测试

# 浏览器特定测试
npm run test:e2e:chromium # Chrome浏览器测试
npm run test:e2e:firefox  # Firefox浏览器测试
npm run test:e2e:webkit   # Safari浏览器测试

# 调试和报告
npm run test:e2e:debug    # 调试模式
npm run test:e2e:headed   # 有界面模式
npm run test:e2e:ui       # 测试UI界面
npm run test:e2e:report   # 查看测试报告
npm run test:e2e:ci       # CI环境测试
```

#### 代码质量检查

```bash
# ESLint检查
npm run lint              # 前端代码检查
npm run lint:backend      # 后端代码检查
npm run lint:vue          # Vue文件检查
npm run lint:server       # 服务器代码检查

# Prettier格式化
npm run format            # 代码格式化

# 安全审计
npm run audit:fix         # 修复安全漏洞
```

### 开发工具脚本

#### 环境诊断

```bash
# 系统监控
./scripts/development/monitor.sh
# ├── Docker服务状态
# ├── 应用健康检查
# ├── 系统资源监控（CPU、内存、磁盘）
# ├── 容器资源使用统计
# ├── 数据库连接测试
# ├── 错误日志分析
# └── 访问量统计

# 服务调试
./scripts/development/debug-services.sh
# ├── 环境信息诊断
# ├── 工具可用性检查
# ├── Docker容器状态
# ├── 端口监听状态
# ├── TCP连接测试
# ├── MongoDB/Redis连接测试
# └── wait-services.sh组件测试
```

#### 环境清理

```bash
# 清理项目缓存
./scripts/development/clear-cache.sh
# 清理node_modules、构建缓存、日志文件等

# 完整项目清理
./scripts/development/cleanup-project.sh
# 深度清理项目，重置到干净状态

# 端口清理
./scripts/kill-ports.sh
# 强制清理占用的端口进程
```

#### 服务测试

```bash
# Redis连接测试
./scripts/testing/test-redis.sh
# 全面的Redis连接和性能测试

# Redis增强测试
./scripts/testing/test-redis-enhanced.sh
# 带详细诊断信息的Redis测试

# MongoDB测试
./scripts/testing/test-mongodb.sh
# MongoDB连接和数据操作测试

# 前端性能测试
./scripts/testing/test-frontend-performance.js
# 前端性能基准测试

# 端口测试
./scripts/test-ports.sh
# 批量测试端口连通性
```

## 🔍 故障排查与诊断

### 自动化诊断脚本

#### 完整环境诊断

```bash
# 全面的开发环境诊断
./scripts/development/debug-services.sh
# 检查：环境信息、工具可用性、Docker状态、端口监听、数据库连接

# 后端服务诊断
./scripts/development/diagnose-backend.sh
# 专门针对后端API服务的详细诊断
```

### 前端问题排查

#### 构建和部署问题

```bash
# 检查前端构建
npm run build:aliyun         # 使用生产配置构建
vite build --mode development # 开发模式构建

# 构建产物检查
ls -la dist/                 # 检查构建输出
du -sh dist/                 # 检查构建大小

# 预览构建结果
npm run preview              # 本地预览构建版本

# API连接测试
curl https://horsduroot.com/api/health          # 生产API
curl http://localhost:3000/api/health           # 本地API

# 前端性能测试
./scripts/testing/test-frontend-performance.js
```

#### 开发服务器问题

```bash
# 端口冲突检查
./scripts/test-ports.sh
lsof -i :5173                # 检查前端端口
lsof -i :3000                # 检查后端端口

# 强制清理端口
./scripts/kill-ports.sh

# 缓存清理
./scripts/development/clear-cache.sh
rm -rf node_modules/.vite    # 清理Vite缓存
```

### 后端问题排查

#### 本地开发问题

```bash
# 后端服务状态
ps aux | grep "node.*app.js" # 检查本地后端进程
netstat -tlnp | grep :3000   # 检查端口监听

# 后端日志
tail -f server/logs/*.log    # 查看应用日志
npm run server:dev           # 开发模式启动（查看实时日志）

# 环境变量检查
cat server/.env | head -10   # 查看配置（隐藏敏感信息）
./scripts/development/setup-dev-env.sh  # 重新生成配置
```

#### 生产环境问题

```bash
# PM2服务管理
ssh root@60.205.124.67 "pm2 status"                    # 服务状态
ssh root@60.205.124.67 "pm2 logs sdszk-backend --lines 50"  # 查看日志
ssh root@60.205.124.67 "pm2 restart sdszk-backend"     # 重启服务
ssh root@60.205.124.67 "pm2 show sdszk-backend"        # 详细信息

# 服务器系统状态
ssh root@60.205.124.67 "systemctl status nginx"       # Nginx状态
ssh root@60.205.124.67 "df -h"                         # 磁盘空间
ssh root@60.205.124.67 "free -h"                       # 内存使用
ssh root@60.205.124.67 "top -n 1"                      # CPU负载

# 应用配置检查
ssh root@60.205.124.67 "cd /var/www/sdszk-backend && ls -la .env"
ssh root@60.205.124.67 "nginx -t"                      # Nginx配置测试
```

### 数据库问题排查

#### MongoDB诊断

```bash
# 本地MongoDB
mongosh sdszk --eval "db.stats()"                     # 数据库统计
mongosh sdszk --eval "db.runCommand({ping: 1})"       # 连接测试
mongosh sdszk --eval "show collections"               # 显示集合

# 数据完整性检查
npm run db:verify                                     # 验证数据库
./scripts/testing/test-mongodb.sh                     # MongoDB测试脚本

# 生产数据库（通过隧道）
npm run db:tunnel                                     # 建立SSH隧道
mongosh "mongodb://localhost:27018/sdszk" --eval "db.stats()"

# 数据库备份检查
ls -la database-backups/                              # 查看备份文件
mongorestore --dryRun --db sdszk database-backups/latest/  # 测试恢复
```

#### Redis诊断

```bash
# 本地Redis
redis-cli ping                                        # 连接测试
redis-cli info server                                 # 服务器信息
redis-cli --latency                                   # 延迟测试

# Redis专用测试脚本
./scripts/testing/test-redis.sh                      # 基础测试
./scripts/testing/test-redis-enhanced.sh             # 增强测试

# Redis缓存管理
redis-cli FLUSHALL                                    # 清空所有缓存
redis-cli keys "*"                                    # 查看所有键
```

### 网络和连接问题

#### SSL和域名问题

```bash
# SSL证书检查
curl -vI https://horsduroot.com 2>&1 | grep -i ssl
openssl s_client -connect horsduroot.com:443 -servername horsduroot.com

# DNS解析检查
nslookup horsduroot.com
dig horsduroot.com A
ping horsduroot.com
```

#### 服务连通性测试

```bash
# 生产服务器连接
ssh -T root@60.205.124.67                            # SSH连接测试
telnet 60.205.124.67 22                              # SSH端口测试
telnet 60.205.124.67 80                              # HTTP端口测试
telnet 60.205.124.67 443                             # HTTPS端口测试

# API端点测试
curl -f -s --max-time 10 "https://horsduroot.com/api/health"
curl -f -s --max-time 10 "https://horsduroot.com/api/news?limit=1"
```

### 常见错误解决方案

#### "端口已被占用"错误

```bash
./scripts/kill-ports.sh      # 清理端口
./scripts/development/dev-stop.sh  # 停止所有开发服务
lsof -ti:5173 | xargs kill -9     # 强制关闭前端端口
lsof -ti:3000 | xargs kill -9     # 强制关闭后端端口
```

#### "数据库连接失败"错误

```bash
# 重启本地数据库服务
brew services restart mongodb-community
redis-server --daemonize yes

# 重新同步数据
npm run db:sync --force

# 重置数据库配置
./scripts/development/setup-dev-env.sh
```

#### "构建失败"错误

```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install

# 清理构建缓存
rm -rf dist/ .vite/
./scripts/development/clear-cache.sh

# 检查TypeScript错误
npx vue-tsc --noEmit
```

## 🛠️ 脚本命令速查表

### 开发环境管理

| 命令                                       | 功能                    | 脚本位置     |
| ------------------------------------------ | ----------------------- | ------------ |
| `./scripts/development/dev-start.sh`       | 🟢 一键启动完整开发环境 | development/ |
| `./scripts/development/dev-stop.sh`        | 🔴 停止所有开发服务     | development/ |
| `./scripts/development/setup-dev-env.sh`   | ⚙️ 初始化开发环境配置   | development/ |
| `./scripts/development/monitor.sh`         | 📊 系统监控和健康检查   | development/ |
| `./scripts/development/debug-services.sh`  | 🔍 服务连接诊断         | development/ |
| `./scripts/development/clear-cache.sh`     | 🧹 清理缓存文件         | development/ |
| `./scripts/development/cleanup-project.sh` | 🗑️ 完整项目清理         | development/ |

### 部署脚本

| 命令                                     | 功能                | 脚本位置    |
| ---------------------------------------- | ------------------- | ----------- |
| `./scripts/deployment/deploy.sh`         | 🚀 前端部署到阿里云 | deployment/ |
| `./scripts/deployment/deploy-backend.sh` | 🖥️ 后端API服务部署  | deployment/ |
| `./scripts/deployment/deploy-nginx.sh`   | 🌐 Nginx配置部署    | deployment/ |
| `./scripts/deployment/deploy-prod.sh`    | 📦 完整Docker化部署 | deployment/ |

### 数据库管理

| 命令                                    | 功能                | 脚本位置  |
| --------------------------------------- | ------------------- | --------- |
| `./scripts/database/quick-sync.sh`      | ⚡ 快速数据同步     | database/ |
| `./scripts/database/sync-database.sh`   | 🔄 完整数据同步工具 | database/ |
| `./scripts/database/mongodb-tunnel.sh`  | 🔗 SSH隧道连接      | database/ |
| `./scripts/database/verify-database.sh` | ✅ 数据库验证       | database/ |

### 测试脚本

| 命令                                             | 功能               | 脚本位置 |
| ------------------------------------------------ | ------------------ | -------- |
| `./scripts/testing/test-redis.sh`                | 🔴 Redis连接测试   | testing/ |
| `./scripts/testing/test-redis-enhanced.sh`       | 🔴 Redis增强测试   | testing/ |
| `./scripts/testing/test-mongodb.sh`              | 🍃 MongoDB连接测试 | testing/ |
| `./scripts/testing/test-frontend-performance.js` | ⚡ 前端性能测试    | testing/ |

### NPM脚本速查

| 命令                     | 功能           | 等价脚本                                 |
| ------------------------ | -------------- | ---------------------------------------- |
| `npm run dev`            | 前端开发服务器 | -                                        |
| `npm run server:dev`     | 后端开发服务器 | -                                        |
| `npm run build:aliyun`   | 生产环境构建   | -                                        |
| `npm run deploy:aliyun`  | 前端部署       | `./scripts/deployment/deploy.sh`         |
| `npm run deploy:backend` | 后端部署       | `./scripts/deployment/deploy-backend.sh` |
| `npm run db:sync`        | 快速数据同步   | `./scripts/database/quick-sync.sh`       |
| `npm run db:sync-full`   | 完整数据同步   | `./scripts/database/sync-database.sh`    |
| `npm run db:tunnel`      | SSH数据库隧道  | `./scripts/database/mongodb-tunnel.sh`   |
| `npm run test:e2e`       | E2E测试        | -                                        |
| `npm run lint`           | 代码检查       | -                                        |

## 📚 相关文档

- **详细架构**: `docs/dev-guides/辅助开发上下文指南.md`
- **API说明**: `docs/backend/API参数说明-20240613.md`
- **部署清单**: `docs/deployment/DEPLOYMENT_CHECKLIST.md`
- **Vue3架构**: `docs/dev-guides/Vue3基础架构技术文档.md`
- **Redis故障排除**: `docs/redis-troubleshooting.md`
- **阿里云部署**: `docs/deployment/阿里云部署调试指南.md`

## 🎊 快速验证

### 验证开发环境

```bash
# 前端访问
curl http://localhost:5173

# 后端API
curl http://localhost:3000/api/health

# 数据库连接
mongosh sdszk --eval "db.stats()"
```

### 验证生产环境

```bash
# 网站访问
curl https://horsduroot.com

# API健康检查
curl https://horsduroot.com/api/health

# 管理后台
curl https://horsduroot.com/admin
```

---

**最后更新**: 2025-08-30  
**适用版本**: Vue3 + Node.js + MongoDB 全栈项目  
**维护状态**: ✅ 活跃开发中

> 💡 **重要提示**: 每次重新开始开发时，建议先阅读 `docs/dev-guides/辅助开发上下文指南.md` 获取完整上下文。
