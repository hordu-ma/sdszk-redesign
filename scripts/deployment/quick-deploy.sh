#!/bin/bash

# 快速部署脚本 v1.0
# 山东省思政课一体化中心 - 简化部署操作
# 提供最常用的部署选项，减少复杂性

set -euo pipefail

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly NC='\033[0m'

# 配置
readonly SERVER_IP="60.205.124.67"
readonly SERVER_USER="root"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 日志函数
log() { echo -e "[$(date '+%H:%M:%S')] $1"; }
success() { log "${GREEN}✅ $1${NC}"; }
error() { log "${RED}❌ $1${NC}"; }
warning() { log "${YELLOW}⚠️ $1${NC}"; }
info() { log "${BLUE}ℹ️ $1${NC}"; }
step() { log "${PURPLE}🔄 $1${NC}"; }

# 显示帮助
show_help() {
    cat << EOF
🚀 快速部署工具 v1.0

用法: $0 [选项]

快速选项:
  f, front, frontend     快速部署前端
  b, back, backend       快速部署后端
  a, all, fullstack      全栈部署
  r, restart             重启后端服务
  s, status             查看服务状态
  l, logs               查看后端日志
  h, help               显示帮助

示例:
  $0 f          # 快速前端部署
  $0 b          # 快速后端部署
  $0 a          # 全栈部署
  $0 restart    # 重启服务
  $0 status     # 查看状态

特点:
• 自动检查环境
• 快速构建和部署
• 简化的错误处理
• 实时状态反馈

EOF
}

# 检查基础环境
check_basic_env() {
    step "环境检查..."

    # 检查必要工具
    for tool in node npm git ssh; do
        if ! command -v "$tool" &> /dev/null; then
            error "缺少工具: $tool"
            exit 1
        fi
    done

    # 检查SSH连接
    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$SERVER_USER@$SERVER_IP" "echo ok" &>/dev/null; then
        error "SSH连接失败: $SERVER_IP"
        exit 1
    fi

    success "环境检查通过"
}

# 快速前端部署
quick_frontend() {
    step "快速前端部署..."

    # 构建
    info "构建前端..."
    if ! npm run build:aliyun &>/dev/null; then
        error "前端构建失败"
        exit 1
    fi

    # 部署
    info "上传文件..."
    if ! rsync -azq --delete dist/ "$SERVER_USER@$SERVER_IP:/var/www/frontend/"; then
        error "文件上传失败"
        exit 1
    fi

    # 重载nginx
    ssh "$SERVER_USER@$SERVER_IP" "nginx -t && systemctl reload nginx" &>/dev/null

    success "前端部署完成"
    info "访问: https://horsduroot.com"
}

# 快速后端部署
quick_backend() {
    step "快速后端部署..."

    local temp_dir="/tmp/quick-backend-$(date +%s)"
    mkdir -p "$temp_dir"

    # 准备代码
    info "准备后端代码..."
    cp -r server/* "$temp_dir/"
    cp server/.env.production "$temp_dir/.env"

    # 安装依赖
    info "安装依赖..."
    cd "$temp_dir"
    if ! npm ci --only=production --silent; then
        error "依赖安装失败"
        rm -rf "$temp_dir"
        exit 1
    fi

    # 打包上传
    info "打包上传..."
    zip -rq deploy.zip . -x "*.log" "test/*"
    if ! scp -q deploy.zip "$SERVER_USER@$SERVER_IP:/tmp/"; then
        error "上传失败"
        rm -rf "$temp_dir"
        exit 1
    fi

    # 服务器端部署
    info "服务器部署..."
    ssh "$SERVER_USER@$SERVER_IP" "
        pm2 stop sdszk-backend 2>/dev/null || true
        rm -rf /var/www/sdszk-backend
        mkdir -p /var/www/sdszk-backend
        cd /var/www/sdszk-backend
        unzip -q /tmp/deploy.zip
        mkdir -p uploads/{documents,images,videos} logs data
        pm2 start app.js --name sdszk-backend --env production >/dev/null
        rm /tmp/deploy.zip
    " &>/dev/null

    # 清理
    cd - >/dev/null
    rm -rf "$temp_dir"

    success "后端部署完成"
    info "API: https://horsduroot.com/api/health"
}

# 全栈部署
quick_fullstack() {
    step "全栈部署..."
    quick_frontend
    quick_backend
    success "全栈部署完成"
}

# 重启服务
restart_service() {
    step "重启后端服务..."
    ssh "$SERVER_USER@$SERVER_IP" "
        pm2 restart sdszk-backend 2>/dev/null ||
        (cd /var/www/sdszk-backend && pm2 start app.js --name sdszk-backend --env production)
    " &>/dev/null
    success "服务重启完成"
}

# 查看状态
show_status() {
    step "获取服务状态..."

    echo "📊 PM2状态:"
    ssh "$SERVER_USER@$SERVER_IP" "pm2 status"

    echo ""
    echo "🌐 网站检查:"
    if curl -s https://horsduroot.com >/dev/null; then
        success "前端访问正常"
    else
        warning "前端访问异常"
    fi

    if ssh "$SERVER_USER@$SERVER_IP" "curl -s http://localhost:3000/api/health >/dev/null"; then
        success "API访问正常"
    else
        warning "API访问异常"
    fi
}

# 查看日志
show_logs() {
    step "获取后端日志..."
    ssh "$SERVER_USER@$SERVER_IP" "pm2 logs sdszk-backend --lines 30"
}

# 主函数
main() {
    local action="${1:-help}"

    info "🚀 快速部署工具启动..."

    case "$action" in
        "f"|"front"|"frontend")
            check_basic_env
            quick_frontend
            ;;
        "b"|"back"|"backend")
            check_basic_env
            quick_backend
            ;;
        "a"|"all"|"fullstack")
            check_basic_env
            quick_fullstack
            ;;
        "r"|"restart")
            restart_service
            ;;
        "s"|"status")
            show_status
            ;;
        "l"|"logs")
            show_logs
            ;;
        "h"|"help"|*)
            show_help
            ;;
    esac
}

# 执行
main "$@"
