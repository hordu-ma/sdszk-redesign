#!/usr/bin/env bash
#
# debug-services.sh - 服务连接调试脚本
#
# 用于诊断 CI 环境中的服务连接问题
#

set -euo pipefail

# 彩色输出
RED='\033[31m'
GREEN='\033[32m'
YELLOW='\033[33m'
BLUE='\033[34m'
CYAN='\033[36m'
BOLD='\033[1m'
RESET='\033[0m'

log() { printf "%b[%s]%b %s\n" "$CYAN" "$(date +'%H:%M:%S')" "$RESET" "$*"; }
info() { printf "%b[INFO]%b %s\n" "$BLUE" "$RESET" "$*"; }
warn() { printf "%b[WARN]%b %s\n" "$YELLOW" "$RESET" "$*"; }
error() { printf "%b[ERROR]%b %s\n" "$RED" "$RESET" "$*"; }
success() { printf "%b[DONE]%b %s\n" "$GREEN" "$RESET" "$*"; }

echo "========================================="
echo "🔍 服务连接调试工具"
echo "========================================="

# 1. 环境信息
echo
info "=== 环境信息 ==="
info "操作系统: $(uname -a)"
info "当前用户: $(whoami)"
info "当前目录: $(pwd)"
info "时间: $(date)"

# 2. 检查可用工具
echo
info "=== 可用工具检查 ==="
tools=("nc" "curl" "wget" "mongo" "mongosh" "redis-cli" "docker" "netstat" "lsof")
for tool in "${tools[@]}"; do
  if command -v "$tool" >/dev/null 2>&1; then
    success "✅ $tool: $(command -v "$tool")"
  else
    error "❌ $tool: 未安装"
  fi
done

# 3. Docker 容器状态
echo
info "=== Docker 容器状态 ==="
if command -v docker >/dev/null 2>&1; then
  info "所有容器:"
  docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" || true

  info "MongoDB 容器:"
  mongo_container=$(docker ps -q --filter "ancestor=mongo:5.0" 2>/dev/null | head -1)
  if [[ -n "$mongo_container" ]]; then
    success "MongoDB 容器 ID: $mongo_container"
    info "MongoDB 容器日志 (最后10行):"
    docker logs "$mongo_container" --tail 10 2>/dev/null || warn "无法获取MongoDB日志"
  else
    error "未找到 MongoDB 容器"
  fi

  info "Redis 容器:"
  redis_container=$(docker ps -q --filter "ancestor=redis:7.2-alpine" 2>/dev/null | head -1)
  if [[ -n "$redis_container" ]]; then
    success "Redis 容器 ID: $redis_container"
    info "Redis 容器日志 (最后10行):"
    docker logs "$redis_container" --tail 10 2>/dev/null || warn "无法获取Redis日志"
  else
    error "未找到 Redis 容器"
  fi
else
  error "Docker 命令不可用"
fi

# 4. 端口检查
echo
info "=== 端口监听状态 ==="
ports=("27017" "6379")
for port in "${ports[@]}"; do
  if command -v netstat >/dev/null 2>&1; then
    if netstat -ln | grep ":$port " >/dev/null 2>&1; then
      success "✅ 端口 $port 正在监听"
    else
      error "❌ 端口 $port 未监听"
    fi
  elif command -v lsof >/dev/null 2>&1; then
    if lsof -i ":$port" >/dev/null 2>&1; then
      success "✅ 端口 $port 正在监听"
    else
      error "❌ 端口 $port 未监听"
    fi
  else
    warn "⚠️ 无法检查端口 $port (缺少 netstat 和 lsof)"
  fi
done

# 5. TCP 连接测试
echo
info "=== TCP 连接测试 ==="
test_tcp() {
  local host="$1" port="$2"
  if command -v nc >/dev/null 2>&1; then
    if timeout 5 nc -z "$host" "$port" >/dev/null 2>&1; then
      success "✅ TCP $host:$port 可连接"
      return 0
    else
      error "❌ TCP $host:$port 连接失败"
      return 1
    fi
  elif command -v bash >/dev/null 2>&1; then
    if timeout 5 bash -c "echo >/dev/tcp/$host/$port" >/dev/null 2>&1; then
      success "✅ TCP $host:$port 可连接 (bash)"
      return 0
    else
      error "❌ TCP $host:$port 连接失败 (bash)"
      return 1
    fi
  else
    warn "⚠️ 无法测试 TCP 连接 (缺少 nc 和 bash)"
    return 2
  fi
}

test_tcp "localhost" "27017"
test_tcp "127.0.0.1" "27017"
test_tcp "localhost" "6379"
test_tcp "127.0.0.1" "6379"

# 6. MongoDB 连接测试
echo
info "=== MongoDB 连接测试 ==="
test_mongodb() {
  local host="$1" port="$2"

  if command -v mongosh >/dev/null 2>&1; then
    info "使用 mongosh 测试..."
    if timeout 10 mongosh --quiet --host "${host}:${port}" --eval 'db.runCommand({ping:1})' >/dev/null 2>&1; then
      success "✅ MongoDB mongosh 连接成功"
      return 0
    else
      error "❌ MongoDB mongosh 连接失败"
    fi
  fi

  if command -v mongo >/dev/null 2>&1; then
    info "使用 mongo 测试..."
    if timeout 10 mongo --quiet --host "${host}:${port}" --eval 'db.runCommand({ping:1})' >/dev/null 2>&1; then
      success "✅ MongoDB mongo 连接成功"
      return 0
    else
      error "❌ MongoDB mongo 连接失败"
    fi
  fi

  warn "⚠️ 无 MongoDB CLI 工具，仅检查 TCP"
  test_tcp "$host" "$port"
}

test_mongodb "localhost" "27017"

# 7. Redis 连接测试
echo
info "=== Redis 连接测试 ==="
test_redis() {
  local host="$1" port="$2"

  if command -v redis-cli >/dev/null 2>&1; then
    info "使用 redis-cli 测试..."
    if timeout 10 redis-cli -h "$host" -p "$port" ping 2>/dev/null | grep -q PONG; then
      success "✅ Redis redis-cli 连接成功"
      return 0
    else
      error "❌ Redis redis-cli 连接失败"
    fi
  fi

  warn "⚠️ 无 Redis CLI 工具，仅检查 TCP"
  test_tcp "$host" "$port"
}

test_redis "localhost" "6379"

# 8. 手动运行 wait-services.sh 组件测试
echo
info "=== wait-services.sh 组件测试 ==="
if [[ -f "scripts/wait-services.sh" ]]; then
  info "脚本存在，测试单个目标..."

  # 测试单个MongoDB目标
  info "测试 mongo://localhost:27017..."
  timeout 30 bash scripts/wait-services.sh --timeout 20 --verbose mongo://localhost:27017 || warn "MongoDB 目标测试失败"

  echo
  # 测试单个Redis目标
  info "测试 redis://localhost:6379..."
  timeout 30 bash scripts/wait-services.sh --timeout 20 --verbose redis://localhost:6379 || warn "Redis 目标测试失败"

  echo
  # 测试组合目标
  info "测试组合目标..."
  timeout 60 bash scripts/wait-services.sh --timeout 30 --verbose mongo://localhost:27017 redis://localhost:6379 || warn "组合目标测试失败"

else
  error "scripts/wait-services.sh 不存在"
fi

echo
echo "========================================="
echo "🏁 调试完成"
echo "========================================="
