#!/bin/bash

# 开发环境URL修复脚本
# 修复开发环境数据库中包含本地URL的资源记录

set -e

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装或不在 PATH 中"
        exit 1
    fi

    # 检查开发环境配置文件
    if [[ ! -f "$PROJECT_ROOT/server/.env" ]]; then
        log_error "开发环境配置文件不存在: $PROJECT_ROOT/server/.env"
        exit 1
    fi

    # 检查数据库连接
    log_info "检查开发数据库连接..."
    if ! mongosh --eval "db.adminCommand('ping')" --quiet &> /dev/null; then
        log_warning "MongoDB 可能未运行，请确保数据库服务已启动"
        log_info "可以运行: npm run dev:db 启动数据库服务"

        read -p "数据库已运行？继续吗？(y/N): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "请先启动数据库服务"
            exit 0
        fi
    fi

    log_success "依赖检查通过"
}

# 确认操作
confirm_operation() {
    echo
    log_info "📋 即将执行的操作:"
    log_info "1. 查找开发数据库中包含本地URL的资源"
    log_info "2. 将 localhost:3000/5173 替换为 horsduroot.com"
    log_info "3. 将 127.0.0.1:3000/5173 替换为 horsduroot.com"
    log_info "4. 确保开发环境与生产环境URL一致"
    echo

    read -p "确认要继续吗？(y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "操作已取消"
        exit 0
    fi
}

# 停止开发服务
stop_dev_services() {
    log_info "停止开发服务（如果正在运行）..."

    # 停止可能运行的开发服务
    pkill -f "vite" &> /dev/null || true
    pkill -f "node.*server" &> /dev/null || true

    log_info "等待服务完全停止..."
    sleep 2
}

# 执行修复
run_fix() {
    log_info "开始执行URL修复..."

    cd "$PROJECT_ROOT"

    # 执行修复脚本
    if node scripts/database/fix-development-urls.js; then
        log_success "修复脚本执行完成"
        return 0
    else
        log_error "修复脚本执行失败"
        return 1
    fi
}

# 重启开发服务
restart_dev_services() {
    log_info "准备重启开发服务..."

    echo
    log_info "建议的启动步骤:"
    echo "1. 运行: npm run dev (启动前端开发服务器)"
    echo "2. 运行: npm run server:dev (启动后端API服务器)"
    echo "3. 或者运行: ./scripts/development/dev-start.sh (一键启动全部服务)"
    echo

    read -p "现在启动开发服务吗？(y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "启动开发服务..."
        if [[ -f "$PROJECT_ROOT/scripts/development/dev-start.sh" ]]; then
            "$PROJECT_ROOT/scripts/development/dev-start.sh"
        else
            log_warning "自动启动脚本不存在，请手动启动服务"
        fi
    else
        log_info "请稍后手动启动开发服务"
    fi
}

# 验证修复结果
verify_fix() {
    log_info "验证修复结果..."

    echo
    log_info "建议手动验证以下内容:"
    echo "1. 启动开发服务: npm run dev"
    echo "2. 访问 http://localhost:5173/resources?category=theory"
    echo "3. 点击任意理论前沿资源详情页"
    echo "4. 检查右上角下载按钮指向的URL"
    echo "5. 确认资源文件URL不再包含localhost"
    echo

    log_warning "注意: 开发环境的资源URL现在指向生产域名"
    log_warning "这是为了保持一致性，避免下次部署时出现问题"
}

# 主函数
main() {
    echo "========================================"
    echo "    开发环境URL修复脚本"
    echo "========================================"
    echo

    # 检查依赖
    check_dependencies

    # 确认操作
    confirm_operation

    # 停止开发服务
    stop_dev_services

    # 执行修复
    if run_fix; then
        echo
        log_success "🎉 开发环境URL修复完成！"

        # 验证提醒
        verify_fix

        # 重启服务
        restart_dev_services

        echo
        log_success "修复流程完成！"
        log_info "现在生产环境和开发环境都使用正确的URL格式"
        log_info "下次部署时不会再出现URL覆盖问题"

    else
        echo
        log_error "修复失败，请查看错误信息"
        exit 1
    fi
}

# 错误处理
trap 'log_error "脚本执行过程中发生错误，退出码: $?"' ERR

# 执行主函数
main "$@"
