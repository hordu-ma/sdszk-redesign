---
title: RBAC 权限模型
updated: 2025-09-29
status: draft
owner: security-team
---

# RBAC 权限模型

本文件定义角色、权限粒度与检查模式。认证与 Token 策略见 `auth-strategy.md`。

## 🎯 设计目标

- 最小权限原则 (Least Privilege)
- 明确可审计：权限 = `module:action`
- 可演进：支持日后细化 / API Key / 多租户

## 🧩 核心概念

| 概念              | 说明             | 示例                                    |
| ----------------- | ---------------- | --------------------------------------- |
| 角色 (role)       | 权限集合逻辑标签 | `admin`, `editor`, `viewer`             |
| 权限 (permission) | 原子操作能力标识 | `news:create`, `resource:publish`       |
| 资源模块 (module) | 业务域或聚合边界 | `news`, `resource`, `setting`           |
| 动作 (action)     | 资源操作         | `create`, `update`, `delete`, `publish` |

## 🧱 命名规范

- 格式：`<module>:<action>`
- 动作集合参考：`create|read|update|delete|list|publish|archive|manage`
- 管理特权：使用 `:manage` 表示聚合操作（慎用）

## 🔑 角色与权限矩阵 (初版建议)

| 权限             | viewer | editor           | admin     |
| ---------------- | ------ | ---------------- | --------- |
| news:list / read | ✅     | ✅               | ✅        |
| news:create      | ❌     | ✅               | ✅        |
| news:update      | ❌     | ✅ (自建 / 受限) | ✅ (全部) |
| news:delete      | ❌     | ❌               | ✅        |
| news:publish     | ❌     | ✅               | ✅        |
| resource:upload  | ❌     | ✅               | ✅        |
| resource:delete  | ❌     | ❌               | ✅        |
| setting:update   | ❌     | ❌               | ✅        |
| user:manage      | ❌     | ❌               | ✅        |
| dashboard:view   | ✅     | ✅               | ✅        |

> 受限更新（editor）策略：控制器内验证 `ownerId === currentUser.id`。

## 🛠️ 校验流程示例

```mermaid
flowchart LR
  R[请求] --> A[Auth 中间件 解析 JWT]
  A --> P{已认证?}
  P -- 否 --> X[401]
  P -- 是 --> L[权限中间件]
  L --> C{hasPermission(module:action)?}
  C -- 否 --> F[403]
  C -- 是 --> CTRL[Controller]
```

## 🔍 中间件责任划分

| 中间件                 | 责任                               | 错误码 |
| ---------------------- | ---------------------------------- | ------ |
| `auth`                 | 解析 / 验证 Token，附加 `req.user` | 401    |
| `permissionMiddleware` | 检查权限集合                       | 403    |

## 🧪 单测建议

| 维度       | 用例                           |
| ---------- | ------------------------------ |
| 正常授权   | admin 访问敏感路由 200         |
| 权限缺失   | editor 访问 setting:update 403 |
| 游客阻断   | 未认证访问受保护路由 401       |
| 资源所有权 | editor 更新他人新闻 403        |
| 聚合特权   | admin 使用 manage 操作成功     |

## 🛡️ 安全注意事项

1. 不在前端仅凭 UI 控制隐藏敏感操作 → 后端强制校验
2. 不使用通配符 `*` 传输到客户端（仅后端内部扩展）
3. 管理员操作（删除 / 设置修改）记录 ActivityLog
4. 定期审计：导出角色-权限快照与差异

## 🔄 未来扩展占位

| 功能             | 描述                    | 优先级 |
| ---------------- | ----------------------- | ------ |
| 细粒度属性级控制 | 针对字段级别限制        | M      |
| 动态策略 (ABAC)  | 基于上下文条件          | L      |
| 审批流           | 高风险操作双人确认      | L      |
| API Key          | 机器到机器调用          | M      |
| 多租户隔离       | 角色作用域包含 tenantId | L      |

---

更新本文件需同步：

1. 数据库角色/权限初始化脚本
2. 控制器中权限检查点
3. 前端权限映射（下钻菜单/按钮显示）
