# 环境变量配置说明

## 概述

本文档描述了项目中所有环境变量的配置说明，包括前端和后端的环境变量设置。

## 前端环境变量

### 基础配置文件

- `.env` - 生产环境配置（包含敏感信息，不提交到 Git）
- `.env.development` - 开发环境配置
- `.env.example` - 环境变量模板文件
- `.env.aliyun` - 阿里云部署专用配置

### 前端变量说明

```bash
# API 基础地址
VITE_API_BASE_URL=http://localhost:3000/api

# 应用基础路径
VITE_BASE_URL=/

# 构建模式
VITE_BUILD_MODE=development

# 是否启用调试模式
VITE_DEBUG=true

# CDN 地址（生产环境）
VITE_CDN_URL=https://cdn.example.com

# 第三方服务配置
VITE_ANALYTICS_ID=your-analytics-id
VITE_SENTRY_DSN=your-sentry-dsn
```

## 后端环境变量

### 配置文件位置

- `server/.env` - 生产环境配置（包含敏感信息）
- `server/.env.example` - 后端环境变量模板
- `server/.env.test` - 测试环境配置
- `server/.env.ci` - CI/CD 环境配置

### 后端变量说明

```bash
# 服务器配置
NODE_ENV=development
PORT=3000
HOST=localhost

# 数据库配置
DATABASE_URL=postgres://username:password@localhost:5432/dbname
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sdszk_redesign
DB_USER=your_db_user
DB_PASS=your_db_password

# Redis 配置
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 会话配置
SESSION_SECRET=your-session-secret

# 邮件服务配置
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
FROM_EMAIL=noreply@example.com

# 文件上传配置
UPLOAD_MAX_SIZE=10485760  # 10MB
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp

# 安全配置
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW=900000  # 15分钟
RATE_LIMIT_MAX=100        # 每窗口最大请求数

# 第三方服务
SENTRY_DSN=your-sentry-dsn
ANALYTICS_API_KEY=your-analytics-key

# 缓存配置
CACHE_TTL=3600  # 1小时

# 日志配置
LOG_LEVEL=info
LOG_FILE=server.log
```

## 环境文件设置指南

### 1. 开发环境设置

```bash
# 复制示例文件
cp .env.example .env
cp server/.env.example server/.env

# 编辑配置文件，填入实际值
# 注意：不要提交包含敏感信息的 .env 文件
```

### 2. 生产环境设置

```bash
# 在生产服务器上设置环境变量
export NODE_ENV=production
export DATABASE_URL="postgres://prod_user:prod_pass@db.example.com:5432/prod_db"
export JWT_SECRET="production-super-secret-key"

# 或者使用 .env 文件（确保文件权限正确）
chmod 600 .env
chmod 600 server/.env
```

### 3. Docker 环境设置

在 `docker-compose.yml` 中引用环境变量：

```yaml
services:
  app:
    env_file:
      - .env
      - server/.env
```

## 安全最佳实践

### 1. 敏感信息保护

- ✅ **绝不提交** 包含真实密码、密钥的 `.env` 文件
- ✅ 使用强随机密码和密钥
- ✅ 定期轮换密钥
- ✅ 限制环境变量文件权限 (`chmod 600`)

### 2. 环境隔离

- ✅ 开发、测试、生产环境使用不同的数据库和密钥
- ✅ 使用环境特定的配置文件
- ✅ 通过 CI/CD 管理生产环境变量

### 3. 验证和监控

```typescript
// 环境变量验证示例
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "REDIS_URL"];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

## 故障排除

### 常见问题

1. **环境变量未加载**
   - 检查文件名是否正确（`.env` 不是 `env`）
   - 确认文件在正确的目录中
   - 验证格式：`KEY=value`（等号两边不要空格）

2. **Vite 前端变量无效**
   - 前端变量必须以 `VITE_` 开头
   - 重启开发服务器
   - 检查 `vite.config.ts` 中的 `define` 配置

3. **Docker 环境变量问题**
   - 确认 `docker-compose.yml` 中正确引用了 `env_file`
   - 检查容器内的环境变量：`docker exec -it container_name printenv`

### 调试命令

```bash
# 查看当前环境变量
printenv | grep VITE_    # 前端变量
printenv | grep NODE_    # Node.js 变量

# 验证 .env 文件格式
cat .env | grep -v '^#' | grep -v '^$'

# 检查文件权限
ls -la .env server/.env
```

## 部署检查清单

- [ ] 复制并配置所有必要的 `.env` 文件
- [ ] 设置正确的文件权限 (600)
- [ ] 验证所有必需的环境变量都已设置
- [ ] 确认数据库连接正常
- [ ] 测试 Redis 连接
- [ ] 验证第三方服务配置
- [ ] 检查日志输出是否正常

---

> **注意**: 本文档仅供参考，具体的环境变量值请参考对应的 `.env.example` 文件。在生产环境中，请务必使用安全的密钥和密码。
