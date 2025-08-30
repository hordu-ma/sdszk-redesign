#!/bin/bash

# ==============================================================================
# 山东省思政课一体化中心 - 开发环境启动脚本 (v4 - 路径修复)
# ==============================================================================

set -e # 任何命令失败则立即退出

# --- 动态路径计算 ---
# 获取脚本自身的真实目录，无论从哪里调用
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
# 计算项目根目录 (脚本目录往上两级)
PROJECT_ROOT=$(dirname "$(dirname "$SCRIPT_DIR")")

# --- 配置 ---
PID_DIR="$PROJECT_ROOT/.pids"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
LOCK_FILE="/tmp/sdszk-dev-start.lock"
SCRIPT_PID=$$

# --- 颜色定义 ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# --- 日志函数 ---
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# --- 核心函数 ---

# 检查是否已有实例在运行
check_existing_instance() {
    if [ -f "$LOCK_FILE" ]; then
        local existing_pid=$(cat "$LOCK_FILE" 2>/dev/null)
        if [ -n "$existing_pid" ] && kill -0 "$existing_pid" 2>/dev/null; then
            log_error "开发环境已在运行中 (PID: $existing_pid)"
            log_info "💡 如需重启，请先运行: bash $PROJECT_ROOT/scripts/development/dev-stop.sh"
            exit 1
        else
            rm -f "$LOCK_FILE"
        fi
    fi
}

# 创建锁文件
create_lock() {
    echo "$SCRIPT_PID" > "$LOCK_FILE"
}

# 退出时自动清理锁文件
trap 'rm -f "$LOCK_FILE"' EXIT

# 清理所有服务
cleanup_services() {
    log_info "执行启动前清理..."
    bash "$PROJECT_ROOT/scripts/development/dev-stop.sh"
    log_success "清理完成。"
}

# 检查并创建PID目录
ensure_pid_dir() {
    if [ ! -d "$PID_DIR" ]; then
        log_info "创建PID目录: $PID_DIR"
        mkdir -p "$PID_DIR"
    fi
}

# --- 脚本主逻辑 ---

# 0. 检查单例
check_existing_instance
create_lock

log_info "🚀 启动山东省思政课一体化中心开发环境..."
log_info "项目根目录: $PROJECT_ROOT"

# 1. 环境清理
cleanup_services

# 2. 确保PID目录存在
ensure_pid_dir

# 3. 启动依赖服务 (Redis, MongoDB)
log_info "📊 检查并启动依赖服务..."

# Redis
if ! pgrep -f redis-server > /dev/null; then
    redis-server --daemonize yes
    sleep 1
    if redis-cli ping > /dev/null 2>&1; then
        log_success "Redis 启动并连接成功。"
    else
        log_error "Redis 启动失败。"
        exit 1
    fi
else
    log_success "Redis 已在运行。"
fi

# MongoDB
if ! mongosh --eval "db.runCommand({ping: 1})" &>/dev/null; then
    mongod --dbpath /opt/homebrew/var/mongodb --logpath /opt/homebrew/var/log/mongodb/mongo.log --fork
    sleep 2
    if mongosh --eval "db.runCommand({ping: 1})" &>/dev/null; then
        log_success "MongoDB 启动并连接成功。"
    else
        log_error "MongoDB 启动失败。"
        exit 1
    fi
else
    log_success "MongoDB 已在运行。"
fi

# 4. 启动后端服务器 (使用绝对路径)
log_info "🖥️  启动后端服务器..."
(cd "$PROJECT_ROOT/server" && npm run dev) &
BACKEND_PID=$!
echo $BACKEND_PID > "$BACKEND_PID_FILE"
log_success "后端服务器启动 (PID: $BACKEND_PID)。PID已记录到 $BACKEND_PID_FILE"

# 5. 等待后端服务就绪
log_warning "⏳ 等待后端服务(3000端口)响应..."
while ! nc -z localhost 3000; do
  sleep 0.5 # 等待0.5秒
  echo -n "."
done
log_success "\n后端服务已就绪！"

# 6. 启动前端开发服务器 (使用绝对路径)
log_info "🌐 启动前端开发服务器..."
(cd "$PROJECT_ROOT" && npm run dev) &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
log_success "前端服务器启动 (PID: $FRONTEND_PID)。PID已记录到 $FRONTEND_PID_FILE"

# --- 结束信息 ---
echo ""
log_success "🎉 开发环境启动完成！"
echo ""
echo -e "  ${GREEN}➜${NC}  ${YELLOW}前台访问:${NC} http://localhost:5173"
echo -e "  ${GREEN}➜${NC}  ${YELLOW}管理后台:${NC} http://localhost:5173/admin"
echo -e "  ${GREEN}➜${NC}  ${YELLOW}API 服务:${NC} http://localhost:3000"
echo ""
log_info "所有服务的PID已记录在 $PID_DIR 目录中。"
log_info "要停止所有服务, 请运行: bash $PROJECT_ROOT/scripts/development/dev-stop.sh"
echo ""

# 等待所有后台作业完成 (实际上是等待用户按 Ctrl+C)
wait
