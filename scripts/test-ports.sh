#!/bin/bash

# 测试脚本 - 验证端口问题是否解决

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "🧪 端口问题修复验证测试"
echo "=========================="

# 1. 清理所有端口
log_info "步骤1: 清理所有相关端口"
./scripts/kill-ports.sh -a > /dev/null 2>&1
log_success "端口清理完成"

# 2. 验证端口空闲
log_info "步骤2: 验证端口状态"
check_port() {
    local port=$1
    local name=$2
    if lsof -ti:$port > /dev/null 2>&1; then
        log_error "$name 端口 $port 仍被占用"
        return 1
    else
        log_success "$name 端口 $port 空闲"
        return 0
    fi
}

check_port 5173 "前端" || exit 1
check_port 3000 "后端" || exit 1

# 3. 测试后端服务启动（指定正确端口）
log_info "步骤3: 测试后端服务启动在3000端口"
cd server
PORT=3000 npm run dev > /dev/null 2>&1 &
BACKEND_PID=$!
cd ..

# 等待服务启动
sleep 5

# 检查后端是否启动在正确端口
if lsof -ti:3000 > /dev/null 2>&1; then
    log_success "后端服务成功启动在3000端口"

    # 检查5173端口是否被误占用
    if lsof -ti:5173 > /dev/null 2>&1; then
        log_error "❌ 发现问题: 后端服务错误占用了5173端口!"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    else
        log_success "5173端口正确保持空闲"
    fi
else
    log_error "后端服务启动失败"
    exit 1
fi

# 4. 测试前端服务启动
log_info "步骤4: 测试前端服务启动在5173端口"
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!

# 等待服务启动
sleep 5

# 检查前端是否启动在正确端口
if lsof -ti:5173 > /dev/null 2>&1; then
    log_success "前端服务成功启动在5173端口"
else
    log_error "前端服务启动失败"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 5. 最终端口分配验证
log_info "步骤5: 最终端口分配验证"

# 获取端口占用进程信息
backend_process=$(lsof -ti:3000 2>/dev/null | head -1)
frontend_process=$(lsof -ti:5173 2>/dev/null | head -1)

if [ -n "$backend_process" ] && [ -n "$frontend_process" ]; then
    backend_cmd=$(ps -p $backend_process -o comm= 2>/dev/null || echo "unknown")
    frontend_cmd=$(ps -p $frontend_process -o comm= 2>/dev/null || echo "unknown")

    log_success "端口分配正确:"
    echo "  - 后端 (3000): PID $backend_process ($backend_cmd)"
    echo "  - 前端 (5173): PID $frontend_process ($frontend_cmd)"
else
    log_error "端口分配验证失败"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

# 6. 清理测试进程
log_info "步骤6: 清理测试进程"
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
sleep 2

# 最终清理
./scripts/kill-ports.sh -f -b > /dev/null 2>&1

log_success "🎉 所有测试通过！端口问题已彻底解决"
echo ""
echo "📋 测试结果总结:"
echo "  ✅ 端口清理功能正常"
echo "  ✅ 后端正确启动在3000端口"
echo "  ✅ 前端正确启动在5173端口"
echo "  ✅ 不存在端口冲突问题"
echo ""
log_info "现在可以安全使用以下命令启动服务:"
echo "  npm run server:dev  # 后端服务"
echo "  npm run dev         # 前端服务"
echo "  或"
echo "  bash scripts/development/dev-start.sh  # 一键启动"
