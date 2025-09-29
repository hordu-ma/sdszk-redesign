---
title: 文档导航与索引
updated: 2025-09-29
owner: core-team
status: draft
---

# 项目文档导航

> 角色导向入口：按你的角色快速找到所需文档。此目录未来会随 Batch 2/3 持续完善。

## 👥 角色快速入口

| 角色        | 第一站                          | 关注重点                         |
| ----------- | ------------------------------- | -------------------------------- |
| 新开发者    | getting-started (筹备中)        | 快速运行、目录结构、提交规范     |
| 前端开发    | front-end 架构文档 (筹备)       | 组件约定、状态管理、API 封装     |
| 后端开发    | architecture/system-overview.md | 高层架构/调用路径概览            |
| 运维 / SRE  | deployment-guide.md             | 部署流程、健康检查、回滚策略     |
| 测试 / QA   | quality/testing-strategy.md     | 金字塔/门禁/策略基线             |
| 安全 / 合规 | security/rbac-model.md          | 角色矩阵 / 权限命名 / 演进       |
| 产品 / 运营 | README + 后台演示               | 功能范围、角色权限、内容流程     |
| AI 协作     | README 大模型协作章节           | 环境变量访问、API 路径、脚本说明 |

## 🗂️ 文档结构规划（目标 IA 草图）

```
docs/
├── README.md              # 本导航
├── architecture/          # 系统与模块架构（Batch 2）
├── security/              # 鉴权、RBAC、安全基线（Batch 2）
├── operations/            # 部署、监控、备份、Runbooks（Batch 2/3）
├── quality/               # 测试策略、覆盖率、工程规范（拆分中）
├── reference/             # 环境变量、API 索引、脚本目录
├── guides/                # 前端/状态管理/贡献指南（整合中）
├── ai/                    # AI 协作指引（待抽离）
└── archive/               # 历史报告与一次性产出
```

## ✅ 当前文档状态快照（Batch 2 后）

| 区域     | 关键文件                        | 状态   | 说明                        |
| -------- | ------------------------------- | ------ | --------------------------- |
| 架构     | architecture/system-overview.md | 新增   | 高层视角                    |
| 架构     | architecture/backend-modules.md | 新增   | 领域/模型拆分               |
| 环境变量 | environment-variables.md        | 已重写 | Mongo/Redis/JWT 聚焦 + 矩阵 |
| 测试策略 | quality/testing-strategy.md     | 新增   | 总体策略                    |
| 测试基线 | quality/testing-baseline.md     | 新增   | 覆盖率现状                  |
| 测试路线 | quality/testing-roadmap.md      | 新增   | 阶段推进计划                |
| 安全     | security/rbac-model.md          | 新增   | 权限与命名规范              |
| 安全     | security/auth-strategy.md       | 新增   | 认证/令牌演进规划           |
| 旧架构   | backend-cms-architecture.md     | Legacy | 顶部迁移提示                |
| 旧测试   | testing-best-practices.md       | Legacy | 已加迁移说明                |
| 旧测试   | testing-action-checklist.md     | Legacy | 拆分保留                    |
| 旧测试   | testing-coverage-assessment.md  | Legacy | 拆分保留                    |
| Redis    | redis-troubleshooting.md        | 保留   | 待转 runbook 模板           |
| 审查归档 | archive/2025-09-audit.md        | 保留   | 历史参考                    |

## 📌 即将执行（下一阶段候选）

| 主题         | 计划                                                      | 价值         |
| ------------ | --------------------------------------------------------- | ------------ |
| 前端架构文档 | 合并 dev-guides/Vue3\* → guides/front-end-architecture.md | 降低分散冗余 |
| Runbooks     | 排障/备份/恢复模板化                                      | 降低运维风险 |
| API 索引     | reference/api-index.md                                    | 快速查找接口 |
| 脚本目录     | reference/scripts-catalog.md                              | 增强可发现性 |
| 安全强化     | security/hardening-checklist.md                           | 汇总加固动作 |

## 🔄 已完成的结构化重构（Batch 2 回顾）

| 主题     | 结果       | 影响                       |
| -------- | ---------- | -------------------------- |
| 架构拆分 | 2 个文件   | 提升信息聚焦度             |
| 环境变量 | 全量重写   | 消除错误 Postgres 叙述     |
| 测试体系 | 三文档拆分 | 降低单文件 900+ 行维护难度 |
| 安全骨架 | 2 个初版稿 | 为后续加固/令牌轮换奠基    |

## 📝 术语草稿（后续会迁入 glossary）

| 术语     | 含义                           |
| -------- | ------------------------------ |
| RBAC     | 基于角色的访问控制模型         |
| Runbook  | 标准化可执行操作手册           |
| Baseline | 当前量化基线，用于对比改进效果 |

## 🤝 贡献（临时说明）

- 修改文档前确保与规划一致，如不确定：在 PR 中引用本文件的段落编号说明意图
- 提交信息前缀：`docs: xxx` / `chore(docs): xxx`

## 📬 反馈

- 缺失内容或歧义：开 Issue 标题前缀 `[DOCS]`
- 架构/安全修改：需指派核心成员评审

---

_此文件已适配 Batch 2 变更，继续作为全局索引维护。_
