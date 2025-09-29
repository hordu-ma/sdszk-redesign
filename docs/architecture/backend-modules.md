---
title: 后端模块详解
updated: 2025-09-29
status: draft
owner: platform-team
---

# 后端模块详解

本文件细化各领域模型、控制器与路由职责。高层结构见 `system-overview.md`。

## 目录

- 内容 (Content)
  - 新闻 (News)
  - 资源 (Resource)
  - 分类 (Category)
- 用户与权限 (User & Access)
- 交互 (Interaction)
- 配置 (Configuration)
- 运营与监控 (Operations)

---

## 内容领域 (Content Domain)

### 1. 新闻 (News)

| 组件     | 位置                            | 说明                                                                 |
| -------- | ------------------------------- | -------------------------------------------------------------------- |
| 模型     | `models/News.js`                | 字段：标题/状态/标签/SEO/置顶/浏览量等，含索引：状态+时间、分类+时间 |
| 分类模型 | `models/NewsCategory.js`        | 保护核心分类，不允许删除；层级或标识控制                             |
| 控制器   | `controllers/newsController.js` | 高级过滤、批量变更、统计接口                                         |
| 管理路由 | `routes/adminNews.js`           | 需要权限；支持批量与状态流转                                         |
| 公共路由 | `routes/news.js`                | 列表/详情/搜索接口                                                   |

关键逻辑：

- 状态流转：draft → published → archived
- 批处理：批量分类迁移 / 标签追加 / 上下线
- 统计：浏览量递增策略（未来需防刷）

### 2. 资源 (Resource)

| 组件       | 位置                                              | 说明                                 |
| ---------- | ------------------------------------------------- | ------------------------------------ |
| 模型       | `models/Resource.js`                              | 多类型：文档/视频/图片；含下载统计等 |
| 分类模型   | `models/ResourceCategory.js`                      | 专业分类体系                         |
| 前台控制器 | `controllers/resourceController.js`               | 面向用户的列表/筛选                  |
| 后台控制器 | `controllers/adminResourceController.js`          | 管理员增删改 / 审核流程              |
| 路由       | `routes/resources.js`, `routes/adminResources.js` | 公共与管理分离                       |

关键逻辑：

- 文件上传：`uploadController.js` 协作（类型/大小限制）
- 推荐策略：按分类、标签或手动精选（规划扩展）

### 3. 分类 (Categories)

统一处理 News / Resource 分类模型，支持：

- 只读核心分类保护
- 列表缓存（Redis）

---

## 用户与权限 (User & Access)

| 组件       | 位置                                 | 说明                                     |
| ---------- | ------------------------------------ | ---------------------------------------- |
| 用户模型   | `models/User.js`                     | 角色字段 / 状态 / 密码散列（假设已实现） |
| 认证控制器 | `controllers/authController.js`      | 登录、刷新 Token、注销                   |
| 用户控制器 | `controllers/userController.js`      | 用户 CRUD 与角色管理                     |
| 鉴权中间件 | `middleware/auth.js`                 | 解析 JWT / 注入用户上下文                |
| 权限中间件 | `middleware/permissionMiddleware.js` | 检查 module:action (RBAC)                |

核心概念：

- 角色预置：`admin`, `editor`, `viewer` (示例)
- 权限粒度：`news:create`, `resource:publish`, `setting:update`

---

## 交互 (Interaction)

| 模块     | 模型                    | 控制器                                 | 说明                 |
| -------- | ----------------------- | -------------------------------------- | -------------------- |
| 收藏     | `models/Favorite.js`    | `controllers/favoriteController.js`    | 用户内容收藏操作     |
| 浏览历史 | `models/ViewHistory.js` | `controllers/viewHistoryController.js` | 记录最近访问         |
| 评论     | `models/Comment.js`     | (未来实现)                             | 多层级树/引用 (规划) |
| 分享     | `models/Share.js`       | (未来实现)                             | 社交分享统计 (规划)  |

---

## 配置 (Configuration)

| 组件     | 位置                                   | 说明                                                      |
| -------- | -------------------------------------- | --------------------------------------------------------- |
| 设置模型 | `models/SiteSetting.js`                | 分组配置 (general/appearance/homepage/etc) + 默认值初始化 |
| 控制器   | `controllers/siteSettingController.js` | CRUD + 缓存失效广播                                       |
| 路由     | `routes/settings.js`                   | 管理接口                                                  |
| 缓存服务 | `services/cacheService.js`             | Redis 访问封装                                            |

缓存策略：

- Key 规则：`sitesetting:<group>`
- 更新：写库 → 删除缓存 → 读取时回填

---

## 运营与监控 (Operations)

| 模块     | 模型                    | 控制器                                 | 路由                     | 说明                   |
| -------- | ----------------------- | -------------------------------------- | ------------------------ | ---------------------- |
| 活动     | `models/Activity.js`    | `controllers/activityController.js`    | `routes/activities.js`   | 平台活动发布/管理      |
| 操作日志 | `models/ActivityLog.js` | `controllers/activityLogController.js` | `routes/activityLogs.js` | 记录操作行为           |
| 仪表盘   | (聚合查询)              | `controllers/dashboardController.js`   | `routes/dashboard.js`    | 指标聚合 (浏览 / 计数) |

日志策略：

- 结构化：后续接入集中收集
- 等级：info / warn / error

---

## 中间件与横切关注点

| 名称                      | 位置                                 | 作用                     |
| ------------------------- | ------------------------------------ | ------------------------ |
| `auth.js`                 | `middleware/auth.js`                 | 解析 JWT，附加用户上下文 |
| `permissionMiddleware.js` | `middleware/permissionMiddleware.js` | 权限验证                 |
| `rateLimit.js`            | `middleware/rateLimit.js`            | 请求限流（健康检查豁免） |
| 错误处理                  | (app.js 注册)                        | 捕获与格式化输出         |
| 响应包装                  | `utils/responseHelper.js`            | 统一成功/错误结构        |

---

## 统一响应结构

成功：

```json
{ "success": true, "data": { ... }, "meta": { pagination } }
```

失败：

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

---

## 命名与约定

- 控制器命名：`<entity>Controller.js`
- 路由文件：前台 `<entity>.js` / 管理端 `admin<Entity>.js`
- 模型：单数大写开头 (`News.js`)
- 权限标识：`<module>:<action>`

---

## 规划中的增强

| 方向   | 描述                        | 优先级 |
| ------ | --------------------------- | ------ |
| 搜索   | 引入全文检索 (ES)           | M      |
| 推荐   | 基于行为/标签的内容推荐     | M      |
| 队列   | 发布/统计异步化 (RabbitMQ)  | L      |
| 多租户 | 逻辑租户隔离策略            | L      |
| 安全   | CSP + Helmet 强化 + API Key | H      |

---

_请在新增模块后：更新本文件模块表 + system-overview 中的边界说明。_
