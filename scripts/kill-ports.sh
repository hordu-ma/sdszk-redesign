#!/bin/bash

# 山东省思政课一体化中心 - 端口清理和管理脚本
# 用于彻底解决端口占用问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 显示帮助信息
show_help() {
    echo "端口清理和管理脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -a, --all      清理所有相关端口 (3000, 5173, 27017, 6379)"
    echo "  -f, --frontend 仅清理前端端口 (5173)"
    echo "  -b, --backend  仅清理后端端口 (3000)"
    echo "  -d, --database 仅清理数据库端口 (27017, 6379)"
    echo "  -v, --verbose  详细输出"
    echo "  -c, --check    仅检查端口状态，不进行清理"
    echo ""
    echo "示例:"
    echo "  $0 -a          # 清理所有端口"
    echo "  $0 -f          # 仅清理前端端口"
    echo "  $0 -c          # 检查所有端口状态"
}

# 检查端口占用情况
check_port() {
    local port=$1
    local name=$2
    local pid

    pid=$(lsof -ti:$port 2>/dev/null || echo "")

    if [ -n "$pid" ]; then
        local process_info=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
        log_warning "$name 端口 $port 被占用 (PID: $pid, 进程: $process_info)"
        return 1
    else
        log_success "$name 端口 $port 空闲"
        return 0
    fi
}

# 强制关闭端口
kill_port() {
    local port=$1
    local name=$2
    local force=${3:-false}
    local pids

    pids=$(lsof -ti:$port 2>/dev/null || echo "")

    if [ -n "$pids" ]; then
        log_info "正在关闭 $name 端口 $port 上的进程..."

        if [ "$VERBOSE" = true ]; then
            echo "发现的进程:"
            for pid in $pids; do
                ps -p $pid -o pid,ppid,comm,args 2>/dev/null || true
            done
        fi

        # 首先尝试优雅关闭
        if [ "$force" = false ]; then
            echo $pids | xargs kill -TERM 2>/dev/null || true
            sleep 2

            # 检查是否还在运行
            pids=$(lsof -ti:$port 2>/dev/null || echo "")
        fi

        # 如果还在运行，强制关闭
        if [ -n "$pids" ]; then
            log_warning "优雅关闭失败，强制终止进程..."
            echo $pids | xargs kill -9 2>/dev/null || true
            sleep 1

            # 最终检查
            pids=$(lsof -ti:$port 2>/dev/null || echo "")
            if [ -n "$pids" ]; then
                log_error "无法关闭端口 $port 上的进程"
                return 1
            fi
        fi

        log_success "$name 端口 $port 已释放"
    else
        log_info "$name 端口 $port 本来就是空闲的"
    fi

    return 0
}

# 清理环境变量
clean_environment() {
    log_info "检查环境变量..."

    # 检查当前会话的环境变量
    if [ -n "$PORT" ]; then
        log_warning "发现 PORT 环境变量: $PORT"
        log_info "建议在启动服务前明确指定端口，如: PORT=3000 npm run server:dev"
    fi

    # 检查可能的错误配置
    if [ "$PORT" = "5173" ]; then
        log_error "发现错误配置: PORT=5173 (这会导致后端服务启动在前端端口)"
        log_info "建议执行: unset PORT"
    fi
}

# 显示端口使用建议
show_port_guide() {
    echo ""
    log_info "📋 端口使用指南:"
    echo "  - 前端 (Vite):     5173"
    echo "  - 后端 (Express):   3000"
    echo "  - MongoDB:         27017"
    echo "  - Redis:           6379"
    echo ""
    log_info "🚀 推荐启动方式:"
    echo "  # 后端服务"
    echo "  PORT=3000 npm run server:dev"
    echo ""
    echo "  # 前端服务"
    echo "  npm run dev"
    echo ""
    echo "  # 或使用项目脚本"
    echo "  bash scripts/development/dev-start.sh"
}

# 主要端口定义
FRONTEND_PORT=5173
BACKEND_PORT=3000
MONGODB_PORT=27017
REDIS_PORT=6379

# 默认参数
VERBOSE=false
CHECK_ONLY=false
CLEAN_ALL=false
CLEAN_FRONTEND=false
CLEAN_BACKEND=false
CLEAN_DATABASE=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -a|--all)
            CLEAN_ALL=true
            shift
            ;;
        -f|--frontend)
            CLEAN_FRONTEND=true
            shift
            ;;
        -b|--backend)
            CLEAN_BACKEND=true
            shift
            ;;
        -d|--database)
            CLEAN_DATABASE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -c|--check)
            CHECK_ONLY=true
            shift
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 如果没有指定具体选项，默认清理前端和后端
if [ "$CLEAN_ALL" = false ] && [ "$CLEAN_FRONTEND" = false ] && [ "$CLEAN_BACKEND" = false ] && [ "$CLEAN_DATABASE" = false ] && [ "$CHECK_ONLY" = false ]; then
    CLEAN_FRONTEND=true
    CLEAN_BACKEND=true
fi

echo "🧹 山东省思政课一体化中心 - 端口清理工具"
echo "================================================"

# 检查是否有 lsof 命令
if ! command -v lsof &> /dev/null; then
    log_error "lsof 命令未找到，请安装后再试"
    exit 1
fi

# 仅检查模式
if [ "$CHECK_ONLY" = true ]; then
    log_info "🔍 检查端口状态..."
    check_port $FRONTEND_PORT "前端"
    check_port $BACKEND_PORT "后端"
    check_port $MONGODB_PORT "MongoDB"
    check_port $REDIS_PORT "Redis"
    clean_environment
    show_port_guide
    exit 0
fi

# 清理环境变量
clean_environment

# 清理端口
if [ "$CLEAN_ALL" = true ] || [ "$CLEAN_FRONTEND" = true ]; then
    kill_port $FRONTEND_PORT "前端" false
fi

if [ "$CLEAN_ALL" = true ] || [ "$CLEAN_BACKEND" = true ]; then
    kill_port $BACKEND_PORT "后端" false
fi

if [ "$CLEAN_ALL" = true ] || [ "$CLEAN_DATABASE" = true ]; then
    kill_port $MONGODB_PORT "MongoDB" false
    kill_port $REDIS_PORT "Redis" false
fi

echo ""
log_info "🔍 最终端口状态检查..."
check_port $FRONTEND_PORT "前端" || true
check_port $BACKEND_PORT "后端" || true

if [ "$CLEAN_ALL" = true ] || [ "$CLEAN_DATABASE" = true ]; then
    check_port $MONGODB_PORT "MongoDB" || true
    check_port $REDIS_PORT "Redis" || true
fi

show_port_guide

log_success "端口清理完成！"
