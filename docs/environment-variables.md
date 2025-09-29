---
title: 环境变量规范
updated: 2025-09-29
owner: platform-team
status: active
---

# 环境变量规范

本项目使用 **MongoDB + Redis + JWT** 体系。本文档提供：变量清单、分环境要求、Fail‑Fast 校验示例与最佳实践。已移除无关的示例（例如 PostgreSQL）。

## 🗂️ 文件约定

| 位置/文件                | 用途             | 是否提交 | 说明                     |
| ------------------------ | ---------------- | -------- | ------------------------ |
| `.env.example`           | 前端模板         | ✅       | 仅示例无敏感值           |
| `.env.development`       | 前端开发         | ❌       | 本地开发可选（忽略 Git） |
| `.env.aliyun`            | 前端生产（构建） | ❌       | 部署机使用（CI载入）     |
| `server/.env.example`    | 后端模板         | ✅       | 列出必需键               |
| `server/.env`            | 后端本地/开发    | ❌       | 启动后端服务             |
| `server/.env.test`       | 测试             | ✅(可)   | 仅测试值，排除敏感       |
| `server/.env.ci`         | CI 环境          | ✅       | 去敏感可审计             |
| `server/.env.production` | 生产实际         | ❌       | 部署服务器或 Secret 管理 |

## ✅ 核心变量矩阵

| 变量                                          | 必需环境                            | 示例                              | 说明                                       |
| --------------------------------------------- | ----------------------------------- | --------------------------------- | ------------------------------------------ |
| `MONGODB_URI`                                 | all                                 | `mongodb://localhost:27017/sdszk` | 主 Mongo 连接串（Prod 建议含认证与副本集） |
| `JWT_SECRET`                                  | all                                 | （32+ 随机字节 Base64）           | 缺失启动失败；禁止使用默认回退             |
| `REDIS_HOST`                                  | dev/test/ci (可选) / prod(若用缓存) | `localhost`                       | 未配置时功能降级（部分缓存/验证码失效）    |
| `LOG_LEVEL`                                   | all                                 | `debug`(dev)/`error`(prod)        | 控制结构化日志粒度                         |
| `CORS_ORIGIN`                                 | dev/ci/prod                         | `http://localhost:5173`           | 多域时可实现自定义校验逻辑                 |
| `RATE_LIMIT_MAX` or `RATE_LIMIT_MAX_REQUESTS` | prod 建议                           | `100`                             | 限流策略；命名需统一（后续 Batch 可整理）  |
| `UPLOAD_MAX_SIZE`                             | prod                                | `10485760`                        | 上传大小 Byte（10MB）                      |
| `UPLOAD_ALLOWED_TYPES`                        | prod                                | `image/jpeg,image/png`            | 逗号分隔 MIME                              |
| `NODE_ENV`                                    | all                                 | `development` / `production`      | 构建与行为分支                             |
| `PORT`                                        | server                              | `3000`                            | 后端监听端口                               |

补充变量（可选）：`SENTRY_DSN`, `VITE_ANALYTICS_ID`, `VITE_CDN_URL` 等视接入情况添加。

## 🧪 前端变量（前缀规则）

所有暴露到浏览器的变量必须以 `VITE_` 前缀：

```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_DEBUG=true
VITE_CDN_URL=https://cdn.example.com
VITE_SENTRY_DSN=__dsn__
```

> 不允许将敏感密钥（如 JWT、数据库账号）放入 `VITE_` 变量。

## 🔐 后端关键变量说明

```bash
MONGODB_URI=mongodb://localhost:27017/sdszk
JWT_SECRET=replace-with-strong-random-secret
REDIS_HOST=localhost
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:5173
UPLOAD_MAX_SIZE=10485760
RATE_LIMIT_MAX=100
```

### MongoDB

生产建议：

```
mongodb://user:pass@mongo-1:27017,mongo-2:27017/sdszk?replicaSet=rs0&authSource=admin&readPreference=primary
```

并启用：

- 用户认证
- 副本集
- 间隔性健康检查

### JWT

生成建议（本地一次性执行）：

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

定期（90 天）滚动密钥 → 旧 Token 宽限期内校验策略需在 Batch 3 设计（多密钥支持）。

### Redis

`REDIS_HOST` 缺失时：缓存层将回退为内存逻辑（性能下降但不阻断）。未来可引入：`REDIS_PASSWORD`, `REDIS_DB`, `REDIS_TLS`。

### 限流变量

当前存在 `RATE_LIMIT_MAX` 与 `RATE_LIMIT_MAX_REQUESTS` 两种命名（测试 / 生产文件差异）。后续需统一（建议：`RATE_LIMIT_MAX_REQUESTS`）。

## 🚦 Fail‑Fast 启动校验示例

```js
// config/validateEnv.js
const REQUIRED = ["MONGODB_URI", "JWT_SECRET"];

export function validateEnv() {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("[ENV] Missing required variables:", missing.join(", "));
    process.exit(1); // fail fast
  }
}
```

```js
// app.js (示例片段)
import { validateEnv } from "./config/validateEnv.js";
validateEnv();
```

> 后续可扩展：格式校验（数字/URL）、安全策略（长度 / Base64 检测）、多密钥列表。

## 🧪 分环境策略

| 环境        | 特征        | 必须校验                           | 推荐策略                       |
| ----------- | ----------- | ---------------------------------- | ------------------------------ |
| development | 快速反馈    | MONGODB_URI / JWT_SECRET           | LOG_LEVEL=debug / 禁用重度限流 |
| test        | 可重复性    | MONGODB_URI / JWT_SECRET           | 独立测试库 + 精简日志          |
| ci          | 可预期      | MONGODB_URI (test DB) / JWT_SECRET | 限流放宽 + CORS 限定 localhost |
| production  | 稳定 / 安全 | 全部核心 + 限流 + 上传限制         | 严格日志级别 / 只允许白名单源  |

## 🔍 故障排查速查

| 症状           | 可能问题           | 排查命令                        |
| -------------- | ------------------ | ------------------------------- |
| 启动直接退出   | Fail‑Fast 缺变量   | `grep -v '^#' server/.env`      |
| Token 无法校验 | JWT_SECRET 变更    | 查看部署窗口与日志滚动策略      |
| 缓存无效       | REDIS_HOST 未配置  | `redis-cli ping` / 检查回退逻辑 |
| 跨域失败       | CORS_ORIGIN 不匹配 | 浏览器控制台 + 响应头对比       |

## 🛡️ 安全最佳实践

1. 所有敏感文件权限：`chmod 600`（仅部署用户可读）
2. 永不将生产密钥写入示例或 CI 日志
3. 使用随机生成的高熵 JWT_SECRET（≥ 32 bytes）
4. 通过外部 Secret 管理（KMS / Vault / GitHub Actions Encrypted Secrets）注入
5. 加入审计日志：记录服务启动时已加载变量集合（脱敏输出）

## 📋 部署前检查清单

```text
[ ] server/.env.production 存在且权限为 600
[ ] MONGODB_URI 使用内网/副本集地址
[ ] JWT_SECRET 长度与来源已审核（非默认）
[ ] REDIS_HOST 可达 (可选: ping)
[ ] CORS_ORIGIN 列表正确（无 * ）
[ ] LOG_LEVEL=error / warn （生产）
[ ] 上传限制与白名单已设定
```

## 🔄 后续改进（规划占位）

- 多密钥 JWT 轮换：`JWT_SECRETS=key1,key2` → 支持旧签名验证
- 引入 `.env.schema` + zod 校验生成 HTML 报告
- 区分环境专属前缀：`PROD_` / `CI_`（部署脚本自动裁剪）

## 🗃️ 附录：示例模板（后端）

```bash
# server/.env.example
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sdszk
JWT_SECRET=change-this-in-production
REDIS_HOST=localhost
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:5173
UPLOAD_MAX_SIZE=10485760
RATE_LIMIT_MAX=100
```

---

如需新增变量：先更新 `.env.example` → 增补校验逻辑 → 更新本文档矩阵。

## 迁移说明

本文件已替换旧版“Postgres 示例”内容；如仍存在依赖 DATABASE_URL 的历史脚本，请在清理前统一改造为 `MONGODB_URI`，否则脚本会失效。

---

_本文档为 Batch 2 重构结果，旧内容已整理或内嵌注释保留，后续可继续削减历史段落。_
