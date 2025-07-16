---
applyTo: "**"
---

# 通用编程规范

## 基础规则

- Always response in Chinese; 总是用中文回答问题
- Basic coding language: JavaScript(TypeScript) / Python3 / Linux bash Shell
- Tech stacks: Vue3, Node.js & Express, MongoDB, Nginx, Docker, Aliyun
- JavaScript的模块类型，总是选择 ES Modules

## 进阶规则

- Agent模式，执行代码修改前要先确认，获得许可后执行
- 每隔10分钟，提醒进行 `git add` 和 `git commit` 操作
- 每隔十分钟，重新回顾"辅助开发上下文指南.md"文档，保持上下文背景不丢失
- 超过三步的任务要拆解步骤，分步执行
- 每次**执行代码删除工作**,务必获得确认许可后执行。
- 开发环境中，如需要启动开发服务器（ `npm run dev`),务必首先启动后端服务器（`cd server && npm run start` )
