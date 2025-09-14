#!/bin/bash

# 前端自动化部署脚本 - 安全性增强版
# 专门用于部署前端静态文件到生产服务器（阿里云环境）
# 版本: 2.0 - 增强安全性和可靠性

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 配置变量
SERVER_USER="root"
SERVER_IP="60.205.124.67"
DEPLOY_PATH="/var/www/frontend"
DOMAIN="horsduroot.com"
WWW_DOMAIN="www.horsduroot.com"
SSH_TIMEOUT=15
HEALTH_CHECK_TIMEOUT=10
HEALTH_CHECK_RETRIES=5

# 全局变量
DEPLOYMENT_ID="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="/tmp/frontend-backup-${DEPLOYMENT_ID}"
LOCAL_BUILD_DIR="dist"
DEPLOYMENT_LOCK_FILE="/tmp/frontend-deploy.lock"
ROLLBACK_INFO_FILE="/tmp/frontend-rollback-${DEPLOYMENT_ID}.info"

# 显示带颜色和时间戳的消息
log_with_timestamp() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

echo_success() {
    log_with_timestamp "${GREEN}✅ $1${NC}"
}

echo_error() {
    log_with_timestamp "${RED}❌ $1${NC}"
}

echo_warning() {
    log_with_timestamp "${YELLOW}⚠️ $1${NC}"
}

echo_info() {
    log_with_timestamp "${BLUE}ℹ️ $1${NC}"
}

echo_step() {
    log_with_timestamp "${PURPLE}🔄 $1${NC}"
}

# 清理函数
cleanup() {
    echo_info "执行清理操作..."
    rm -f "$DEPLOYMENT_LOCK_FILE"
    # 保留备份文件用于可能的回滚操作
}

# 错误处理函数
handle_error() {
    local exit_code=$1
    local line_number=$2
    echo_error "部署失败！错误代码: $exit_code，行号: $line_number"
    echo_error "开始执行回滚操作..."
    rollback_deployment
    cleanup
    exit $exit_code
}

# 设置错误处理
set -e
trap 'handle_error $? $LINENO' ERR
trap cleanup EXIT

# 检查部署锁
check_deployment_lock() {
    if [[ -f "$DEPLOYMENT_LOCK_FILE" ]]; then
        local lock_pid=$(cat "$DEPLOYMENT_LOCK_FILE")
        if kill -0 "$lock_pid" 2>/dev/null; then
            echo_error "检测到另一个部署进程正在运行 (PID: $lock_pid)"
            echo_error "如果确认没有其他部署在进行，请删除锁文件: $DEPLOYMENT_LOCK_FILE"
            exit 1
        else
            echo_warning "发现过期的锁文件，正在清理..."
            rm -f "$DEPLOYMENT_LOCK_FILE"
        fi
    fi

    # 创建新的部署锁
    echo $$ > "$DEPLOYMENT_LOCK_FILE"
    echo_success "获取部署锁成功 (PID: $$)"
}

# Pre-flight 检查
preflight_check() {
    echo_step "执行 Pre-flight 检查..."

    # 检查必要工具
    local required_tools=("node" "npm" "rsync" "ssh" "curl" "git")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            echo_error "必需工具未安装: $tool"
            exit 1
        fi
    done
    echo_success "必需工具检查通过"

    # 检查Node.js版本
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $node_version -lt 16 ]]; then
        echo_error "Node.js版本过低，需要16+，当前版本: $(node --version)"
        exit 1
    fi
    echo_success "Node.js版本检查通过: $(node --version)"

    # 检查网络连接
    if ! curl -f -s --max-time 5 "https://www.npmjs.com" > /dev/null; then
        echo_warning "NPM registry连接可能有问题，但继续部署..."
    fi

    # 检查SSH连接
    echo_info "测试SSH连接到服务器..."
    if ! ssh -o ConnectTimeout=$SSH_TIMEOUT -o BatchMode=yes -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" exit 2>/dev/null; then
        echo_error "无法连接到服务器 $SERVER_USER@$SERVER_IP，请检查SSH配置"
        exit 1
    fi
    echo_success "SSH连接测试通过"

    # 检查Git状态
    if ! git diff-index --quiet HEAD --; then
        echo_warning "检测到未提交的更改，建议先提交代码再部署"

        # 支持非交互式部署
        if [[ -n "$CI" || -n "$FORCE_DEPLOY" || ! -t 0 ]]; then
            echo_info "非交互式环境，自动继续部署"
        else
            read -p "是否继续部署? [y/N]: " CONTINUE_DEPLOY
            if [[ ! "$CONTINUE_DEPLOY" =~ ^[Yy]$ ]]; then
                echo_info "部署已取消"
                exit 0
            fi
        fi
    fi

    # 记录Git信息
    local git_branch=$(git rev-parse --abbrev-ref HEAD)
    local git_commit=$(git rev-parse --short HEAD)
    echo_info "当前分支: $git_branch"
    echo_info "当前提交: $git_commit"

    echo_success "Pre-flight 检查完成"
}

# 构建前端项目
build_frontend() {
    echo_step "开始构建前端项目..."

    # 清理之前的构建
    if [[ -d "$LOCAL_BUILD_DIR" ]]; then
        echo_info "清理之前的构建文件..."
        rm -rf "$LOCAL_BUILD_DIR"
    fi

    # 安装依赖
    echo_info "安装项目依赖..."
    if ! npm install --legacy-peer-deps; then
        echo_error "依赖安装失败"
        exit 1
    fi

    # 构建项目
    echo_info "使用配置: .env.aliyun 和 vite.config.aliyun.ts"
    if ! npm run build:aliyun; then
        echo_error "前端构建失败"
        exit 1
    fi

    # 验证构建结果
    if [[ ! -d "$LOCAL_BUILD_DIR" ]]; then
        echo_error "构建失败！$LOCAL_BUILD_DIR 目录不存在"
        exit 1
    fi

    # 检查构建文件
    local build_size=$(du -sh "$LOCAL_BUILD_DIR" | cut -f1)
    local file_count=$(find "$LOCAL_BUILD_DIR" -type f | wc -l)

    if [[ $file_count -lt 5 ]]; then
        echo_error "构建文件数量异常少 ($file_count 个文件)，可能构建不完整"
        exit 1
    fi

    # 检查关键文件
    local critical_files=("index.html")
    for file in "${critical_files[@]}"; do
        if [[ ! -f "$LOCAL_BUILD_DIR/$file" ]]; then
            echo_error "关键文件缺失: $file"
            exit 1
        fi
    done

    echo_success "构建完成 - 大小: $build_size, 文件数: $file_count"
}

# 创建服务器端备份
create_server_backup() {
    echo_step "创建服务器端备份..."

    # 检查远程目录是否存在
    if ssh "$SERVER_USER@$SERVER_IP" "[ ! -d '$DEPLOY_PATH' ]"; then
        echo_info "远程部署目录不存在，跳过备份"
        return 0
    fi

    # 创建备份
    if ssh "$SERVER_USER@$SERVER_IP" "cp -r '$DEPLOY_PATH' '$BACKUP_DIR'"; then
        echo_success "服务器端备份创建成功: $BACKUP_DIR"

        # 记录回滚信息
        cat > "$ROLLBACK_INFO_FILE" << EOF
BACKUP_DIR=$BACKUP_DIR
DEPLOY_PATH=$DEPLOY_PATH
SERVER_USER=$SERVER_USER
SERVER_IP=$SERVER_IP
DEPLOYMENT_ID=$DEPLOYMENT_ID
BACKUP_TIME=$(date '+%Y-%m-%d %H:%M:%S')
EOF
        echo_info "回滚信息已保存到: $ROLLBACK_INFO_FILE"
    else
        echo_error "服务器端备份创建失败"
        exit 1
    fi
}

# 部署到服务器
deploy_to_server() {
    echo_step "开始部署到服务器..."

    # 确保远程目录存在
    ssh "$SERVER_USER@$SERVER_IP" "mkdir -p '$DEPLOY_PATH'"

    # 使用rsync部署，添加更多安全选项
    echo_info "上传文件到服务器..."
    if rsync -avz --delete --timeout=300 \
        --exclude='.git*' \
        --exclude='node_modules' \
        --exclude='*.log' \
        --exclude='.DS_Store' \
        --progress \
        "$LOCAL_BUILD_DIR/" "$SERVER_USER@$SERVER_IP:$DEPLOY_PATH/"; then
        echo_success "文件上传完成"
    else
        echo_error "文件上传失败"
        exit 1
    fi

    # 设置文件权限
    echo_info "设置文件权限..."
    ssh "$SERVER_USER@$SERVER_IP" "
        find '$DEPLOY_PATH' -type f -exec chmod 644 {} \;
        find '$DEPLOY_PATH' -type d -exec chmod 755 {} \;

        # 尝试设置用户组，如果失败也不影响部署
        chown -R www-data:www-data '$DEPLOY_PATH' 2>/dev/null || \
        chown -R nginx:nginx '$DEPLOY_PATH' 2>/dev/null || \
        echo '注意: 无法设置www-data或nginx用户组，使用当前用户权限'
    "
    echo_success "文件权限设置完成"
}

# 重载Nginx配置
reload_nginx() {
    echo_step "重载Nginx配置..."

    # 测试Nginx配置
    if ssh "$SERVER_USER@$SERVER_IP" "nginx -t"; then
        echo_success "Nginx配置语法检查通过"
    else
        echo_error "Nginx配置语法错误"
        exit 1
    fi

    # 重载Nginx
    if ssh "$SERVER_USER@$SERVER_IP" "systemctl reload nginx"; then
        echo_success "Nginx重载完成"
    else
        echo_error "Nginx重载失败"
        exit 1
    fi

    # 等待Nginx完全重载
    sleep 2
}

# 健康检查
health_check() {
    echo_step "执行健康检查..."

    # 等待服务启动
    sleep 3

    local check_urls=(
        "https://$DOMAIN"
        "https://$WWW_DOMAIN"
        "https://$DOMAIN/api/health"
    )

    for url in "${check_urls[@]}"; do
        echo_info "检查: $url"
        local success=false

        for ((i=1; i<=HEALTH_CHECK_RETRIES; i++)); do
            if curl -f -s --max-time $HEALTH_CHECK_TIMEOUT "$url" > /dev/null; then
                echo_success "✓ $url 访问正常"
                success=true
                break
            else
                echo_warning "第 $i 次检查失败，重试中..."
                sleep 2
            fi
        done

        if [[ "$success" != true ]]; then
            echo_error "健康检查失败: $url"
            return 1
        fi
    done

    # 检查静态资源
    echo_info "检查静态资源..."
    local static_check_url="https://$DOMAIN/assets"
    if curl -f -s --max-time $HEALTH_CHECK_TIMEOUT "$static_check_url" > /dev/null 2>&1; then
        echo_success "静态资源访问正常"
    else
        echo_warning "静态资源检查失败，可能是正常现象（如果没有默认index文件）"
    fi

    echo_success "健康检查完成"
}

# 回滚部署
rollback_deployment() {
    echo_warning "开始执行回滚操作..."

    if [[ ! -f "$ROLLBACK_INFO_FILE" ]]; then
        echo_error "未找到回滚信息文件，无法自动回滚"
        echo_info "请手动检查服务器状态：ssh $SERVER_USER@$SERVER_IP"
        return 1
    fi

    # 加载回滚信息
    source "$ROLLBACK_INFO_FILE"

    # 检查备份是否存在
    if ssh "$SERVER_USER@$SERVER_IP" "[ ! -d '$BACKUP_DIR' ]"; then
        echo_error "备份目录不存在，无法回滚: $BACKUP_DIR"
        return 1
    fi

    echo_info "从备份恢复: $BACKUP_DIR -> $DEPLOY_PATH"
    if ssh "$SERVER_USER@$SERVER_IP" "
        rm -rf '$DEPLOY_PATH' &&
        mv '$BACKUP_DIR' '$DEPLOY_PATH' &&
        systemctl reload nginx
    "; then
        echo_success "回滚完成"

        # 验证回滚结果
        if curl -f -s --max-time $HEALTH_CHECK_TIMEOUT "https://$DOMAIN" > /dev/null; then
            echo_success "回滚后网站访问正常"
        else
            echo_error "回滚后网站访问异常，请手动检查"
        fi
    else
        echo_error "回滚失败，请手动处理"
        return 1
    fi
}

# 清理旧备份
cleanup_old_backups() {
    echo_step "清理旧备份文件..."

    # 保留最近5个备份
    ssh "$SERVER_USER@$SERVER_IP" "
        cd /tmp &&
        ls -t frontend-backup-* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true
    " || true

    echo_success "旧备份清理完成"
}

# 生成部署报告
generate_deployment_report() {
    echo_step "生成部署报告..."

    local git_branch=$(git rev-parse --abbrev-ref HEAD)
    local git_commit=$(git rev-parse --short HEAD)
    local build_size=$(du -sh "$LOCAL_BUILD_DIR" | cut -f1)
    local file_count=$(find "$LOCAL_BUILD_DIR" -type f | wc -l)

    cat << EOF

====================================
🎉 前端部署完成报告
====================================
部署ID: $DEPLOYMENT_ID
部署时间: $(date '+%Y-%m-%d %H:%M:%S')
Git分支: $git_branch
Git提交: $git_commit
构建大小: $build_size
文件数量: $file_count
====================================
服务器信息:
• 服务器: $SERVER_IP
• 部署路径: $DEPLOY_PATH
• 备份位置: $BACKUP_DIR
====================================
访问地址:
• 主站: https://$DOMAIN
• WWW: https://$WWW_DOMAIN
• 管理后台: https://$DOMAIN/admin
====================================
回滚信息:
如需回滚，请使用: $ROLLBACK_INFO_FILE
====================================

EOF
}

# 主函数
main() {
    echo_info "🚀 开始前端自动化部署 (安全增强版)..."
    echo_info "部署ID: $DEPLOYMENT_ID"

    # 执行部署步骤
    check_deployment_lock
    preflight_check
    build_frontend
    create_server_backup
    deploy_to_server
    reload_nginx
    health_check
    cleanup_old_backups

    # 生成报告
    generate_deployment_report

    echo_success "🎉 前端部署成功完成！"
}

# 执行主函数
main "$@"
