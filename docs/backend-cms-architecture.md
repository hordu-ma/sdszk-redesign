> ⚠️ 本文件已拆分：请使用新的结构化文档：
>
> - `architecture/system-overview.md` （高层视图）
> - `architecture/backend-modules.md` （模块与模型细节）
>   旧内容暂保留于下方供比对，后续批次可能彻底归档至 `docs/archive/`。

# （Legacy）后端内容管理系统架构文档

## 📋 项目概述

山东省大中小学思政课一体化指导中心的后端内容管理系统，基于 **Node.js + Express + MongoDB** 技术栈构建，提供完整的内容管理、用户权限、系统设置等功能。

## 🗃️ 文件结构总览

### **核心模型文件 (Models)**

```
sdszk-redesign/server/models/
├── News.js                    # 新闻模型 (完整CMS功能)
├── NewsCategory.js            # 新闻分类模型
├── Resource.js                # 资源模型 (文档/视频管理)
├── ResourceCategory.js        # 资源分类模型
├── SiteSetting.js            # 网站设置模型
├── User.js                    # 用户模型 (权限管理)
├── Activity.js               # 活动模型
├── ActivityLog.js            # 操作日志模型
├── Comment.js                # 评论模型
├── Favorite.js               # 收藏模型
├── Share.js                   # 分享模型
└── ViewHistory.js            # 浏览历史模型
```

### **控制器文件 (Controllers)**

```
sdszk-redesign/server/controllers/
├── newsController.js          # 新闻管理控制器 (主要CMS功能)
├── newsCategoryController.js  # 新闻分类控制器
├── resourceController.js     # 资源管理控制器
├── adminResourceController.js # 管理员资源控制器
├── resourceCategoryController.js # 资源分类控制器
├── siteSettingController.js  # 网站设置控制器
├── userController.js         # 用户管理控制器
├── authController.js         # 认证控制器
├── uploadController.js       # 文件上传控制器
├── activityController.js     # 活动控制器
├── activityLogController.js  # 操作日志控制器
├── favoriteController.js     # 收藏控制器
├── viewHistoryController.js  # 浏览历史控制器
└── dashboardController.js    # 仪表盘控制器
```

### **路由文件 (Routes)**

```
sdszk-redesign/server/routes/
├── news.js                   # 新闻路由 (前端API)
├── adminNews.js             # 管理员新闻路由 (后台管理)
├── newsCategories.js        # 新闻分类路由
├── resources.js             # 资源路由 (前端API)
├── adminResources.js        # 管理员资源路由 (后台管理)
├── resourceCategories.js    # 资源分类路由
├── settings.js              # 网站设置路由
├── users.js                 # 用户管理路由
├── auth.js                  # 认证路由
├── upload.js                # 文件上传路由
├── activities.js            # 活动路由
├── activityLogs.js          # 操作日志路由
├── favorites.js             # 收藏路由
├── viewHistory.js           # 浏览历史路由
├── dashboard.js             # 仪表盘路由
├── roles.js                 # 角色管理路由
└── permissions.js           # 权限管理路由
```

### **中间件文件 (Middleware)**

```
sdszk-redesign/server/middleware/
├── auth.js                   # 身份认证中间件
├── permissionMiddleware.js   # 权限检查中间件
└── rateLimit.js             # 访问限制中间件
```

### **数据库相关文件**

```
sdszk-redesign/server/
├── migrations/
│   ├── 20240101000001_init_news_categories.js  # 新闻分类初始化
│   └── core/                                   # 核心迁移文件目录
├── seeds/
│   └── index.js                               # 数据种子文件
└── models/
    └── index.js                               # 模型索引文件
```

### **工具和服务文件**

```
sdszk-redesign/server/
├── utils/
│   ├── responseHelper.js     # 统一API响应格式
│   ├── catchAsync.js         # 异步错误捕获
│   └── appError.js          # 自定义错误类
├── services/
│   └── cacheService.js      # 缓存服务
└── config/
    ├── cors.js              # CORS配置
    ├── security.js          # 安全配置
    └── redis.js             # Redis配置
```

### **主要配置文件**

```
sdszk-redesign/server/
├── app.js                    # Express应用主文件
├── package.json             # 依赖配置
├── check-resources.js       # 资源检查脚本
└── scripts/                 # 各种脚本文件目录
```

## 🔍 主要功能模块分析

### 1. 新闻管理系统 (News Management)

**核心特性:**

- **状态管理**: 支持草稿(draft)、已发布(published)、已归档(archived)三种状态
- **内容分类**: 核心分类（中心动态、通知公告、政策文件）+ 自定义分类
- **内容增强**: 置顶、精选、重要性级别、标签系统
- **SEO优化**: 元标题、元描述、关键词
- **媒体支持**: 缩略图、附件管理
- **统计分析**: 浏览量统计、热门内容分析

**主要文件:**

- `models/News.js` - 新闻数据模型，包含完整的字段定义和索引优化
- `models/NewsCategory.js` - 分类模型，支持核心分类保护
- `controllers/newsController.js` - 业务逻辑处理，包含高级搜索和批量操作
- `routes/news.js` - 前端API路由
- `routes/adminNews.js` - 后台管理路由

**API功能:**

- CRUD操作（创建、读取、更新、删除）
- 批量操作（批量删除、状态更新、分类变更、标签添加）
- 状态切换（置顶、精选、发布状态）
- 高级搜索（关键词、分类、状态、时间范围等）
- 统计信息（总数、各状态数量、浏览量统计）

### 2. 资源管理系统 (Resource Management)

**核心特性:**

- **多媒体支持**: 文档、视频、图片等多种资源类型
- **分类体系**: 理论前沿、教学研究、影像思政等专业分类
- **文件管理**: 文件上传、大小限制、类型验证
- **互动功能**: 下载统计、点赞、评论、分享
- **关联推荐**: 相关资源推荐算法
- **版本控制**: 资源更新历史记录

**主要文件:**

- `models/Resource.js` - 资源数据模型
- `models/ResourceCategory.js` - 资源分类模型
- `controllers/resourceController.js` - 前端资源控制器
- `controllers/adminResourceController.js` - 管理员资源控制器
- `routes/resources.js` - 前端资源路由
- `routes/adminResources.js` - 管理员资源路由

### 3. 网站设置系统 (Site Settings)

**核心特性:**

- **分组管理**: 按功能分组（基本信息、外观、首页、联系方式等）
- **类型化设置**: 文本、数字、布尔值、JSON、数组、图片、颜色等
- **保护机制**: 核心设置保护，防止误删除
- **缓存优化**: Redis缓存提升性能
- **版本追踪**: 设置变更历史记录

**主要文件:**

- `models/SiteSetting.js` - 设置数据模型，包含默认设置初始化
- `controllers/siteSettingController.js` - 设置管理控制器，集成缓存
- `routes/settings.js` - 设置管理路由

**默认设置组:**

- `general` - 网站基本信息（名称、描述等）
- `appearance` - 外观设置（Logo、主题色等）
- `homepage` - 首页配置（轮播图、布局等）
- `contact` - 联系信息（邮箱、电话、地址等）
- `footer` - 页脚设置（版权、备案信息等）

### 4. 用户权限系统 (User & Permission)

**核心特性:**

- **角色管理**: 管理员、编辑、用户等多级角色
- **权限控制**: 基于资源和操作的细粒度权限控制
- **JWT认证**: 安全的令牌认证机制
- **会话管理**: 令牌过期、刷新机制
- **操作审计**: 完整的用户操作日志

**主要文件:**

- `models/User.js` - 用户数据模型
- `controllers/userController.js` - 用户管理控制器
- `controllers/authController.js` - 认证控制器
- `middleware/auth.js` - 身份认证中间件
- `middleware/permissionMiddleware.js` - 权限检查中间件

### 5. 内容交互系统 (Content Interaction)

**核心特性:**

- **收藏功能**: 用户个人收藏夹管理
- **浏览历史**: 自动记录用户浏览轨迹
- **评论系统**: 多层级评论回复（模型已定义）
- **分享功能**: 社交媒体分享统计（模型已定义）
- **个性化推荐**: 基于用户行为的内容推荐

**主要文件:**

- `models/Favorite.js` - 收藏数据模型
- `models/ViewHistory.js` - 浏览历史模型
- `models/Comment.js` - 评论模型
- `models/Share.js` - 分享模型
- `controllers/favoriteController.js` - 收藏控制器
- `controllers/viewHistoryController.js` - 浏览历史控制器

### 6. 系统监控 (System Monitoring)

**核心特性:**

- **操作日志**: 详细记录所有用户操作
- **活动管理**: 网站活动、事件管理
- **性能监控**: 系统运行状态监控
- **数据统计**: 访问量、用户行为等统计分析
- **报表生成**: 可视化数据报表

**主要文件:**

- `models/ActivityLog.js` - 操作日志模型
- `models/Activity.js` - 活动模型
- `controllers/activityLogController.js` - 日志控制器
- `controllers/activityController.js` - 活动控制器
- `controllers/dashboardController.js` - 仪表盘控制器

## 🎯 技术特点

### 架构设计原则

1. **分层架构**: 清晰的 Model-Controller-Route 分层
2. **模块化设计**: 功能模块独立，易于维护和扩展
3. **RESTful API**: 遵循REST设计原则的API接口
4. **异步处理**: 全面使用async/await处理异步操作

### 数据库设计

1. **Mongoose ODM**: MongoDB对象文档映射
2. **索引优化**: 针对查询场景的复合索引
3. **关联查询**: populate实现文档关联
4. **数据验证**: Schema级别的数据验证

### 性能优化

1. **Redis缓存**: 缓存热点数据提升响应速度
2. **分页查询**: 大数据集分页处理
3. **查询优化**: lean()查询减少内存占用
4. **批量操作**: 支持批量更新减少数据库请求

### 安全保障

1. **JWT认证**: 安全的用户身份验证
2. **权限控制**: 基于角色的访问控制(RBAC)
3. **输入验证**: 严格的数据输入验证
4. **CORS配置**: 跨域请求安全配置
5. **安全头设置**: Helmet安全头保护

### 错误处理

1. **统一异常处理**: catchAsync统一捕获异步错误
2. **自定义错误类**: 结构化的错误信息
3. **错误日志**: 详细的错误日志记录
4. **用户友好**: 用户友好的错误提示

### API设计

1. **统一响应格式**: 标准化的JSON响应格式
2. **分页支持**: 完整的分页信息返回
3. **状态码规范**: HTTP状态码的正确使用
4. **API文档**: OpenAPI规范的接口文档

## 🚀 部署和运维

### 环境配置

- **开发环境**: 本地MongoDB + Redis
- **生产环境**: 云数据库 + 集群部署
- **容器化**: Docker容器化部署支持

### 监控告警

- **日志收集**: 结构化日志输出
- **性能监控**: 接口响应时间监控
- **错误追踪**: 错误信息自动收集

### 数据备份

- **自动备份**: 定时数据库备份
- **增量备份**: 减少备份时间和存储
- **恢复测试**: 定期恢复测试验证

## 📈 扩展规划

### 功能扩展

- **全文搜索**: Elasticsearch集成
- **消息推送**: WebSocket实时通知
- **多媒体处理**: 图片/视频自动压缩
- **CDN集成**: 静态资源加速

### 性能优化

- **数据库分片**: 海量数据分片存储
- **读写分离**: 主从数据库架构
- **微服务化**: 服务拆分和独立部署

### 安全加固

- **API限流**: 防止接口滥用
- **数据加密**: 敏感数据加密存储
- **审计日志**: 完整的安全审计链

这个内容管理系统架构设计完善，代码质量高，具备了现代Web应用所需的全部特性，为山东省大中小学思政课一体化指导中心提供了稳定可靠的技术支撑。

---

本节以上为历史全文；新编辑请到拆分后的文件进行。未来计划：将此文件迁入 `archive/` 并仅保留迁移提示。
