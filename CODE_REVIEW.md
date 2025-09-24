# 项目全面代码审查与开发指引（2025-09-23）

本报告在不修改任何代码的前提下，对仓库进行全量核对与审查，输出清晰、可执行的改进路线与检查清单，可直接作为后续落地的开发指引。

## 执行摘要（Executive Summary）

- 当前状态: 架构清晰，安全与工程规范意识较好（Helmet/CSP、CORS 白名单、限流、RBAC、结构化日志）。
- 主要风险: 认证策略不一致、Docker/Nginx 配置断裂、备份数据入库、日志与限流细节、依赖漂移、上传/删除安全。
- Top 5 行动（建议优先顺序）:
  1. 统一 JWT 策略并强制 `JWT_SECRET` 校验（fail-fast）
  2. 修复 Docker 多阶段构建与 HEALTHCHECK（可复现/可观测）
  3. 对齐 Compose 与 Nginx（静态资源挂载/反代路径一致）
  4. 从仓库剥离备份数据并建立安全备份流程
  5. 统一令牌存储策略（推荐仅 HttpOnly Cookie + CSRF）

## 里程碑路线图（3 周）

- M1 安全与可用性（第 1 周）
  - JWT 策略统一、健康检查限流豁免、验证码日志脱敏
  - Docker/Compose/Nginx 对齐与健康检查修复
  - 备份目录出库与外部备份流程
- M2 工程与性能（第 2 周）
  - 依赖梳理与锁定、关闭生产 API 详尽日志
  - 统一 CORS（后端唯一）、上传删除授权/魔数校验、错误处理接入 pino
- M3 质量与可观测（第 3 周）
  - 路由层参数校验（joi/celebrate）、/metrics 指标
  - Playwright 烟囱流、覆盖率门禁、Nginx 压缩与缓存策略统一

---

## P0 级行动卡（Action Cards）

### P0-1 统一 JWT 策略与密钥校验

- 范围: 统一鉴权中间件、强制 `JWT_SECRET`、去除默认密钥回退
- 影响文件/区域: `server/middleware/auth.js`, `server/controllers/authController.js`, `server/app.js`
- 方案要点:
  - 启动时校验必需环境变量（`JWT_SECRET`）缺失则退出
  - 统一使用 `protect` 作为唯一鉴权入口；`checkPermission/restrictTo` 必须在 `protect` 之后
  - 选择“仅 HttpOnly Cookie”并规划 CSRF 方案（双提交或自定义头）
- 验收标准:
  - 缺失 `JWT_SECRET` 时服务拒绝启动并提示明确错误
  - 所有保护路由通过 `protect` 生效，未登录返回 401、有权限问题返回 403
  - E2E 登录→访问受限页面→登出流程通过
- 风险/回滚:
  - 前端如依赖 localStorage token 需迁移；可临时双栈过渡（同时支持 Header 和 Cookie）
- 预估工期: M（0.5–1 天，含联调）

### P0-2 修复 Docker 多阶段构建与健康检查

- 范围: 可复现构建、运行层最小化、健康检查可用
- 影响文件/区域: `Dockerfile`, `docker-compose.prod.yml`
- 方案要点:
  - 构建阶段安装 devDeps 并构建前端；运行阶段仅复制 `dist`/`server` 与生产依赖
  - HEALTHCHECK 使用 `wget` 或 `node` 内置请求（避免依赖 curl）
- 验收标准:
  - 仅凭仓库与 `.env` 可稳定构建镜像并通过健康检查
  - 运行容器中不存在多余 dev 依赖
- 风险/回滚:
  - 如构建耗时上升，可通过缓存与分层优化
- 预估工期: M（0.5–1 天）

### P0-3 对齐 Compose 与 Nginx 配置

- 范围: 文件名/路径一致、静态资源正确挂载或由后端托管
- 影响文件/区域: `docker-compose.prod.yml`, `nginx-ssl.conf`
- 方案要点:
  - 统一引用的 Nginx 配置文件名；明确 `dist` 挂载到 `/var/www/frontend` 或由 Node 静态托管
  - 移除或最小化 Nginx 层 CORS 头，避免与后端冲突
- 验收标准:
  - 前端静态资源可访问，SPA 路由正常，API 反代 2xx
- 风险/回滚:
  - 如 Nginx 更新影响线上，先以灰度或备用配置验证
- 预估工期: S（0.5 天）

### P0-4 备份数据出库与流程建设

- 范围: 从仓库剥离备份、建立安全备份/脱敏流程
- 影响文件/区域: `database-backups/`, `.gitignore`, 文档 `docs/`
- 方案要点:
  - 将现有备份迁移到对象存储或加密盘；更新 `.gitignore` 忽略
  - 制定周期性备份、加密与恢复演练流程；对导出数据进行脱敏
- 验收标准:
  - 仓库无备份大文件；备份存储与访问控制可审计
- 风险/回滚:
  - 迁移前务必完成校验与双地备份
- 预估工期: S（0.5 天）

### P0-5 统一令牌存储策略

- 范围: 取消 localStorage token，采用 HttpOnly Cookie + CSRF
- 影响文件/区域: `src/utils/api.ts`, `src/api/base.ts`, 认证相关前后端配置
- 方案要点:
  - 前端默认 `withCredentials: true`，去除对 `localStorage` 的 token 读取
  - 引入 CSRF 机制（双提交 Cookie 或自定义头 + 服务端校验）
- 验收标准:
  - 登录/鉴权流程在跨域场景下稳定工作；XSS 风险显著降低
- 风险/回滚:
  - 短期内保留 Header token 兼容，逐步切换
- 预估工期: M（1 天，含联调）

---

## P1 级行动卡（摘要）

1. CORS 统一

- 文件/区域: `server/config/cors.js`, `nginx-ssl.conf`
- 要点: CORS 仅由后端输出，Nginx 不再返回 `Access-Control-*`
- 验收: 不同来源访问 API 头部一致且无冲突；预检与凭证正常
- 工期: S

2. 限流放行健康检查

- 文件/区域: `server/middleware/rateLimit.js`
- 要点: 放行 `/api/health*` 全部
- 验收: 健康检查不被限流；其他限流策略不变
- 工期: XS

3. 验证码日志脱敏与缓存

- 文件/区域: `server/controllers/authController.js`, Redis
- 要点: 生产不记录验证码明文；验证码存储 Redis（5 分钟）
- 验收: 日志不含敏感值；验证码校验可用
- 工期: S

4. 上传/删除安全

- 文件/区域: `server/controllers/uploadController.js`, 相关路由
- 要点: 删除需 `uploads:delete`；`basename` 校验 + 白名单；可选魔数/病毒扫描
- 验收: 越权/路径穿越被阻断；仅允许白名单类型
- 工期: M

5. Mongoose 版本统一

- 文件/区域: 根 `package.json` 与 `server/package.json`
- 要点: 移除前端侧的 mongoose，后端锁定版本
- 验收: `npm ls mongoose` 单点版本；运行正常
- 工期: XS

6. Helmet/CSP 落地

- 文件/区域: `server/config/security.js`
- 要点: 移除弃用项；生产注入 nonce；实际域名替换；第三方脚本 hash/nonce
- 验收: CSP 报警可控且不影响功能；安全头正确
- 工期: S

---

## 工程改进要点（后端/前端/测试/运维）

- 后端
  - 鉴权路径固定：`protect` → `restrictTo/checkPermission` → 控制器
  - 路由参数校验：`joi/celebrate` 统一入参校验与错误格式
  - 观测：`prom-client` `/metrics`，日志屏蔽敏感字段，`X-Request-ID` 贯穿

- 前端
  - Axios 仅依赖 Cookie；API 日志受 `VITE_ENABLE_LOGGER` 控制（生产关闭）
  - Vite 公共配置抽取；组件库按需裁剪；路由懒加载与图片现代格式

- 测试与质量
  - Vitest 针对 controllers/middleware 的单测；Playwright 烟囱流（登录→受控页→登出）
  - 覆盖率阈值（≥ 70%）+ CI 门禁（lint/test 必须通过）

- 部署与运维
  - 多阶段 Docker + 健康检查；Nginx 与构建压缩策略一致化
  - PM2 单实例或按 CPU；环境变量启动前校验（JWT/Mongo/Redis）

---

## 快速核对清单（Pre-flight）

- 环境变量: `JWT_SECRET`, `MONGODB_URI`, `REDIS_PASSWORD` 存在且被启动脚本校验
- 配置对齐: `docker-compose.prod.yml` 引用的 Nginx 配置与实际文件一致；`dist` 正确挂载/托管
- 日志与 CORS: 生产关闭前端 API 详细日志；CORS 仅由后端控制
- 备份与合规: 仓库无备份数据；外部加密存储与脱敏流程落地
- 上传安全: 删除授权/白名单/`basename` 校验生效；验证码绝不记录明文

---

## 附录：参考定位（文件与位置）

- JWT 与认证: `server/middleware/auth.js`, `server/controllers/authController.js`
- 限流: `server/middleware/rateLimit.js`
- CORS: `server/config/cors.js`, `nginx-ssl.conf`
- Helmet/CSP: `server/config/security.js`
- 上传: `server/controllers/uploadController.js`, `server/routes/upload.js`
- 日志: `server/utils/logger.js`, `server/middleware/loggerMiddleware.js`
- Docker/Compose/Nginx: `Dockerfile`, `docker-compose.prod.yml`, `nginx-ssl.conf`
- 前端 API: `src/utils/api.ts`, `src/api/base.ts`

---

如需按本指引落地：

- 建议先执行 M1（JWT + Docker/Nginx/Health + 备份出库），随后推进 M2/M3；
- 我可以按上述“行动卡”输出逐文件的变更清单与验收用例，便于小步提交与快速回滚（仍不直接修改代码）。
