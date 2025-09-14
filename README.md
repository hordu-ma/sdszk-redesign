# 山东省思政课一体化中心 - 全栈项目

> 基于 Vue3 + TypeScript + Node.js + MongoDB 构建的现代化思政教育平台

本项目是一个功能完善的全栈CMS应用，包含前台展示网站和管理后台系统，提供集新闻资讯、教学资源、在线活动和用户权限管理于一体的思政教育平台。

## 🎯 项目概览

| 项目信息     | 内容                                 |
| ------------ | ------------------------------------ |
| **项目名称** | 山东省思想政治理论课一体化教育平台   |
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

```bash
# 克隆项目
git clone <repository-url> sdszk-redesign
cd sdszk-redesign

# 🟢 一键启动开发环境
./scripts/development/dev-start.sh
# 自动启动: MongoDB、Redis、后端API、前端服务
# 访问: http://localhost:5173 (前端) | http://localhost:3000 (API)

# 🔴 停止开发环境
./scripts/development/dev-stop.sh
```

### 手动启动

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

## 🚀 部署

### 前端部署

```bash
npm run build:aliyun      # 构建生产版本
npm run deploy:aliyun     # 部署到阿里云
```

### 后端部署

```bash
npm run deploy:backend    # 后端服务部署
```

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
npm run db:sync           # 数据同步
npm run db:tunnel         # SSH隧道连接生产库

# 环境诊断
./scripts/development/debug-services.sh      # 全面环境检查
./scripts/development/diagnose-backend.sh    # 后端服务诊断
./scripts/kill-ports.sh                      # 清理端口占用

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
./scripts/kill-ports.sh

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

## 🚧 第二阶段规划：CMS 健康可视化监控面板

> **状态**: 📋 规划中 | **优先级**: 中期工作 | **预估周期**: 2-3周

基于第一阶段已完成的CMS自动化健康检查工具，第二阶段将开发全面的可视化监控面板，提升系统可观测性和维护效率。

### 🎯 核心目标

将现有的命令行健康检查工具升级为直观的Web可视化界面，实现：

- **实时监控**: 系统健康状态的实时展示和告警
- **历史分析**: 健康趋势的长期跟踪和预测
- **智能运维**: 自动化巡检和智能修复建议

### 📊 主要功能模块

#### 1. 实时健康状态仪表板

- 系统整体健康评分（0-100分制）
- 各CMS模块状态总览（新闻、资源、用户管理等）
- 关键指标实时监控（响应时间、错误率、可用性）
- 一键健康检查和快速操作面板

#### 2. 检查结果历史趋势

- 基于ECharts的交互式时间序列图表
- 多维度数据筛选（时间、模块、严重程度）
- 异常事件标记和趋势预测
- 健康状况对比分析

#### 3. 问题详情和修复建议

- 三级问题分类（🔴错误/🟡警告/🟢成功）
- 详细问题描述、截图和错误堆栈
- AI生成的智能修复建议
- 问题状态跟踪和处理流程

#### 4. 自动化巡检配置

- 灵活的定时任务设置（支持Cron表达式）
- 检查项目的个性化配置
- 多环境差异化设置（开发/测试/生产）
- 告警阈值和规则自定义

#### 5. 告警和通知系统

- 多渠道通知（邮件、企业微信、钉钉）
- 智能告警抑制和升级策略
- 告警历史和效果追踪
- 团队协作和权限管理

#### 6. 报告导出和分享

- 完整PDF健康报告生成
- Excel格式数据导出
- 报告分享链接和团队协作
- 自动化周报/月报

### 🏗️ 技术实现方案

#### 前端技术栈

- **基础**: 基于现有Vue3 + TypeScript架构
- **图表**: ECharts（已集成）实现丰富的数据可视化
- **UI组件**: Element Plus + Ant Design Vue
- **实时通信**: WebSocket或Server-Sent Events
- **状态管理**: Pinia持久化存储

#### 后端架构扩展

```javascript
// 新增MongoDB集合设计
HealthCheckResults; // 健康检查结果历史
MonitoringConfig; // 监控配置和规则
AlertRules; // 告警规则配置
NotificationLogs; // 通知记录和统计
```

#### 核心API接口

```bash
GET  /api/monitoring/health-status     # 实时健康状态
GET  /api/monitoring/health-history    # 历史趋势数据
POST /api/monitoring/run-check         # 手动执行检查
PUT  /api/monitoring/config            # 更新监控配置
POST /api/monitoring/alerts/rules      # 告警规则管理
GET  /api/monitoring/reports/export    # 报告导出
```

### 📅 开发实施计划

#### Phase 1: 基础设施（第1周）

- **Day 1-2**: MongoDB数据模型设计和API开发
- **Day 3-4**: 现有健康检查脚本数据库集成
- **Day 5-7**: 基础仪表板和实时状态展示

#### Phase 2: 核心功能（第2周）

- **Day 1-3**: ECharts历史趋势图表和数据筛选
- **Day 4-5**: 问题详情页面和修复建议系统
- **Day 6-7**: 自动化配置界面和定时任务

#### Phase 3: 高级功能（第3周）

- **Day 1-2**: 告警系统和多渠道通知集成
- **Day 3-4**: PDF报告生成和数据导出功能
- **Day 5-7**: 系统优化、测试和部署

### 🎯 预期价值

#### 立即收益

- **可视化问题发现**: 从文本报告到直观图表展示
- **快速问题定位**: 截图和详细日志的可视化展示
- **团队协作提升**: 统一的问题跟踪和处理流程

#### 长期价值

- **预防性维护**: 基于趋势分析的问题预测
- **数据驱动决策**: 历史数据支撑的系统优化
- **完整可观测性**: 建立CMS系统健康监控体系

### 🚀 技术亮点

1. **实时性**: WebSocket实现毫秒级数据推送
2. **智能化**: 基于ML的趋势预测和异常检测
3. **可扩展性**: 模块化设计支持新检查项目快速接入
4. **集成性**: 与现有CMS系统无缝融合
5. **易用性**: 直观的可视化界面和一键操作

---

_📝 注：此为第二阶段规划，当前专注于其他紧要工作。待适当时机启动开发。_

## 📚 相关文档

- 📖 [DEV_GUIDE.md](./DEV_GUIDE.md) - 完整开发指南
- 📂 [docs/](./docs/) - 详细架构文档
- 🔧 [scripts/](./scripts/) - 自动化脚本

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
