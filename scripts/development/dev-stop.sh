#!/bin/bash

# ==============================================================================
# 山东省思政课一体化中心 - 开发环境停止脚本 (v3 - 融合PID与端口清理)
# ==============================================================================

# --- 配置 ---
PID_DIR="./.pids"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PORT=5173
BACKEND_PORT=3000

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

# --- 核心函数 ---

# 1. 根据PID文件停止服务
stop_service_by_pid() {
    local service_name="$1"
    local pid_file="$2"

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if [ -n "$pid" ] && ps -p $pid > /dev/null; then
            log_info "(PID) 正在停止 $service_name (PID: $pid)..."
            kill -9 $pid 2>/dev/null
            rm -f "$pid_file"
            log_success "(PID) $service_name 已停止。"
        else
            rm -f "$pid_file"
        fi
    fi
}

# 2. 根据端口号强制清理服务
force_stop_by_port() {
    local service_name="$1"
    local port="$2"
    local pids

    pids=$(lsof -ti:$port 2>/dev/null || echo "")

    if [ -n "$pids" ]; then
        log_warning "(PORT) 检测到 $service_name 在端口 $port 上有残留进程，强制终止..."
        for pid in $pids; do
            kill -9 "$pid" 2>/dev/null
            log_success "(PORT) 已终止进程 PID: $pid"
        done
    else
        log_info "(PORT) 端口 $port 是干净的。"
    fi
}

# --- 脚本主逻辑 ---

log_info "🛑 停止并清理开发环境..."

# 步骤一：基于PID文件进行精确停止
log_info "--- 阶段1: 按PID文件清理 ---"
stop_service_by_pid "前端服务" "$FRONTEND_PID_FILE"
stop_service_by_pid "后端服务" "$BACKEND_PID_FILE"

# 步骤二：基于端口进行强制清理，作为双重保险
log_info "--- 阶段2: 按端口强制清理 ---"
force_stop_by_port "前端服务" "$FRONTEND_PORT"
force_stop_by_port "后端服务" "$BACKEND_PORT"

# 步骤三：检查其他依赖服务
log_info "--- 阶段3: 检查依赖服务 ---"
if pgrep -f mongod > /dev/null; then
    log_warning "MongoDB 服务仍在运行。如果需要，请手动停止。"
fi
if pgrep -f redis-server > /dev/null; then
    log_warning "Redis 服务仍在运行。如果需要，请手动停止。"
fi

log_success "🎉 环境清理完成！"
