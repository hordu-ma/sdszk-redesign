# Redis 连接问题故障排除指南

## 概述

本文档提供了针对项目中 Redis 连接问题的详细故障排除步骤，特别针对 CI/CD 环境中常见的问题。

## 常见问题类型

### 1. 端口连接失败
**症状**: `端口检查失败：30 次尝试后端口仍未开放`

**可能原因**:
- Redis 服务未启动
- 端口映射配置错误
- 防火墙阻止连接
- 主机名解析失败

**解决方案**:
```bash
# 检查端口是否开放
netstat -ln | grep :6379
# 或使用 ss 命令
ss -ln | grep :6379

# 检查 Redis 进程
ps aux | grep redis

# 测试端口连通性
nc -z localhost 6379
```

### 2. 服务响应超时
**症状**: `Redis服务检查失败：30 次尝试后服务仍无响应`

**可能原因**:
- Redis 服务启动但未完全初始化
- 连接参数配置错误
- Redis 配置文件问题
- 内存不足

**解决方案**:
```bash
# 手动测试 Redis 连接
redis-cli -h localhost -p 6379 ping

# 检查 Redis 配置
redis-cli -h localhost -p 6379 CONFIG GET "*"

# 查看 Redis 日志
docker logs <redis_container_id>
```

### 3. 主机名解析问题
**症状**: 连接 `redis:6379` 失败，但 `localhost:6379` 可用

**原因**: Docker 容器间网络配置问题

**解决方案**:
- 在 CI 环境中使用 `localhost` 而非容器名
- 检查 Docker 网络配置
- 验证容器间连通性

## GitHub Actions 特定问题

### 服务容器配置

确保 GitHub Actions 中的服务容器配置正确：

```yaml
services:
  redis:
    image: redis:7.2-alpine
    ports:
      - 6379:6379
    options: >-
      --health-cmd "redis-cli ping"
      --health-interval 10s
      --health-timeout 10s
      --health-retries 15
      --health-start-period 30s
```

### 环境变量设置

在 CI 环境中使用正确的主机名：

```bash
# 正确的配置
REDIS_HOST=localhost
REDIS_PORT=6379

# 错误的配置（在 GitHub Actions 中）
REDIS_HOST=redis  # 这会导致连接失败
```

## 诊断工具和脚本

### 使用增强版测试脚本

项目提供了增强版的 Redis 测试脚本：

```bash
# 基本测试
./scripts/test-redis-enhanced.sh

# 详细模式
VERBOSE=1 ./scripts/test-redis-enhanced.sh

# 指定主机和端口
REDIS_HOST=localhost REDIS_PORT=6379 ./scripts/test-redis-enhanced.sh
```

### 手动诊断命令

```bash
# 1. 检查网络连通性
ping redis_host
telnet redis_host 6379

# 2. 检查服务状态
docker ps | grep redis
docker logs redis_container

# 3. 测试 Redis 命令
redis-cli -h redis_host -p 6379 info server
redis-cli -h redis_host -p 6379 client list

# 4. 性能测试
redis-cli -h redis_host -p 6379 --latency
```

## 预防措施

### 1. 健康检查优化

增加服务启动等待时间：

```yaml
options: >-
  --health-start-period 30s
  --health-retries 15
```

### 2. 超时配置

适当增加连接超时时间：

```bash
TIMEOUT=180  # 3分钟
```

### 3. 重试机制

实现指数退避重试：

```bash
for i in {1..30}; do
  if redis_connection_test; then
    break
  fi
  sleep $((i * 2))  # 指数退避
done
```

## 环境差异处理

### 本地开发环境

```bash
# 使用 Docker Compose
docker-compose -f docker-compose.dev.yml up -d redis
```

### CI/CD 环境

```bash
# 使用服务容器
# 在 GitHub Actions 中自动管理
```

### 生产环境

```bash
# 使用外部 Redis 服务
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=secret
```

## 调试技巧

### 1. 启用详细日志

```bash
export VERBOSE=1
export DEBUG=1
```

### 2. 分步测试

```bash
# 步骤1: 端口检查
nc -z localhost 6379

# 步骤2: 服务响应
redis-cli ping

# 步骤3: 数据操作
redis-cli set test_key test_value
redis-cli get test_key
```

### 3. 容器检查

```bash
# 查看容器状态
docker ps -a

# 查看容器健康状态
docker inspect container_name | grep Health -A 10

# 查看容器日志
docker logs --tail 50 container_name
```

## 常用修复命令

### 重启 Redis 服务

```bash
# Docker 环境
docker restart redis_container

# 系统服务
sudo systemctl restart redis
```

### 清理和重建

```bash
# 清理 Docker 容器
docker-compose down
docker-compose up -d

# 清理数据（谨慎使用）
docker volume rm redis_data
```

### 网络重置

```bash
# 重建 Docker 网络
docker network prune
docker-compose up -d
```

## 获取帮助

如果以上步骤都无法解决问题：

1. 收集完整的错误日志
2. 运行诊断脚本获取环境信息
3. 检查相关的 GitHub Issues
4. 联系项目维护人员

### 信息收集模板

```bash
echo "=== 环境信息 ==="
uname -a
docker --version
redis-cli --version

echo "=== 网络状态 ==="
netstat -ln | grep :6379

echo "=== 容器状态 ==="
docker ps -a

echo "=== Redis 日志 ==="
docker logs redis_container --tail 20
```

## 参考资源

- [Redis 官方文档](https://redis.io/documentation)
- [Docker Compose 服务配置](https://docs.docker.com/compose/compose-file/)
- [GitHub Actions 服务容器](https://docs.github.com/en/actions/using-containerized-services)
- [项目 CI/CD 配置](.github/workflows/playwright.yml)
