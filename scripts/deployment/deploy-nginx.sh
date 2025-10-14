#!/bin/bash

# Nginx配置部署脚本 - 安全性增强版
# 专门用于部署Nginx配置文件到生产服务器（阿里云环境）
# 版本: 2.0 - 增强安全性和可靠性

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 配置变量
SERVER_USER="root"
SERVER_IP="8.141.113.21"
LOCAL_CONFIG_PATH="./nginx-ssl.conf"
REMOTE_CONFIG_PATH="/etc/nginx/sites-available/sdszk"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/sdszk"
DOMAIN="www.sdszk.cn"
WWW_DOMAIN="www.www.sdszk.cn"
SSH_TIMEOUT=15
HEALTH_CHECK_TIMEOUT=10
HEALTH_CHECK_RETRIES=3

# 全局变量
DEPLOYMENT_ID="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="/tmp/nginx-backup-${DEPLOYMENT_ID}"
DEPLOYMENT_LOCK_FILE="/tmp/nginx-deploy.lock"
ROLLBACK_INFO_FILE="/tmp/nginx-rollback-${DEPLOYMENT_ID}.info"

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
}

# 错误处理函数
handle_error() {
    local exit_code=$1
    local line_number=$2
    echo_error "Nginx配置部署失败！错误代码: $exit_code，行号: $line_number"
    echo_error "开始执行回滚操作..."
    rollback_nginx_config
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
            echo_error "检测到另一个Nginx部署进程正在运行 (PID: $lock_pid)"
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
    local required_tools=("ssh" "scp" "curl" "openssl")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            echo_error "必需工具未安装: $tool"
            exit 1
        fi
    done
    echo_success "必需工具检查通过"

    # 检查本地配置文件
    if [[ ! -f "$LOCAL_CONFIG_PATH" ]]; then
        echo_error "本地Nginx配置文件不存在: $LOCAL_CONFIG_PATH"
        exit 1
    fi
    echo_success "本地配置文件检查通过"

    # 验证本地配置文件语法（如果nginx在本地可用）
    if command -v nginx &> /dev/null; then
        echo_info "验证本地Nginx配置语法..."
        # 创建临时测试配置
        local temp_config="/tmp/nginx-test-${DEPLOYMENT_ID}.conf"
        cp "$LOCAL_CONFIG_PATH" "$temp_config"

        # 简单的语法检查（基本语法）
        if grep -q "server_name.*$DOMAIN" "$temp_config" &&
           grep -q "ssl_certificate" "$temp_config" &&
           grep -q "location.*/" "$temp_config"; then
            echo_success "配置文件基本语法检查通过"
        else
            echo_warning "配置文件基本语法检查有警告，请仔细检查"
        fi
        rm -f "$temp_config"
    else
        echo_info "本地nginx不可用，跳过本地语法检查"
    fi

    # 检查SSH连接
    echo_info "测试SSH连接到服务器..."
    if ! ssh -o ConnectTimeout=$SSH_TIMEOUT -o BatchMode=yes -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" exit 2>/dev/null; then
        echo_error "无法连接到服务器 $SERVER_USER@$SERVER_IP，请检查SSH配置"
        exit 1
    fi
    echo_success "SSH连接测试通过"

    # 检查服务器端Nginx状态
    echo_info "检查服务器端Nginx状态..."
    local nginx_status=$(ssh "$SERVER_USER@$SERVER_IP" "systemctl is-active nginx 2>/dev/null || echo 'inactive'")
    if [[ "$nginx_status" != "active" ]]; then
        echo_error "服务器端Nginx服务未运行状态: $nginx_status"
        exit 1
    fi
    echo_success "服务器端Nginx服务运行正常"

    echo_success "Pre-flight 检查完成"
}

# 验证配置文件内容
validate_config_content() {
    echo_step "验证配置文件内容..."

    # 检查关键配置项
    local config_checks=(
        "server_name.*$DOMAIN:域名配置"
        "ssl_certificate.*:SSL证书路径"
        "ssl_certificate_key.*:SSL私钥路径"
        "location.*/:根路径配置"
    )

    for check in "${config_checks[@]}"; do
        local pattern="${check%:*}"
        local description="${check#*:}"

        if grep -q "$pattern" "$LOCAL_CONFIG_PATH"; then
            echo_success "✓ $description 检查通过"
        else
            echo_warning "⚠ $description 检查失败，请确认配置正确"
        fi
    done

    # 检查配置文件大小
    local config_size=$(wc -c < "$LOCAL_CONFIG_PATH")
    if [[ $config_size -lt 100 ]]; then
        echo_error "配置文件过小 ($config_size 字节)，可能不完整"
        exit 1
    elif [[ $config_size -gt 50000 ]]; then
        echo_warning "配置文件较大 ($config_size 字节)，请确认内容正确"
    fi

    echo_success "配置文件内容验证完成"
}

# 检查SSL证书
check_ssl_certificates() {
    echo_step "检查SSL证书状态..."

    # 从配置文件中提取证书路径
    local cert_path=$(grep "ssl_certificate " "$LOCAL_CONFIG_PATH" | head -1 | awk '{print $2}' | tr -d ';')
    local key_path=$(grep "ssl_certificate_key " "$LOCAL_CONFIG_PATH" | head -1 | awk '{print $2}' | tr -d ';')

    if [[ -z "$cert_path" || -z "$key_path" ]]; then
        echo_warning "无法从配置文件中提取证书路径，跳过证书检查"
        return 0
    fi

    echo_info "证书路径: $cert_path"
    echo_info "私钥路径: $key_path"

    # 检查服务器端证书文件是否存在
    if ssh "$SERVER_USER@$SERVER_IP" "[ -f '$cert_path' ]"; then
        echo_success "SSL证书文件存在"

        # 检查证书有效期
        local cert_info=$(ssh "$SERVER_USER@$SERVER_IP" "openssl x509 -in '$cert_path' -noout -dates 2>/dev/null || echo 'FAILED'")
        if [[ "$cert_info" != "FAILED" ]]; then
            echo_info "证书信息: $cert_info"

            # 检查证书是否即将过期（30天内）
            local expire_date=$(ssh "$SERVER_USER@$SERVER_IP" "openssl x509 -in '$cert_path' -noout -enddate 2>/dev/null | cut -d= -f2")
            if [[ -n "$expire_date" ]]; then
                local expire_timestamp=$(ssh "$SERVER_USER@$SERVER_IP" "date -d '$expire_date' +%s 2>/dev/null || echo '0'")
                local current_timestamp=$(date +%s)
                local days_until_expire=$(( (expire_timestamp - current_timestamp) / 86400 ))

                if [[ $days_until_expire -lt 30 ]] && [[ $days_until_expire -gt 0 ]]; then
                    echo_warning "SSL证书将在 $days_until_expire 天后过期，请注意续期"
                elif [[ $days_until_expire -le 0 ]]; then
                    echo_error "SSL证书已过期！"
                    exit 1
                else
                    echo_success "SSL证书有效期正常 ($days_until_expire 天)"
                fi
            fi
        else
            echo_warning "无法读取证书信息"
        fi
    else
        echo_error "SSL证书文件不存在: $cert_path"
        exit 1
    fi

    # 检查私钥文件
    if ssh "$SERVER_USER@$SERVER_IP" "[ -f '$key_path' ]"; then
        echo_success "SSL私钥文件存在"
    else
        echo_error "SSL私钥文件不存在: $key_path"
        exit 1
    fi

    echo_success "SSL证书检查完成"
}

# 创建配置备份
create_config_backup() {
    echo_step "创建配置文件备份..."

    # 检查远程配置文件是否存在
    if ssh "$SERVER_USER@$SERVER_IP" "[ ! -f '$REMOTE_CONFIG_PATH' ]"; then
        echo_info "远程配置文件不存在，跳过备份"
        return 0
    fi

    # 创建备份目录
    ssh "$SERVER_USER@$SERVER_IP" "mkdir -p '$BACKUP_DIR'"

    # 备份当前配置
    if ssh "$SERVER_USER@$SERVER_IP" "cp '$REMOTE_CONFIG_PATH' '$BACKUP_DIR/nginx.conf.backup'"; then
        echo_success "配置文件备份创建成功: $BACKUP_DIR/nginx.conf.backup"

        # 记录回滚信息
        cat > "$ROLLBACK_INFO_FILE" << EOF
BACKUP_DIR=$BACKUP_DIR
REMOTE_CONFIG_PATH=$REMOTE_CONFIG_PATH
NGINX_ENABLED_PATH=$NGINX_ENABLED_PATH
SERVER_USER=$SERVER_USER
SERVER_IP=$SERVER_IP
DEPLOYMENT_ID=$DEPLOYMENT_ID
BACKUP_TIME=$(date '+%Y-%m-%d %H:%M:%S')
EOF
        echo_info "回滚信息已保存到: $ROLLBACK_INFO_FILE"
    else
        echo_error "配置文件备份创建失败"
        exit 1
    fi
}

# 部署配置文件
deploy_config() {
    echo_step "部署Nginx配置文件..."

    # 上传新配置文件
    echo_info "上传配置文件到服务器..."
    if scp -o ConnectTimeout=$SSH_TIMEOUT "$LOCAL_CONFIG_PATH" "$SERVER_USER@$SERVER_IP:$REMOTE_CONFIG_PATH"; then
        echo_success "配置文件上传完成"
    else
        echo_error "配置文件上传失败"
        exit 1
    fi

    # 设置配置文件权限
    ssh "$SERVER_USER@$SERVER_IP" "
        chmod 644 '$REMOTE_CONFIG_PATH'
        chown root:root '$REMOTE_CONFIG_PATH'
    "

    # 确保配置文件已启用（符号链接存在）
    echo_info "检查配置文件启用状态..."
    if ssh "$SERVER_USER@$SERVER_IP" "[ ! -L '$NGINX_ENABLED_PATH' ]"; then
        echo_info "创建符号链接以启用站点..."
        ssh "$SERVER_USER@$SERVER_IP" "ln -sf '$REMOTE_CONFIG_PATH' '$NGINX_ENABLED_PATH'"
        echo_success "站点符号链接创建完成"
    else
        echo_success "站点已启用"
    fi
}

# 测试配置并重载
test_and_reload_nginx() {
    echo_step "测试配置并重载Nginx..."

    # 测试Nginx配置语法
    echo_info "执行Nginx配置语法检查..."
    if ssh "$SERVER_USER@$SERVER_IP" "nginx -t"; then
        echo_success "Nginx配置语法检查通过"
    else
        echo_error "Nginx配置语法检查失败"
        exit 1
    fi

    # 测试配置加载
    echo_info "测试配置加载..."
    if ssh "$SERVER_USER@$SERVER_IP" "nginx -T >/dev/null 2>&1"; then
        echo_success "配置加载测试通过"
    else
        echo_warning "配置加载测试有警告，但继续执行重载"
    fi

    # 重载Nginx配置
    echo_info "重载Nginx配置..."
    if ssh "$SERVER_USER@$SERVER_IP" "systemctl reload nginx"; then
        echo_success "Nginx配置重载完成"
    else
        echo_error "Nginx配置重载失败"
        exit 1
    fi

    # 等待重载完成
    sleep 3

    # 检查Nginx服务状态
    local nginx_status=$(ssh "$SERVER_USER@$SERVER_IP" "systemctl is-active nginx")
    if [[ "$nginx_status" == "active" ]]; then
        echo_success "Nginx服务状态正常"
    else
        echo_error "Nginx服务状态异常: $nginx_status"
        exit 1
    fi
}

# 健康检查
health_check() {
    echo_step "执行健康检查..."

    # 等待服务完全重载
    sleep 2

    # 检查网站访问
    local check_urls=(
        "https://$DOMAIN"
        "https://$WWW_DOMAIN"
    )

    for url in "${check_urls[@]}"; do
        echo_info "检查网站访问: $url"
        local success=false

        for ((i=1; i<=HEALTH_CHECK_RETRIES; i++)); do
            local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $HEALTH_CHECK_TIMEOUT "$url" 2>/dev/null || echo "000")

            if [[ "$response_code" =~ ^[23] ]]; then
                echo_success "✓ $url 访问正常 (HTTP $response_code)"
                success=true
                break
            else
                echo_warning "第 $i 次检查失败 (HTTP $response_code)，重试中..."
                sleep 3
            fi
        done

        if [[ "$success" != true ]]; then
            echo_error "网站访问检查失败: $url"
            return 1
        fi
    done

    # 检查SSL证书
    echo_info "检查SSL证书可访问性..."
    if timeout $HEALTH_CHECK_TIMEOUT openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" </dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
        echo_success "SSL证书验证通过"
    else
        echo_warning "SSL证书验证失败或有警告"
    fi

    # 检查HTTP到HTTPS重定向
    echo_info "检查HTTP到HTTPS重定向..."
    local redirect_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $HEALTH_CHECK_TIMEOUT "http://$DOMAIN" 2>/dev/null || echo "000")
    if [[ "$redirect_code" == "301" || "$redirect_code" == "302" ]]; then
        echo_success "HTTP到HTTPS重定向正常 (HTTP $redirect_code)"
    else
        echo_warning "HTTP重定向检查异常 (HTTP $redirect_code)"
    fi

    echo_success "健康检查完成"
}

# 回滚Nginx配置
rollback_nginx_config() {
    echo_warning "开始执行Nginx配置回滚..."

    if [[ ! -f "$ROLLBACK_INFO_FILE" ]]; then
        echo_error "未找到回滚信息文件，无法自动回滚"
        echo_info "请手动检查Nginx配置：ssh $SERVER_USER@$SERVER_IP"
        return 1
    fi

    # 加载回滚信息
    source "$ROLLBACK_INFO_FILE"

    # 检查备份是否存在
    if ssh "$SERVER_USER@$SERVER_IP" "[ ! -f '$BACKUP_DIR/nginx.conf.backup' ]"; then
        echo_error "备份配置文件不存在，无法回滚: $BACKUP_DIR/nginx.conf.backup"
        return 1
    fi

    echo_info "从备份恢复配置文件..."
    if ssh "$SERVER_USER@$SERVER_IP" "
        cp '$BACKUP_DIR/nginx.conf.backup' '$REMOTE_CONFIG_PATH' &&
        nginx -t &&
        systemctl reload nginx
    "; then
        echo_success "配置回滚完成"

        # 验证回滚结果
        sleep 3
        if curl -f -s --max-time $HEALTH_CHECK_TIMEOUT "https://$DOMAIN" > /dev/null; then
            echo_success "回滚后网站访问正常"
        else
            echo_error "回滚后网站访问异常，请手动检查"
        fi
    else
        echo_error "配置回滚失败，请手动处理"
        return 1
    fi
}

# 清理旧备份
cleanup_old_backups() {
    echo_step "清理旧备份文件..."

    # 保留最近5个备份
    ssh "$SERVER_USER@$SERVER_IP" "
        cd /tmp &&
        ls -t nginx-backup-* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true
    " || true

    echo_success "旧备份清理完成"
}

# 生成部署报告
generate_deployment_report() {
    echo_step "生成部署报告..."

    local config_size=$(wc -c < "$LOCAL_CONFIG_PATH")
    local nginx_version=$(ssh "$SERVER_USER@$SERVER_IP" "nginx -v 2>&1 | head -1")

    cat << EOF

====================================
🎉 Nginx配置部署完成报告
====================================
部署ID: $DEPLOYMENT_ID
部署时间: $(date '+%Y-%m-%d %H:%M:%S')
配置文件大小: $config_size 字节
Nginx版本: $nginx_version
====================================
服务器信息:
• 服务器: $SERVER_IP
• 配置文件: $REMOTE_CONFIG_PATH
• 备份位置: $BACKUP_DIR
====================================
网站访问:
• 主站: https://$DOMAIN
• WWW: https://$WWW_DOMAIN
• HTTP重定向: http://$DOMAIN
====================================
回滚信息:
如需回滚，请使用: $ROLLBACK_INFO_FILE
或手动执行: ssh $SERVER_USER@$SERVER_IP "systemctl reload nginx"
====================================
配置管理:
• 测试配置: ssh $SERVER_USER@$SERVER_IP "nginx -t"
• 重载配置: ssh $SERVER_USER@$SERVER_IP "systemctl reload nginx"
• 查看日志: ssh $SERVER_USER@$SERVER_IP "tail -f /var/log/nginx/error.log"
====================================

EOF
}

# 主函数
main() {
    echo_info "🚀 开始Nginx配置部署 (安全增强版)..."
    echo_info "部署ID: $DEPLOYMENT_ID"

    # 执行部署步骤
    check_deployment_lock
    preflight_check
    validate_config_content
    check_ssl_certificates
    create_config_backup
    deploy_config
    test_and_reload_nginx
    health_check
    cleanup_old_backups

    # 生成报告
    generate_deployment_report

    echo_success "🎉 Nginx配置部署成功完成！"
}

# 执行主函数
main "$@"
