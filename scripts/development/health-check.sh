#!/bin/bash

# health-check.sh - 开发环境健康检查脚本
# 用于定期检查开发环境的健康状态，预防问题发生

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BACKEND_PORT=3000
FRONTEND_PORT=5173
MONGODB_PORT=27017
REDIS_PORT=6379

# 日志文件
LOG_FILE="./logs/health-check.log"

# 创建日志目录
mkdir -p logs

# 日志函数
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

info() {
    log "${BLUE}ℹ️  $1${NC}"
}

success() {
    log "${GREEN}✅ $1${NC}"
}

warning() {
    log "${YELLOW}⚠️  $1${NC}"
}

error() {
    log "${RED}❌ $1${NC}"
}

# 检查端口是否被占用
check_port() {
    local port=$1
    local name=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        success "$name 服务正在运行 (端口 $port)"
        return 0
    else
        error "$name 服务未运行 (端口 $port)"
        return 1
    fi
}

# 检查HTTP服务响应
check_http_service() {
    local url=$1
    local name=$2
    local timeout=${3:-5}

    if curl -f -s -m $timeout "$url" >/dev/null 2>&1; then
        success "$name HTTP服务响应正常"
        return 0
    else
        error "$name HTTP服务无响应"
        return 1
    fi
}

# 检查MongoDB连接
check_mongodb() {
    info "检查 MongoDB 连接..."

    # 检查进程
    if pgrep -f mongod >/dev/null 2>&1; then
        success "MongoDB 进程运行正常"
    else
        error "MongoDB 进程未运行"
        return 1
    fi

    # 直接测试数据库连接，不依赖端口检查
    if timeout 5 mongosh sdszk --quiet --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        success "MongoDB 连接测试通过"
        success "MongoDB 服务正在运行 (端口 $MONGODB_PORT)"
        return 0
    else
        error "MongoDB 连接测试失败"
        return 1
    fi
}

# 检查Redis连接
check_redis() {
    info "检查 Redis 连接..."

    # 检查进程
    if pgrep -f redis-server >/dev/null 2>&1; then
        success "Redis 进程运行正常"
    else
        warning "Redis 进程未运行 (可选服务)"
        return 0
    fi

    # 检查端口
    if check_port $REDIS_PORT "Redis"; then
        # 测试连接
        if timeout 3 redis-cli ping >/dev/null 2>&1; then
            success "Redis 连接测试通过"
        else
            warning "Redis 连接测试失败"
        fi
    fi

    return 0
}

# 检查后端API
check_backend_api() {
    info "检查后端 API..."

    if ! check_port $BACKEND_PORT "后端API"; then
        return 1
    fi

    # 健康检查端点
    if check_http_service "http://localhost:$BACKEND_PORT/api/health" "后端API健康检查"; then
        # 测试新闻API
        if check_http_service "http://localhost:$BACKEND_PORT/api/news" "新闻API" 3; then
            success "新闻API响应正常"
        else
            warning "新闻API响应异常"
        fi

        # 测试新闻分类API
        if check_http_service "http://localhost:$BACKEND_PORT/api/news-categories" "新闻分类API" 3; then
            success "新闻分类API响应正常"
        else
            warning "新闻分类API响应异常"
        fi

        # 测试资源API
        if check_http_service "http://localhost:$BACKEND_PORT/api/resources" "资源API" 3; then
            success "资源API响应正常"
        else
            warning "资源API响应异常"
        fi

        return 0
    else
        return 1
    fi
}

# 检查前端服务
check_frontend() {
    info "检查前端服务..."

    if ! check_port $FRONTEND_PORT "前端服务"; then
        return 1
    fi

    if check_http_service "http://localhost:$FRONTEND_PORT" "前端页面"; then
        return 0
    else
        return 1
    fi
}

# 检查文件系统权限
check_filesystem() {
    info "检查文件系统权限..."

    # 检查关键目录权限
    local dirs=("./server/uploads" "./server/logs" "./logs" "./.pids")

    for dir in "${dirs[@]}"; do
        if [ -d "$dir" ]; then
            if [ -w "$dir" ]; then
                success "目录 $dir 权限正常"
            else
                error "目录 $dir 权限异常"
                return 1
            fi
        else
            warning "目录 $dir 不存在"
        fi
    done

    return 0
}

# 检查环境变量
check_environment() {
    info "检查环境变量..."

    # 检查前端环境变量
    if [ -f ".env.development" ]; then
        success "前端环境配置文件存在"
    else
        warning "前端环境配置文件缺失"
    fi

    # 检查后端环境变量
    if [ -f "server/.env" ]; then
        success "后端环境配置文件存在"
    else
        warning "后端环境配置文件缺失（使用默认配置）"
    fi

    return 0
}

# 检查磁盘空间
check_disk_space() {
    info "检查磁盘空间..."

    local available=$(df -h . | awk 'NR==2 {print $4}' | sed 's/[^0-9]//g')
    local used_percent=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ "$used_percent" -lt 90 ]; then
        success "磁盘空间充足 (已使用 ${used_percent}%)"
    else
        warning "磁盘空间不足 (已使用 ${used_percent}%)"
    fi

    return 0
}

# 自动修复建议
suggest_fixes() {
    error "🔧 检测到问题，建议执行以下修复步骤："
    echo ""
    echo "1. 重启开发环境："
    echo "   ./scripts/development/dev-stop.sh"
    echo "   ./scripts/development/dev-start.sh"
    echo ""
    echo "2. 如果 MongoDB 有问题："
    echo "   brew services restart mongodb-community"
    echo ""
    echo "3. 如果端口被占用："
    echo "   ./scripts/kill-ports.sh"
    echo ""
    echo "4. 清理缓存和重新安装依赖："
    echo "   ./scripts/development/cleanup-project.sh"
    echo "   npm install"
    echo "   cd server && npm install && cd .."
    echo ""
    echo "5. 完整诊断："
    echo "   ./scripts/development/debug-services.sh"
}

# 主检查函数
main() {
    info "🏥 开始开发环境健康检查..."
    info "时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    local errors=0

    # 执行各项检查
    check_environment || ((errors++))
    echo ""

    check_filesystem || ((errors++))
    echo ""

    check_disk_space || ((errors++))
    echo ""

    check_mongodb || ((errors++))
    echo ""

    check_redis || ((errors++))
    echo ""

    check_backend_api || ((errors++))
    echo ""

    check_frontend || ((errors++))
    echo ""

    # 总结
    if [ $errors -eq 0 ]; then
        success "🎉 所有检查通过！开发环境运行正常"
        exit 0
    else
        error "❌ 发现 $errors 个问题"
        suggest_fixes
        exit 1
    fi
}

# 处理命令行参数
case "${1:-check}" in
    "check"|"")
        main
        ;;
    "mongodb")
        check_mongodb
        ;;
    "redis")
        check_redis
        ;;
    "backend")
        check_backend_api
        ;;
    "frontend")
        check_frontend
        ;;
    "quick")
        info "🚀 快速健康检查..."
        check_port $BACKEND_PORT "后端API" &&
        check_port $FRONTEND_PORT "前端服务" &&
        success "✅ 核心服务运行正常" ||
        error "❌ 核心服务异常"
        ;;
    "help"|"-h"|"--help")
        echo "用法: $0 [命令]"
        echo ""
        echo "命令:"
        echo "  check     完整健康检查 (默认)"
        echo "  mongodb   仅检查 MongoDB"
        echo "  redis     仅检查 Redis"
        echo "  backend   仅检查后端 API"
        echo "  frontend  仅检查前端服务"
        echo "  quick     快速检查核心服务"
        echo "  help      显示此帮助信息"
        echo ""
        echo "示例:"
        echo "  $0                    # 完整检查"
        echo "  $0 quick             # 快速检查"
        echo "  $0 backend           # 仅检查后端"
        ;;
    *)
        error "未知命令: $1"
        echo "运行 '$0 help' 查看可用命令"
        exit 1
        ;;
esac
