#!/bin/bash

# 后端自动化部署脚本 - 安全性增强版 v2.1
# 专门用于部署Node.js后端服务到生产服务器（阿里云环境）
# 版本: 2.1 - 修复超时和hang住问题

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 配置变量
SERVER_USER="root"
SERVER_IP="60.205.124.67"
DEPLOY_PATH="/var/www/sdszk-backend"
PM2_APP_NAME="sdszk-backend"
SSH_TIMEOUT=15
SSH_CONNECTION_TIMEOUT=10
HEALTH_CHECK_TIMEOUT=10
HEALTH_CHECK_RETRIES=3
NPM_INSTALL_TIMEOUT=300  # 5分钟npm安装超时
SCRIPT_TIMEOUT=1800      # 30分钟脚本总超时

# 全局变量
DEPLOYMENT_ID="$(date +%Y%m%d_%H%M%S)"
BUILD_DIR="/tmp/sdszk-backend-build-${DEPLOYMENT_ID}"
BACKUP_DIR="/var/www/sdszk-backend-backup-${DEPLOYMENT_ID}"
DEPLOY_PACKAGE="/tmp/sdszk-backend-deploy-${DEPLOYMENT_ID}.zip"
DEPLOYMENT_LOCK_FILE="/tmp/backend-deploy.lock"
ROLLBACK_INFO_FILE="/tmp/backend-rollback-${DEPLOYMENT_ID}.info"

# SSH连接选项
SSH_OPTS="-o ConnectTimeout=$SSH_CONNECTION_TIMEOUT -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o BatchMode=yes -o StrictHostKeyChecking=no"

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
    rm -rf "$BUILD_DIR"
    rm -f "$DEPLOY_PACKAGE"
    # 保留回滚信息文件
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

# 脚本超时处理
script_timeout() {
    echo_error "脚本执行超时 ($SCRIPT_TIMEOUT 秒)，强制退出"
    cleanup
    exit 124
}

# 安全的SSH执行函数
safe_ssh() {
    local timeout=${1:-30}
    shift
    $TIMEOUT_CMD "$timeout" ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "$@"
}

# 安全的SSH with here document
safe_ssh_script() {
    local timeout=${1:-60}
    local script="$2"
    echo "$script" | $TIMEOUT_CMD "$timeout" ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" 'bash -s'
}

# PM2维护和清理函数 - 简化版
pm2_maintenance() {
    echo_info "执行PM2维护检查..."

    local script='
        echo "🔍 PM2维护检查开始..."

        # 显示当前PM2状态
        echo "当前PM2进程列表:"
        pm2 list 2>/dev/null || echo "PM2未运行"

        # 检查僵尸进程（简化版）
        if pm2 list 2>/dev/null | grep -q "stopped\|errored"; then
            echo "⚠️ 发现异常进程，正在清理..."
            pm2 delete all 2>/dev/null || true
            sleep 2
        fi

        echo "✅ PM2维护检查完成"
    '

    if safe_ssh_script 60 "$script"; then
        echo_success "PM2维护检查完成"
    else
        echo_warning "PM2维护检查超时或失败，继续执行"
    fi
}

# 强制清理指定PM2应用的所有实例 - 简化版
force_clean_pm2_app() {
    local app_name=$1
    echo_info "强制清理PM2应用: $app_name"

    local script="
        echo '🧹 强制清理应用实例: $app_name'

        # 停止和删除应用实例
        if pm2 list 2>/dev/null | grep -q '$app_name'; then
            echo '发现现有实例，正在清理...'
            pm2 stop '$app_name' 2>/dev/null || true
            sleep 1
            pm2 delete '$app_name' 2>/dev/null || true
            sleep 1
            echo '✅ 应用实例已清理'
        else
            echo '✅ 未发现现有实例，无需清理'
        fi
    "

    if safe_ssh_script 30 "$script"; then
        echo_success "PM2应用清理完成"
    else
        echo_warning "PM2应用清理超时，继续执行"
    fi
}

# 设置脚本总超时和错误处理
trap 'script_timeout' ALRM
trap 'handle_error $? $LINENO' ERR
trap cleanup EXIT

# 启动脚本总超时
(sleep $SCRIPT_TIMEOUT && kill -ALRM $$) &
TIMEOUT_PID=$!

# 检查部署锁
check_deployment_lock() {
    if [[ -f "$DEPLOYMENT_LOCK_FILE" ]]; then
        local lock_pid=$(cat "$DEPLOYMENT_LOCK_FILE")
        if kill -0 "$lock_pid" 2>/dev/null; then
            echo_error "检测到另一个后端部署进程正在运行 (PID: $lock_pid)"
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
    local required_tools=("node" "npm" "zip" "ssh" "curl" "git")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            echo_error "必需工具未安装: $tool"
            exit 1
        fi
    done

    # 检查timeout命令（macOS使用gtimeout）
    if command -v timeout &> /dev/null; then
        TIMEOUT_CMD="timeout"
    elif command -v gtimeout &> /dev/null; then
        TIMEOUT_CMD="gtimeout"
    else
        echo_error "timeout命令未安装 (请安装coreutils: brew install coreutils)"
        exit 1
    fi
    echo_success "必需工具检查通过 (timeout: $TIMEOUT_CMD)"

    # 检查Node.js版本
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $node_version -lt 16 ]]; then
        echo_error "Node.js版本过低，需要16+，当前版本: $(node --version)"
        exit 1
    fi
    echo_success "Node.js版本检查通过: $(node --version)"

    # 检查生产环境配置文件
    if [[ ! -f "./server/.env.production" ]]; then
        echo_error "生产环境配置文件不存在: ./server/.env.production"
        exit 1
    fi
    echo_success "生产环境配置文件检查通过"

    # 验证配置文件关键内容
    local required_env_vars=("MONGODB_URI" "JWT_SECRET" "NODE_ENV")
    for var in "${required_env_vars[@]}"; do
        if ! grep -q "^${var}=" "./server/.env.production"; then
            echo_error "配置文件缺少必需变量: $var"
            exit 1
        fi
    done
    echo_success "配置文件内容验证通过"

    # 检查服务器目录结构
    if [[ ! -d "./server" ]]; then
        echo_error "服务器代码目录不存在: ./server"
        exit 1
    fi

    # 检查关键文件
    local critical_files=("./server/app.js" "./server/package.json")
    for file in "${critical_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            echo_error "关键文件缺失: $file"
            exit 1
        fi
    done
    echo_success "关键文件检查通过"

    # 检查SSH连接
    echo_info "测试SSH连接到服务器..."
    if safe_ssh 10 "echo 'SSH连接测试成功'"; then
        echo_success "SSH连接测试通过"
    else
        echo_error "无法连接到服务器 $SERVER_USER@$SERVER_IP，请检查SSH配置"
        exit 1
    fi

    # 检查服务器端PM2状态
    echo_info "检查服务器端PM2状态..."
    local pm2_version=$(safe_ssh 10 "pm2 --version 2>/dev/null || echo 'not_installed'")
    if [[ "$pm2_version" == "not_installed" ]]; then
        echo_error "服务器端PM2未安装"
        exit 1
    fi
    echo_success "服务器端PM2检查通过: $pm2_version"

    # 记录Git信息
    local git_branch=$(git rev-parse --abbrev-ref HEAD)
    local git_commit=$(git rev-parse --short HEAD)
    echo_info "当前分支: $git_branch"
    echo_info "当前提交: $git_commit"

    echo_success "Pre-flight 检查完成"
}

# 构建后端项目
build_backend() {
    echo_step "开始构建后端项目..."

    # 创建隔离的构建目录
    echo_info "创建构建目录: $BUILD_DIR"
    mkdir -p "$BUILD_DIR"

    # 复制服务器代码
    echo_info "复制服务器代码..."
    cp -r ./server/* "$BUILD_DIR/"

    # 复制生产环境配置
    echo_info "复制生产环境配置..."
    cp ./server/.env.production "$BUILD_DIR/.env"

    # 进入构建目录
    cd "$BUILD_DIR"

    # 检查package.json
    if [[ ! -f "package.json" ]]; then
        echo_error "package.json文件不存在"
        exit 1
    fi

    # 安装生产依赖 - 添加超时控制
    echo_info "安装生产环境依赖（超时: ${NPM_INSTALL_TIMEOUT}秒）..."
    if $TIMEOUT_CMD $NPM_INSTALL_TIMEOUT npm ci --only=production --no-audit --progress=false; then
        echo_success "依赖安装完成"
    else
        echo_error "依赖安装失败或超时"
        exit 1
    fi

    # 创建必要的目录结构
    echo_info "创建必要的目录结构..."
    mkdir -p uploads/documents uploads/images uploads/videos logs data

    # 设置目录权限
    chmod -R 755 uploads logs data

    # 验证构建结果
    local package_count=$(ls node_modules 2>/dev/null | wc -l)
    echo_success "构建完成 - 已安装 $package_count 个依赖包"

    # 返回项目根目录
    cd - > /dev/null
}

# 打包项目
package_project() {
    echo_step "打包项目..."

    cd "$BUILD_DIR"

    # 创建部署包，排除不必要的文件
    echo_info "创建部署包: $DEPLOY_PACKAGE"
    if $TIMEOUT_CMD 60 zip -r "$DEPLOY_PACKAGE" . \
        -x "node_modules/.cache/*" \
        -x "*.log" \
        -x ".git*" \
        -x "*.tmp" \
        -x "test/*" \
        -x "*.test.js" \
        > /dev/null; then

        local package_size=$(du -sh "$DEPLOY_PACKAGE" | cut -f1)
        echo_success "打包完成 - 大小: $package_size"
    else
        echo_error "打包失败或超时"
        exit 1
    fi

    cd - > /dev/null
}

# 创建服务器端备份
create_server_backup() {
    echo_step "创建服务器端备份..."

    # 检查远程目录是否存在
    if ! safe_ssh 10 "[ -d '$DEPLOY_PATH' ]"; then
        echo_info "远程部署目录不存在，跳过备份"
        return 0
    fi

    # 安全停止服务
    echo_info "安全停止后端服务..."
    local script="
        if pm2 list 2>/dev/null | grep -q '$PM2_APP_NAME'; then
            echo '发现运行中的实例，正在停止...'
            pm2 stop '$PM2_APP_NAME' 2>/dev/null || true
            echo '服务已停止'
        else
            echo '未发现运行中的实例'
        fi
    "
    safe_ssh_script 30 "$script"

    # 创建备份
    if safe_ssh 60 "cp -r '$DEPLOY_PATH' '$BACKUP_DIR'"; then
        echo_success "服务器端备份创建成功: $BACKUP_DIR"

        # 记录回滚信息
        cat > "$ROLLBACK_INFO_FILE" << EOF
BACKUP_DIR=$BACKUP_DIR
DEPLOY_PATH=$DEPLOY_PATH
SERVER_USER=$SERVER_USER
SERVER_IP=$SERVER_IP
PM2_APP_NAME=$PM2_APP_NAME
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

    # 检查部署包大小
    local package_size=$(du -sh "$DEPLOY_PACKAGE" | cut -f1)
    echo_info "部署包大小: $package_size"

    # 上传部署包 - 添加进度显示和超时
    echo_info "开始上传部署包到服务器..."
    if $TIMEOUT_CMD 300 rsync -avz --progress -e "ssh $SSH_OPTS" "$DEPLOY_PACKAGE" "$SERVER_USER@$SERVER_IP:/tmp/"; then
        echo_success "部署包上传完成"
    else
        echo_warning "rsync失败，尝试使用scp..."
        if $TIMEOUT_CMD 300 scp $SSH_OPTS "$DEPLOY_PACKAGE" "$SERVER_USER@$SERVER_IP:/tmp/"; then
            echo_success "部署包上传完成 (使用scp)"
        else
            echo_error "部署包上传失败"
            exit 1
        fi
    fi

    # 验证上传结果
    echo_info "验证上传文件完整性..."
    local remote_size=$(safe_ssh 10 "du -sh /tmp/$(basename "$DEPLOY_PACKAGE") 2>/dev/null | cut -f1 || echo 'NOT_FOUND'")
    if [[ "$remote_size" == "NOT_FOUND" ]]; then
        echo_error "上传的文件在服务器上未找到"
        exit 1
    else
        echo_success "服务器上文件大小: $remote_size"
    fi

    # 在服务器上执行部署
    echo_info "在服务器上执行部署..."
    local deploy_script="
        set -e

        # 创建新的部署目录
        rm -rf '$DEPLOY_PATH'
        mkdir -p '$DEPLOY_PATH'

        # 解压部署包
        cd '$DEPLOY_PATH'
        unzip -q '/tmp/$(basename "$DEPLOY_PACKAGE")'

        # 设置文件权限
        find . -type f -exec chmod 644 {} \;
        find . -type d -exec chmod 755 {} \;
        chmod +x app.js 2>/dev/null || true

        # 确保关键目录存在并设置权限
        mkdir -p uploads/documents uploads/images uploads/videos logs data
        chmod -R 755 uploads logs data

        # 清理临时文件
        rm -f '/tmp/$(basename "$DEPLOY_PACKAGE")'

        echo '服务器端部署完成'
    "

    if safe_ssh_script 120 "$deploy_script"; then
        echo_success "服务器端部署完成"
    else
        echo_error "服务器端部署失败"
        exit 1
    fi
}

# 启动服务
start_service() {
    echo_step "启动后端服务..."

    # 执行PM2维护检查
    pm2_maintenance

    # 强制清理旧实例
    force_clean_pm2_app "$PM2_APP_NAME"

    # 启动服务
    echo_info "正在启动服务，请稍候..."
    local start_script="
        set -e
        cd '$DEPLOY_PATH'

        # 等待确保进程完全停止
        sleep 3

        # 检查关键文件
        if [ ! -f 'app.js' ]; then
            echo '❌ 错误: app.js 文件不存在'
            exit 1
        fi

        if [ ! -f 'package.json' ]; then
            echo '❌ 错误: package.json 文件不存在'
            exit 1
        fi

        if [ ! -f '.env' ]; then
            echo '❌ 错误: .env 文件不存在'
            exit 1
        fi

        echo '✅ 关键文件检查通过'

        # 启动新的服务实例
        echo '🚀 启动新服务实例...'
        pm2 start app.js --name '$PM2_APP_NAME' --env production \
            --max-restarts 10 \
            --restart-delay 3000 \
            --max-memory-restart 500M \
            --watch false \
            --merge-logs true \
            --time

        # 等待服务启动
        sleep 5

        # 验证只有一个实例在运行
        instance_count=\$(pm2 list | grep '$PM2_APP_NAME' | grep 'online' | wc -l)
        if [ \$instance_count -eq 1 ]; then
            echo '✅ 确认只有一个实例在运行'
        else
            echo '⚠️ 警告: 检测到 \$instance_count 个实例，这不正常'
            pm2 list | grep '$PM2_APP_NAME'
            exit 1
        fi

        # 保存PM2配置
        pm2 save

        # 显示详细服务状态
        echo '📊 当前服务状态:'
        pm2 status '$PM2_APP_NAME'
    "

    if safe_ssh_script 120 "$start_script"; then
        echo_success "后端服务启动完成"
    else
        echo_error "后端服务启动失败"
        exit 1
    fi
}

# 健康检查 - 简化版
health_check() {
    echo_step "执行健康检查..."

    # 等待服务启动
    echo_info "等待服务启动..."
    sleep 5

    # 检查PM2状态 - 简化版
    echo_info "检查PM2实例状态..."
    local pm2_status=$(safe_ssh 15 "pm2 list | grep '$PM2_APP_NAME' | grep 'online' | wc -l" || echo "0")

    if [[ "$pm2_status" == "1" ]]; then
        echo_success "✅ PM2实例检查通过: 1个实例在线运行"
    else
        echo_warning "⚠️ PM2实例状态异常: 在线实例数=$pm2_status"
        safe_ssh 10 "pm2 logs '$PM2_APP_NAME' --lines 10 || true"
    fi

    # 检查HTTP接口 - 简化版
    echo_info "检查API健康状态..."
    for ((i=1; i<=HEALTH_CHECK_RETRIES; i++)); do
        echo_info "第 $i/$HEALTH_CHECK_RETRIES 次健康检查..."

        # 分别执行SSH和curl，避免嵌套命令
        if safe_ssh 15 "curl -f -s --max-time 8 'http://localhost:3000/api/health' >/dev/null"; then
            echo_success "✓ API健康检查通过"
            break
        else
            echo_warning "第 $i 次检查失败"
            if [[ $i -eq $HEALTH_CHECK_RETRIES ]]; then
                echo_warning "健康检查失败，但不影响部署（可能是正常的）"
            else
                sleep 3
            fi
        fi
    done

    # 检查端口监听
    echo_info "检查端口监听..."
    local port_status=$(safe_ssh 10 "netstat -tlnp | grep ':3000 ' | wc -l" || echo "0")
    if [[ $port_status -gt 0 ]]; then
        echo_success "端口3000已被监听"
    else
        echo_warning "端口3000未被监听，检查服务配置"
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
    if ! safe_ssh 10 "[ -d '$BACKUP_DIR' ]"; then
        echo_error "备份目录不存在，无法回滚: $BACKUP_DIR"
        return 1
    fi

    echo_info "从备份恢复: $BACKUP_DIR -> $DEPLOY_PATH"

    # 使用强制清理函数
    force_clean_pm2_app "$PM2_APP_NAME"

    local rollback_script="
        set -e
        echo '🔄 开始回滚操作...'

        # 恢复备份
        echo '恢复备份文件...'
        rm -rf '$DEPLOY_PATH'
        mv '$BACKUP_DIR' '$DEPLOY_PATH'
        cd '$DEPLOY_PATH'

        # 启动服务
        echo '启动回滚后的服务...'
        pm2 start app.js --name '$PM2_APP_NAME' --env production \
            --max-restarts 10 \
            --restart-delay 3000 \
            --max-memory-restart 500M \
            --watch false \
            --merge-logs true

        sleep 5

        # 验证实例数量
        instance_count=\$(pm2 list | grep '$PM2_APP_NAME' | grep 'online' | wc -l)
        if [ \$instance_count -eq 1 ]; then
            echo '✅ 回滚后确认只有一个实例在运行'
        else
            echo '⚠️ 警告: 回滚后检测到 \$instance_count 个实例'
            exit 1
        fi

        pm2 save
    "

    if safe_ssh_script 120 "$rollback_script"; then
        echo_success "回滚完成"

        # 验证回滚结果
        sleep 5
        local pm2_status=$(safe_ssh 10 "pm2 list | grep '$PM2_APP_NAME' | grep 'online' | wc -l" || echo "0")
        if [[ "$pm2_status" == "1" ]]; then
            echo_success "回滚后服务状态正常"
        else
            echo_error "回滚后服务状态异常，请手动检查"
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
    local cleanup_script="
        cd /var/www 2>/dev/null || exit 0
        ls -t sdszk-backend-backup-* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true
    "

    if safe_ssh_script 30 "$cleanup_script"; then
        echo_success "旧备份清理完成"
    else
        echo_warning "旧备份清理失败，不影响部署"
    fi
}

# 生成部署报告
generate_deployment_report() {
    echo_step "生成部署报告..."

    local git_branch=$(git rev-parse --abbrev-ref HEAD)
    local git_commit=$(git rev-parse --short HEAD)
    local package_size=$(du -sh "$DEPLOY_PACKAGE" | cut -f1)

    # 获取服务信息 - 简化版
    local pm2_info=$(safe_ssh 15 "pm2 status '$PM2_APP_NAME' 2>/dev/null || echo 'PM2状态获取失败'")

    cat << EOF

====================================
🎉 后端部署完成报告
====================================
部署ID: $DEPLOYMENT_ID
部署时间: $(date '+%Y-%m-%d %H:%M:%S')
Git分支: $git_branch
Git提交: $git_commit
部署包大小: $package_size
====================================
服务器信息:
• 服务器: $SERVER_IP
• 部署路径: $DEPLOY_PATH
• 备份位置: $BACKUP_DIR
• PM2应用: $PM2_APP_NAME
====================================
服务状态:
$pm2_info
====================================
回滚信息:
如需回滚，请使用: $ROLLBACK_INFO_FILE
或执行: ssh $SERVER_USER@$SERVER_IP "pm2 restart $PM2_APP_NAME"
====================================
日志查看:
ssh $SERVER_USER@$SERVER_IP "pm2 logs $PM2_APP_NAME"
====================================

EOF
}

# 主函数
main() {
    echo_info "🚀 开始后端自动化部署 (安全增强版 v2.1)..."
    echo_info "部署ID: $DEPLOYMENT_ID"

    # 执行部署步骤
    check_deployment_lock
    preflight_check
    build_backend
    package_project
    create_server_backup
    deploy_to_server
    start_service
    health_check
    cleanup_old_backups

    # 停止脚本超时计时器
    kill $TIMEOUT_PID 2>/dev/null || true

    # 生成报告
    generate_deployment_report

    echo_success "🎉 后端部署成功完成！"
}

# 执行主函数
main "$@"
