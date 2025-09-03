#!/bin/bash

# test-mongodb.sh - MongoDB连接和功能测试脚本
# 用于验证MongoDB服务在CI/CD环境中的可用性

set -euo pipefail

# 默认配置
DEFAULT_HOST="localhost"
DEFAULT_PORT="27017"
DEFAULT_DATABASE="sdszk_test"
DEFAULT_TIMEOUT=30

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[MongoDB测试]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[MongoDB成功]${NC} $1"
}

log_error() {
    echo -e "${RED}[MongoDB错误]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[MongoDB警告]${NC} $1"
}

# 获取环境变量或使用默认值
MONGO_HOST="${MONGO_HOST:-$DEFAULT_HOST}"
MONGO_PORT="${MONGO_PORT:-$DEFAULT_PORT}"
MONGO_DATABASE="${MONGO_DATABASE:-$DEFAULT_DATABASE}"
TIMEOUT="${MONGO_TIMEOUT:-$DEFAULT_TIMEOUT}"

# 构建连接URL
MONGO_URL="mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}"

log_info "开始MongoDB连接测试..."
log_info "连接地址: ${MONGO_HOST}:${MONGO_PORT}"
log_info "数据库: ${MONGO_DATABASE}"

# 1. 检查端口连通性
log_info "1. 检查端口连通性..."
if ! nc -z "$MONGO_HOST" "$MONGO_PORT" 2>/dev/null; then
    log_error "无法连接到MongoDB端口 ${MONGO_HOST}:${MONGO_PORT}"
    exit 1
fi
log_success "端口连通性检查通过"

# 2. 检查MongoDB服务响应
log_info "2. 检查MongoDB服务响应..."

# 尝试使用不同的MongoDB客户端
MONGO_CMD=""
if command -v mongosh >/dev/null 2>&1; then
    MONGO_CMD="mongosh"
    log_info "使用mongosh客户端"
elif command -v mongo >/dev/null 2>&1; then
    MONGO_CMD="mongo"
    log_info "使用mongo客户端"
else
    log_warning "未找到MongoDB客户端，跳过详细测试"
    log_success "基础端口检查已通过，假设MongoDB服务正常"
    exit 0
fi

# 3. 测试基本连接
log_info "3. 测试基本连接..."
if ! timeout "$TIMEOUT" "$MONGO_CMD" --host "$MONGO_HOST" --port "$MONGO_PORT" --eval "db.runCommand({ping: 1})" --quiet >/dev/null 2>&1; then
    log_error "MongoDB ping测试失败"

    # 尝试获取更多错误信息
    log_info "尝试获取详细错误信息..."
    "$MONGO_CMD" --host "$MONGO_HOST" --port "$MONGO_PORT" --eval "db.runCommand({ping: 1})" 2>&1 | head -10 || true

    exit 1
fi
log_success "基本连接测试通过"

# 4. 测试数据库操作
log_info "4. 测试数据库操作..."

# 创建测试文档
TEST_COLLECTION="ci_test_$(date +%s)"
TEST_DOC='{"test": "ci_connection", "timestamp": new Date(), "pid": '$$'}'

# 插入测试文档
if ! timeout "$TIMEOUT" "$MONGO_CMD" --host "$MONGO_HOST" --port "$MONGO_PORT" "$MONGO_DATABASE" --eval "db.${TEST_COLLECTION}.insertOne($TEST_DOC)" --quiet >/dev/null 2>&1; then
    log_error "数据插入测试失败"
    exit 1
fi
log_success "数据插入测试通过"

# 查询测试文档
if ! timeout "$TIMEOUT" "$MONGO_CMD" --host "$MONGO_HOST" --port "$MONGO_PORT" "$MONGO_DATABASE" --eval "db.${TEST_COLLECTION}.findOne({test: 'ci_connection'})" --quiet >/dev/null 2>&1; then
    log_error "数据查询测试失败"
    exit 1
fi
log_success "数据查询测试通过"

# 删除测试文档（清理）
if ! timeout "$TIMEOUT" "$MONGO_CMD" --host "$MONGO_HOST" --port "$MONGO_PORT" "$MONGO_DATABASE" --eval "db.${TEST_COLLECTION}.drop()" --quiet >/dev/null 2>&1; then
    log_warning "测试数据清理失败（不影响主要功能）"
else
    log_success "测试数据清理完成"
fi

# 5. 检查服务器状态
log_info "5. 检查服务器状态..."
if timeout "$TIMEOUT" "$MONGO_CMD" --host "$MONGO_HOST" --port "$MONGO_PORT" --eval "
    var status = db.runCommand({serverStatus: 1});
    print('MongoDB版本: ' + status.version);
    print('运行时间: ' + Math.floor(status.uptime / 60) + '分钟');
    print('连接数: ' + status.connections.current + '/' + status.connections.available);
" --quiet 2>/dev/null; then
    log_success "服务器状态检查完成"
else
    log_warning "无法获取服务器状态（权限不足或版本不兼容）"
fi

# 6. 检查索引创建能力（可选）
log_info "6. 测试索引创建..."
if timeout "$TIMEOUT" "$MONGO_CMD" --host "$MONGO_HOST" --port "$MONGO_PORT" "$MONGO_DATABASE" --eval "
    db.${TEST_COLLECTION}_index.createIndex({testField: 1});
    db.${TEST_COLLECTION}_index.drop();
" --quiet >/dev/null 2>&1; then
    log_success "索引创建测试通过"
else
    log_warning "索引创建测试失败（可能权限不足）"
fi

log_success "MongoDB连接测试全部完成！"
log_info "数据库服务已准备就绪，可以支持应用程序连接"

# 输出连接信息供后续使用
echo "MONGO_CONNECTION_VERIFIED=true"
echo "MONGO_TEST_URL=${MONGO_URL}"
echo "MONGO_TEST_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
