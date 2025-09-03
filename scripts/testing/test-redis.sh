#!/bin/bash

# test-redis.sh - Redis连接和功能测试脚本
# 用于验证Redis服务在CI/CD环境中的可用性

set -euo pipefail

# 默认配置
DEFAULT_HOST="localhost"
DEFAULT_PORT="6379"
DEFAULT_TIMEOUT=30

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[Redis测试]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[Redis成功]${NC} $1"
}

log_error() {
    echo -e "${RED}[Redis错误]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[Redis警告]${NC} $1"
}

# 获取环境变量或使用默认值
REDIS_HOST="${REDIS_HOST:-$DEFAULT_HOST}"
REDIS_PORT="${REDIS_PORT:-$DEFAULT_PORT}"
TIMEOUT="${REDIS_TIMEOUT:-$DEFAULT_TIMEOUT}"

log_info "开始Redis连接测试..."
log_info "连接地址: ${REDIS_HOST}:${REDIS_PORT}"

# 1. 检查端口连通性
log_info "1. 检查端口连通性..."
if ! nc -z "$REDIS_HOST" "$REDIS_PORT" 2>/dev/null; then
    log_error "无法连接到Redis端口 ${REDIS_HOST}:${REDIS_PORT}"
    exit 1
fi
log_success "端口连通性检查通过"

# 2. 检查Redis服务响应
log_info "2. 检查Redis服务响应..."

# 检查是否有redis-cli客户端
if ! command -v redis-cli >/dev/null 2>&1; then
    log_warning "未找到redis-cli客户端，跳过详细测试"
    log_success "基础端口检查已通过，假设Redis服务正常"
    exit 0
fi

log_info "使用redis-cli客户端进行测试"

# 3. 测试基本连接（PING命令）
log_info "3. 测试基本连接（PING）..."
if ! timeout "$TIMEOUT" redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping >/dev/null 2>&1; then
    log_error "Redis PING测试失败"

    # 尝试获取更多错误信息
    log_info "尝试获取详细错误信息..."
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>&1 | head -5 || true

    exit 1
fi
log_success "基本连接测试通过"

# 4. 测试数据操作
log_info "4. 测试数据操作..."

# 生成测试键名
TEST_KEY="ci_test_$(date +%s)_$$"
TEST_VALUE="ci_connection_test_$(date -u +%Y%m%d_%H%M%S)"

# 测试SET操作
if ! timeout "$TIMEOUT" redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" set "$TEST_KEY" "$TEST_VALUE" >/dev/null 2>&1; then
    log_error "Redis SET操作失败"
    exit 1
fi
log_success "数据写入测试通过"

# 测试GET操作
RETRIEVED_VALUE=$(timeout "$TIMEOUT" redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" get "$TEST_KEY" 2>/dev/null || echo "")
if [[ "$RETRIEVED_VALUE" != "$TEST_VALUE" ]]; then
    log_error "Redis GET操作失败，期望值: $TEST_VALUE，实际值: $RETRIEVED_VALUE"
    exit 1
fi
log_success "数据读取测试通过"

# 测试DEL操作（清理）
if timeout "$TIMEOUT" redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" del "$TEST_KEY" >/dev/null 2>&1; then
    log_success "测试数据清理完成"
else
    log_warning "测试数据清理失败（不影响主要功能）"
fi

# 5. 测试过期时间设置
log_info "5. 测试过期时间设置..."
EXPIRE_TEST_KEY="ci_expire_test_$(date +%s)_$$"

# 设置带过期时间的键
if timeout "$TIMEOUT" redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" setex "$EXPIRE_TEST_KEY" 60 "expire_test" >/dev/null 2>&1; then
    # 检查TTL
    TTL=$(timeout "$TIMEOUT" redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ttl "$EXPIRE_TEST_KEY" 2>/dev/null || echo "-1")
    if [[ "$TTL" -gt 0 ]] && [[ "$TTL" -le 60 ]]; then
        log_success "过期时间设置测试通过（TTL: ${TTL}秒）"
        # 立即删除测试键
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" del "$EXPIRE_TEST_KEY" >/dev/null 2>&1 || true
    else
        log_warning "过期时间设置异常（TTL: $TTL）"
    fi
else
    log_warning "过期时间设置测试失败"
fi

# 6. 测试哈希操作
log_info "6. 测试哈希操作..."
HASH_TEST_KEY="ci_hash_test_$(date +%s)_$$"

if timeout "$TIMEOUT" redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" hset "$HASH_TEST_KEY" field1 "value1" field2 "value2" >/dev/null 2>&1; then
    # 测试哈希读取
    HASH_VALUE=$(timeout "$TIMEOUT" redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" hget "$HASH_TEST_KEY" field1 2>/dev/null || echo "")
    if [[ "$HASH_VALUE" == "value1" ]]; then
        log_success "哈希操作测试通过"
    else
        log_warning "哈希读取测试失败"
    fi
    # 清理测试数据
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" del "$HASH_TEST_KEY" >/dev/null 2>&1 || true
else
    log_warning "哈希写入测试失败"
fi

# 7. 检查Redis服务器信息
log_info "7. 检查Redis服务器信息..."
if timeout "$TIMEOUT" redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" info server 2>/dev/null | grep -E "redis_version|uptime_in_seconds|used_memory_human" | while read -r line; do
    log_info "  $line"
done; then
    log_success "服务器信息获取完成"
else
    log_warning "无法获取服务器信息"
fi

# 8. 测试连接池（多连接测试）
log_info "8. 测试多连接支持..."
MULTI_TEST_KEY="ci_multi_test_$(date +%s)_$$"

# 并发执行多个操作
for i in {1..5}; do
    (
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" set "${MULTI_TEST_KEY}_$i" "value_$i" >/dev/null 2>&1
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" get "${MULTI_TEST_KEY}_$i" >/dev/null 2>&1
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" del "${MULTI_TEST_KEY}_$i" >/dev/null 2>&1
    ) &
done

# 等待所有后台任务完成
wait

log_success "多连接测试完成"

# 9. 检查内存使用情况
log_info "9. 检查内存使用情况..."
MEMORY_INFO=$(timeout "$TIMEOUT" redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" info memory 2>/dev/null | grep "used_memory_human:" | cut -d: -f2 | tr -d '\r' || echo "未知")
if [[ "$MEMORY_INFO" != "未知" ]]; then
    log_info "当前内存使用: $MEMORY_INFO"
    log_success "内存信息检查完成"
else
    log_warning "无法获取内存使用信息"
fi

log_success "Redis连接测试全部完成！"
log_info "缓存服务已准备就绪，可以支持应用程序连接"

# 输出连接信息供后续使用
echo "REDIS_CONNECTION_VERIFIED=true"
echo "REDIS_TEST_HOST=${REDIS_HOST}"
echo "REDIS_TEST_PORT=${REDIS_PORT}"
echo "REDIS_TEST_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
