#!/bin/bash

# 阿里云统一部署管理器 v3.0
# 山东省思政课一体化中心 - 全栈自动化部署脚本
# 支持前端、后端独立部署或全栈同步部署

set -euo pipefail

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# 阿里云配置
readonly SERVER_USER="root"
readonly SERVER_IP="60.205.124.67"
readonly DOMAIN="sdszk.cn"
readonly WWW_DOMAIN="www.sdszk.cn"

# 部署路径配置
readonly FRONTEND_DEPLOY_PATH="/var/www/frontend"
readonly BACKEND_DEPLOY_PATH="/var/www/sdszk-backend"
readonly PM2_APP_NAME="sdszk-backend"

# 超时配置
readonly SSH_TIMEOUT=15
readonly HEALTH_CHECK_TIMEOUT=10
readonly HEALTH_CHECK_RETRIES=3
readonly NPM_INSTALL_TIMEOUT=300
readonly BUILD_TIMEOUT=600

# 全局变量
readonly DEPLOYMENT_ID="$(date +%Y%m%d_%H%M%S)"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
readonly TEMP_DIR="/tmp/sdszk-deploy-${DEPLOYMENT_ID}"
readonly LOCK_FILE="/tmp/sdszk-aliyun-deploy.lock"

# SSH选项
readonly SSH_OPTS="-o ConnectTimeout=${SSH_TIMEOUT} -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o BatchMode=yes -o StrictHostKeyChecking=no"

# 检测timeout命令
if command -v timeout &> /dev/null; then
    readonly TIMEOUT_CMD="timeout"
elif command -v gtimeout &> /dev/null; then
    readonly TIMEOUT_CMD="gtimeout"
else
    echo "❌ timeout命令未安装 (macOS请安装: brew install coreutils)"
    exit 1
fi

# 日志函数
log_with_timestamp() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_success() { log_with_timestamp "${GREEN}✅ $1${NC}"; }
log_error() { log_with_timestamp "${RED}❌ $1${NC}"; }
log_warning() { log_with_timestamp "${YELLOW}⚠️ $1${NC}"; }
log_info() { log_with_timestamp "${BLUE}ℹ️ $1${NC}"; }
log_step() { log_with_timestamp "${PURPLE}🔄 $1${NC}"; }
log_header() { log_with_timestamp "${CYAN}🚀 $1${NC}"; }

# 清理函数
cleanup() {
    log_info "执行清理操作..."
    rm -f "$LOCK_FILE"
    rm -rf "$TEMP_DIR"
}

# 错误处理
handle_error() {
    local exit_code=$1
    local line_number=$2
    log_error "部署失败！错误代码: $exit_code，行号: $line_number"
    cleanup
    exit $exit_code
}

# 设置错误处理
trap 'handle_error $? $LINENO' ERR
trap cleanup EXIT

# 安全SSH执行
safe_ssh() {
    local timeout=${1:-30}
    shift
    $TIMEOUT_CMD "$timeout" ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "$@"
}

# 检查部署锁
check_deployment_lock() {
    if [[ -f "$LOCK_FILE" ]]; then
        local lock_pid=$(cat "$LOCK_FILE")
        if kill -0 "$lock_pid" 2>/dev/null; then
            log_error "检测到另一个部署进程正在运行 (PID: $lock_pid)"
            log_error "如需强制部署，请删除锁文件: $LOCK_FILE"
            exit 1
        else
            log_warning "发现过期的锁文件，正在清理..."
            rm -f "$LOCK_FILE"
        fi
    fi

    echo $$ > "$LOCK_FILE"
    log_success "获取部署锁成功 (PID: $$)"
}

# 环境检查
preflight_check() {
    log_step "执行环境检查..."

    # 检查必要工具
    local required_tools=("node" "npm" "git" "ssh" "curl" "rsync" "zip")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "必需工具未安装: $tool"
            exit 1
        fi
    done
    log_success "必需工具检查通过"

    # 检查Node.js版本
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $node_version -lt 16 ]]; then
        log_error "Node.js版本过低，需要16+，当前版本: $(node --version)"
        exit 1
    fi
    log_success "Node.js版本检查通过: $(node --version)"

    # 检查项目根目录
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "未找到项目根目录或package.json文件"
        exit 1
    fi

    # 检查SSH连接
    log_info "测试SSH连接..."
    if ! safe_ssh 10 "echo 'SSH连接测试成功'"; then
        log_error "无法连接到服务器 $SERVER_USER@$SERVER_IP"
        exit 1
    fi
    log_success "SSH连接测试通过"

    # 显示Git信息
    local git_branch=$(git rev-parse --abbrev-ref HEAD)
    local git_commit=$(git rev-parse --short HEAD)
    log_info "当前分支: $git_branch"
    log_info "当前提交: $git_commit"

    log_success "环境检查完成"
}

# 前端构建
build_frontend() {
    log_step "构建前端项目..."

    cd "$PROJECT_ROOT"

    # 清理旧构建
    if [[ -d "dist" ]]; then
        rm -rf dist
    fi

    # 安装依赖
    log_info "安装前端依赖..."
    if ! $TIMEOUT_CMD $NPM_INSTALL_TIMEOUT npm install --legacy-peer-deps; then
        log_error "前端依赖安装失败"
        exit 1
    fi

    # 构建项目
    log_info "执行前端构建..."
    if ! $TIMEOUT_CMD $BUILD_TIMEOUT npm run build:aliyun; then
        log_error "前端构建失败"
        exit 1
    fi

    # 验证构建结果
    if [[ ! -d "dist" ]] || [[ ! -f "dist/index.html" ]]; then
        log_error "前端构建验证失败"
        exit 1
    fi

    local build_size=$(du -sh dist | cut -f1)
    local file_count=$(find dist -type f | wc -l)
    log_success "前端构建完成 - 大小: $build_size, 文件数: $file_count"
}

# 后端构建
build_backend() {
    log_step "构建后端项目..."

    local backend_build_dir="$TEMP_DIR/backend"
    mkdir -p "$backend_build_dir"

    # 复制后端代码
    log_info "复制后端代码..."
    cp -r "$PROJECT_ROOT/server"/* "$backend_build_dir/"

    # 检查生产环境配置
    if [[ ! -f "$PROJECT_ROOT/server/.env.production" ]]; then
        log_error "后端生产环境配置文件不存在: server/.env.production"
        exit 1
    fi
    cp "$PROJECT_ROOT/server/.env.production" "$backend_build_dir/.env"

    # 安装生产依赖
    cd "$backend_build_dir"
    log_info "安装后端生产依赖..."
    if ! $TIMEOUT_CMD $NPM_INSTALL_TIMEOUT npm ci --only=production --no-audit; then
        log_error "后端依赖安装失败"
        exit 1
    fi

    # 创建必要目录
    mkdir -p uploads/{documents,images,videos} logs data
    chmod -R 755 uploads logs data

    local package_count=$(ls node_modules 2>/dev/null | wc -l)
    log_success "后端构建完成 - 依赖包数: $package_count"

    cd "$PROJECT_ROOT"
}

# 前端部署
deploy_frontend() {
    log_step "部署前端到阿里云..."

    # 创建服务器备份
    local backup_dir="/var/www/frontend-backup-${DEPLOYMENT_ID}"
    if safe_ssh 30 "[ -d '$FRONTEND_DEPLOY_PATH' ] && cp -r '$FRONTEND_DEPLOY_PATH' '$backup_dir' || echo 'No existing frontend to backup'"; then
        log_success "前端备份创建完成: $backup_dir"
    fi

    # 确保远程目录存在
    safe_ssh 10 "mkdir -p '$FRONTEND_DEPLOY_PATH'"

    # 上传前端文件
    log_info "上传前端文件..."
    if ! $TIMEOUT_CMD 300 rsync -avz --delete --progress \
        --exclude='.git*' --exclude='node_modules' --exclude='*.log' \
        "$PROJECT_ROOT/dist/" "$SERVER_USER@$SERVER_IP:$FRONTEND_DEPLOY_PATH/"; then
        log_error "前端文件上传失败"
        exit 1
    fi

    # 设置文件权限
    safe_ssh 30 "
        find '$FRONTEND_DEPLOY_PATH' -type f -exec chmod 644 {} \;
        find '$FRONTEND_DEPLOY_PATH' -type d -exec chmod 755 {} \;
        chown -R www-data:www-data '$FRONTEND_DEPLOY_PATH' 2>/dev/null ||
        chown -R nginx:nginx '$FRONTEND_DEPLOY_PATH' 2>/dev/null ||
        echo '使用当前用户权限'
    "

    log_success "前端部署完成"
}

# 后端部署
deploy_backend() {
    log_step "部署后端到阿里云..."

    local backend_build_dir="$TEMP_DIR/backend"
    local deploy_package="$TEMP_DIR/backend-${DEPLOYMENT_ID}.zip"

    # 打包后端
    cd "$backend_build_dir"
    log_info "打包后端项目..."
    if ! $TIMEOUT_CMD 60 zip -r "$deploy_package" . \
        -x "*.log" ".git*" "*.tmp" "test/*" "*.test.js" > /dev/null; then
        log_error "后端打包失败"
        exit 1
    fi

    local package_size=$(du -sh "$deploy_package" | cut -f1)
    log_info "后端包大小: $package_size"

    # 创建服务器备份
    local backup_dir="/var/www/sdszk-backend-backup-${DEPLOYMENT_ID}"
    safe_ssh 60 "
        if [ -d '$BACKEND_DEPLOY_PATH' ]; then
            cp -r '$BACKEND_DEPLOY_PATH' '$backup_dir'
            echo 'Backend backup created: $backup_dir'
        fi
    "

    # 停止现有服务
    log_info "停止现有后端服务..."
    safe_ssh 30 "
        if pm2 list 2>/dev/null | grep -q '$PM2_APP_NAME'; then
            pm2 stop '$PM2_APP_NAME' 2>/dev/null || true
            pm2 delete '$PM2_APP_NAME' 2>/dev/null || true
        fi
    "

    # 上传后端包
    log_info "上传后端包..."
    if ! $TIMEOUT_CMD 300 scp $SSH_OPTS "$deploy_package" "$SERVER_USER@$SERVER_IP:/tmp/"; then
        log_error "后端包上传失败"
        exit 1
    fi

    # 服务器端部署
    safe_ssh 120 "
        rm -rf '$BACKEND_DEPLOY_PATH'
        mkdir -p '$BACKEND_DEPLOY_PATH'
        cd '$BACKEND_DEPLOY_PATH'
        unzip -q '/tmp/$(basename "$deploy_package")'

        # 设置权限
        find . -type f -exec chmod 644 {} \;
        find . -type d -exec chmod 755 {} \;
        mkdir -p uploads/{documents,images,videos} logs data
        chmod -R 755 uploads logs data

        # 清理临时文件
        rm -f '/tmp/$(basename "$deploy_package")'
    "

    # 启动新服务
    log_info "启动后端服务..."
    safe_ssh 90 "
        cd '$BACKEND_DEPLOY_PATH'
        pm2 start app.js --name '$PM2_APP_NAME' --env production \
            --max-restarts 10 \
            --restart-delay 3000 \
            --max-memory-restart 500M \
            --watch false \
            --merge-logs true \
            --time

        sleep 5
        pm2 save
    "

    log_success "后端部署完成"

    cd "$PROJECT_ROOT"
}

# 重载Nginx
reload_nginx() {
    log_step "重载Nginx配置..."

    # 测试配置
    if safe_ssh 15 "nginx -t"; then
        log_success "Nginx配置语法检查通过"
    else
        log_error "Nginx配置语法错误"
        exit 1
    fi

    # 重载服务
    if safe_ssh 15 "systemctl reload nginx"; then
        log_success "Nginx重载完成"
    else
        log_error "Nginx重载失败"
        exit 1
    fi

    sleep 2
}

# 健康检查
health_check() {
    log_step "执行健康检查..."

    sleep 5

    # 检查网站访问
    local check_urls=("https://$DOMAIN" "https://$WWW_DOMAIN")

    for url in "${check_urls[@]}"; do
        log_info "检查: $url"
        local success=false

        for ((i=1; i<=HEALTH_CHECK_RETRIES; i++)); do
            if curl -f -s --max-time $HEALTH_CHECK_TIMEOUT "$url" > /dev/null; then
                log_success "✓ $url 访问正常"
                success=true
                break
            else
                log_warning "第 $i 次检查失败，重试中..."
                sleep 2
            fi
        done

        if [[ "$success" != true ]]; then
            log_warning "健康检查失败: $url (可能需要等待更长时间)"
        fi
    done

    # 检查API接口
    log_info "检查API健康状态..."
    if safe_ssh 15 "curl -f -s --max-time 8 'http://localhost:3000/api/health' >/dev/null"; then
        log_success "✓ API健康检查通过"
    else
        log_warning "API健康检查失败，请手动验证"
    fi

    # 检查PM2状态
    local pm2_status=$(safe_ssh 10 "pm2 list | grep '$PM2_APP_NAME' | grep 'online' | wc -l" || echo "0")
    if [[ "$pm2_status" == "1" ]]; then
        log_success "✓ PM2服务状态正常"
    else
        log_warning "PM2服务状态异常: $pm2_status 个实例在线"
    fi

    log_success "健康检查完成"
}

# 清理旧备份
cleanup_old_backups() {
    log_step "清理旧备份..."

    safe_ssh 60 "
        # 清理前端备份（保留最近5个）
        cd /var/www 2>/dev/null || exit 0
        ls -dt frontend-backup-* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true

        # 清理后端备份（保留最近5个）
        ls -dt sdszk-backend-backup-* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true

        echo 'Backup cleanup completed'
    " || log_warning "备份清理失败，不影响部署"

    log_success "备份清理完成"
}

# 生成部署报告
generate_report() {
    local deploy_type=$1
    local git_branch=$(git rev-parse --abbrev-ref HEAD)
    local git_commit=$(git rev-parse --short HEAD)

    cat << EOF

====================================
🎉 阿里云部署完成报告
====================================
部署类型: $deploy_type
部署ID: $DEPLOYMENT_ID
部署时间: $(date '+%Y-%m-%d %H:%M:%S')
Git分支: $git_branch
Git提交: $git_commit
====================================
服务器信息:
• 服务器: $SERVER_IP ($DOMAIN)
• 前端路径: $FRONTEND_DEPLOY_PATH
• 后端路径: $BACKEND_DEPLOY_PATH
• PM2应用: $PM2_APP_NAME
====================================
访问地址:
• 主站: https://$DOMAIN
• WWW: https://$WWW_DOMAIN
• 管理后台: https://$DOMAIN/admin
• API健康检查: https://$DOMAIN/api/health
====================================
管理命令:
• 查看后端日志: ssh $SERVER_USER@$SERVER_IP "pm2 logs $PM2_APP_NAME"
• 重启后端: ssh $SERVER_USER@$SERVER_IP "pm2 restart $PM2_APP_NAME"
• 服务器状态: ssh $SERVER_USER@$SERVER_IP "pm2 status"
====================================

EOF
}

# 显示使用帮助
show_help() {
    cat << EOF
阿里云统一部署管理器 v3.0

用法: $0 [选项]

选项:
  frontend, -f     仅部署前端
  backend, -b      仅部署后端
  fullstack, -a    部署前端和后端（默认）
  help, -h         显示此帮助信息

示例:
  $0                    # 全栈部署
  $0 frontend           # 仅前端部署
  $0 backend            # 仅后端部署
  $0 -a                 # 全栈部署

注意事项:
• 部署前请确保代码已提交到Git
• 生产环境配置文件必须存在
• 确保服务器SSH密钥已配置
• 建议在部署前备份重要数据

EOF
}

# 主函数
main() {
    local deploy_type="fullstack"

    # 参数解析
    case "${1:-}" in
        "frontend"|"-f")
            deploy_type="frontend"
            ;;
        "backend"|"-b")
            deploy_type="backend"
            ;;
        "fullstack"|"-a"|"")
            deploy_type="fullstack"
            ;;
        "help"|"-h"|"--help")
            show_help
            exit 0
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac

    log_header "阿里云统一部署管理器 v3.0 - 部署类型: $deploy_type"
    log_info "部署ID: $DEPLOYMENT_ID"

    # 初始化
    mkdir -p "$TEMP_DIR"
    check_deployment_lock
    preflight_check

    # 根据部署类型执行相应操作
    case "$deploy_type" in
        "frontend")
            build_frontend
            deploy_frontend
            reload_nginx
            ;;
        "backend")
            build_backend
            deploy_backend
            ;;
        "fullstack")
            build_frontend
            build_backend
            deploy_frontend
            deploy_backend
            reload_nginx
            ;;
    esac

    # 通用后续操作
    health_check
    cleanup_old_backups
    generate_report "$deploy_type"

    log_success "🎉 $deploy_type 部署成功完成！"
}

# 执行主函数
main "$@"
