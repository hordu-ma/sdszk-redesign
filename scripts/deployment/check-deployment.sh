#!/bin/bash

# 阿里云部署状态检查脚本 v1.0
# 山东省思政课一体化中心 - 部署状态全面检查工具
# 检查前端、后端、数据库、服务状态等

set -euo pipefail

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# 配置
readonly SERVER_USER="root"
readonly SERVER_IP="60.205.124.67"
readonly DOMAIN="horsduroot.com"
readonly WWW_DOMAIN="www.horsduroot.com"
readonly PM2_APP_NAME="sdszk-backend"
readonly SSH_TIMEOUT=10
readonly HTTP_TIMEOUT=10

# SSH选项
readonly SSH_OPTS="-o ConnectTimeout=${SSH_TIMEOUT} -o BatchMode=yes -o StrictHostKeyChecking=no"

# 日志函数
log() { echo -e "[$(date '+%H:%M:%S')] $1"; }
success() { log "${GREEN}✅ $1${NC}"; }
error() { log "${RED}❌ $1${NC}"; }
warning() { log "${YELLOW}⚠️ $1${NC}"; }
info() { log "${BLUE}ℹ️ $1${NC}"; }
header() { log "${CYAN}🔍 $1${NC}"; }

# 检查项计数器
total_checks=0
passed_checks=0
failed_checks=0
warning_checks=0

# 记录检查结果
record_result() {
    local status=$1
    local message=$2

    total_checks=$((total_checks + 1))

    case $status in
        "pass")
            success "$message"
            passed_checks=$((passed_checks + 1))
            ;;
        "fail")
            error "$message"
            failed_checks=$((failed_checks + 1))
            ;;
        "warn")
            warning "$message"
            warning_checks=$((warning_checks + 1))
            ;;
    esac
}

# 安全SSH执行
safe_ssh() {
    local timeout=${1:-10}
    shift
    timeout "$timeout" ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "$@" 2>/dev/null
}

# 1. 服务器连接检查
check_server_connection() {
    header "1. 服务器连接检查"

    if safe_ssh 5 "echo 'connection_ok'"; then
        record_result "pass" "SSH连接正常"
    else
        record_result "fail" "SSH连接失败"
        return 1
    fi

    # 检查服务器基本信息
    local uptime=$(safe_ssh 5 "uptime" || echo "获取失败")
    info "服务器运行时间: $uptime"

    local disk_usage=$(safe_ssh 5 "df -h / | tail -1 | awk '{print \$5}'" || echo "N/A")
    info "磁盘使用率: $disk_usage"

    local memory_usage=$(safe_ssh 5 "free -h | grep Mem | awk '{print \$3\"/\"\$2}'" || echo "N/A")
    info "内存使用: $memory_usage"
}

# 2. 前端服务检查
check_frontend_service() {
    header "2. 前端服务检查"

    # 检查前端目录
    if safe_ssh 5 "[ -d '/var/www/frontend' ]"; then
        record_result "pass" "前端目录存在"
    else
        record_result "fail" "前端目录不存在"
    fi

    # 检查关键文件
    if safe_ssh 5 "[ -f '/var/www/frontend/index.html' ]"; then
        record_result "pass" "index.html文件存在"
    else
        record_result "fail" "index.html文件缺失"
    fi

    # 检查文件权限
    local permissions=$(safe_ssh 5 "ls -la /var/www/frontend/index.html | awk '{print \$1}'" || echo "N/A")
    if [[ "$permissions" =~ ^-rw-r--r-- ]]; then
        record_result "pass" "文件权限正确 ($permissions)"
    else
        record_result "warn" "文件权限异常 ($permissions)"
    fi

    # 检查文件数量和大小
    local file_count=$(safe_ssh 5 "find /var/www/frontend -type f | wc -l" || echo "0")
    local dir_size=$(safe_ssh 5 "du -sh /var/www/frontend | cut -f1" || echo "N/A")
    info "前端文件数量: $file_count"
    info "前端目录大小: $dir_size"
}

# 3. 后端服务检查
check_backend_service() {
    header "3. 后端服务检查"

    # 检查后端目录
    if safe_ssh 5 "[ -d '/var/www/sdszk-backend' ]"; then
        record_result "pass" "后端目录存在"
    else
        record_result "fail" "后端目录不存在"
        return 1
    fi

    # 检查关键文件
    if safe_ssh 5 "[ -f '/var/www/sdszk-backend/app.js' ]"; then
        record_result "pass" "app.js文件存在"
    else
        record_result "fail" "app.js文件缺失"
    fi

    if safe_ssh 5 "[ -f '/var/www/sdszk-backend/.env' ]"; then
        record_result "pass" "环境配置文件存在"
    else
        record_result "fail" "环境配置文件缺失"
    fi

    # 检查node_modules
    if safe_ssh 5 "[ -d '/var/www/sdszk-backend/node_modules' ]"; then
        record_result "pass" "依赖包目录存在"
        local package_count=$(safe_ssh 5 "ls /var/www/sdszk-backend/node_modules | wc -l" || echo "0")
        info "依赖包数量: $package_count"
    else
        record_result "fail" "依赖包目录缺失"
    fi

    # 检查必要目录
    for dir in "uploads" "logs" "data"; do
        if safe_ssh 5 "[ -d '/var/www/sdszk-backend/$dir' ]"; then
            record_result "pass" "$dir 目录存在"
        else
            record_result "warn" "$dir 目录缺失"
        fi
    done
}

# 4. PM2服务检查
check_pm2_service() {
    header "4. PM2服务检查"

    # 检查PM2是否安装
    if safe_ssh 5 "command -v pm2 >/dev/null"; then
        record_result "pass" "PM2已安装"
    else
        record_result "fail" "PM2未安装"
        return 1
    fi

    # 检查PM2版本
    local pm2_version=$(safe_ssh 5 "pm2 --version" || echo "获取失败")
    info "PM2版本: $pm2_version"

    # 检查应用状态
    local app_status=$(safe_ssh 5 "pm2 jlist | jq -r '.[] | select(.name==\"$PM2_APP_NAME\") | .pm2_env.status' 2>/dev/null" || echo "not_found")

    case "$app_status" in
        "online")
            record_result "pass" "PM2应用状态: online"
            ;;
        "stopped")
            record_result "fail" "PM2应用状态: stopped"
            ;;
        "errored")
            record_result "fail" "PM2应用状态: errored"
            ;;
        "not_found")
            record_result "fail" "PM2应用不存在"
            ;;
        *)
            record_result "warn" "PM2应用状态异常: $app_status"
            ;;
    esac

    # 检查实例数量
    local instance_count=$(safe_ssh 5 "pm2 list | grep -c '$PM2_APP_NAME' || echo 0")
    if [[ "$instance_count" == "1" ]]; then
        record_result "pass" "PM2实例数量正常 (1个)"
    elif [[ "$instance_count" == "0" ]]; then
        record_result "fail" "没有PM2实例在运行"
    else
        record_result "warn" "PM2实例数量异常 ($instance_count个)"
    fi

    # 检查重启次数
    local restart_count=$(safe_ssh 5 "pm2 jlist | jq -r '.[] | select(.name==\"$PM2_APP_NAME\") | .pm2_env.restart_time' 2>/dev/null" || echo "0")
    if [[ "$restart_count" -lt 5 ]]; then
        record_result "pass" "重启次数正常 ($restart_count次)"
    else
        record_result "warn" "重启次数较多 ($restart_count次)"
    fi

    # 检查内存使用
    local memory_usage=$(safe_ssh 5 "pm2 jlist | jq -r '.[] | select(.name==\"$PM2_APP_NAME\") | .monit.memory' 2>/dev/null" || echo "0")
    if [[ "$memory_usage" -gt 0 ]]; then
        local memory_mb=$((memory_usage / 1024 / 1024))
        if [[ "$memory_mb" -lt 500 ]]; then
            record_result "pass" "内存使用正常 (${memory_mb}MB)"
        else
            record_result "warn" "内存使用较高 (${memory_mb}MB)"
        fi
    fi
}

# 5. Nginx服务检查
check_nginx_service() {
    header "5. Nginx服务检查"

    # 检查Nginx状态
    if safe_ssh 5 "systemctl is-active nginx >/dev/null"; then
        record_result "pass" "Nginx服务运行正常"
    else
        record_result "fail" "Nginx服务未运行"
    fi

    # 检查Nginx配置
    if safe_ssh 5 "nginx -t >/dev/null 2>&1"; then
        record_result "pass" "Nginx配置语法正确"
    else
        record_result "fail" "Nginx配置语法错误"
    fi

    # 检查端口监听
    local port80=$(safe_ssh 5 "netstat -tlnp | grep ':80 ' | wc -l" || echo "0")
    local port443=$(safe_ssh 5 "netstat -tlnp | grep ':443 ' | wc -l" || echo "0")

    if [[ "$port80" -gt 0 ]]; then
        record_result "pass" "端口80正在监听"
    else
        record_result "fail" "端口80未监听"
    fi

    if [[ "$port443" -gt 0 ]]; then
        record_result "pass" "端口443正在监听 (HTTPS)"
    else
        record_result "warn" "端口443未监听 (无HTTPS)"
    fi
}

# 6. 网站访问检查
check_website_access() {
    header "6. 网站访问检查"

    # 检查主域名
    if curl -f -s --max-time $HTTP_TIMEOUT "https://$DOMAIN" >/dev/null 2>&1; then
        record_result "pass" "主域名访问正常 (https://$DOMAIN)"
    else
        record_result "fail" "主域名访问失败 (https://$DOMAIN)"
    fi

    # 检查WWW域名
    if curl -f -s --max-time $HTTP_TIMEOUT "https://$WWW_DOMAIN" >/dev/null 2>&1; then
        record_result "pass" "WWW域名访问正常 (https://$WWW_DOMAIN)"
    else
        record_result "warn" "WWW域名访问失败 (https://$WWW_DOMAIN)"
    fi

    # 检查HTTP重定向
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time $HTTP_TIMEOUT "http://$DOMAIN" 2>/dev/null || echo "000")
    if [[ "$http_status" == "301" || "$http_status" == "302" ]]; then
        record_result "pass" "HTTP自动重定向到HTTPS"
    else
        record_result "warn" "HTTP重定向状态码: $http_status"
    fi

    # 检查管理后台
    if curl -f -s --max-time $HTTP_TIMEOUT "https://$DOMAIN/admin" >/dev/null 2>&1; then
        record_result "pass" "管理后台访问正常"
    else
        record_result "warn" "管理后台访问异常"
    fi
}

# 7. API接口检查
check_api_endpoints() {
    header "7. API接口检查"

    # 检查健康检查接口
    if safe_ssh 5 "curl -f -s --max-time 5 'http://localhost:3000/api/health' >/dev/null"; then
        record_result "pass" "API健康检查接口正常"
    else
        record_result "fail" "API健康检查接口异常"
    fi

    # 检查外部API访问
    if curl -f -s --max-time $HTTP_TIMEOUT "https://$DOMAIN/api/health" >/dev/null 2>&1; then
        record_result "pass" "外部API访问正常"
    else
        record_result "fail" "外部API访问失败"
    fi

    # 检查其他关键接口
    local api_endpoints=("news" "resources" "categories")
    for endpoint in "${api_endpoints[@]}"; do
        if curl -f -s --max-time $HTTP_TIMEOUT "https://$DOMAIN/api/$endpoint" >/dev/null 2>&1; then
            record_result "pass" "API接口 /$endpoint 正常"
        else
            record_result "warn" "API接口 /$endpoint 异常"
        fi
    done
}

# 8. SSL证书检查
check_ssl_certificate() {
    header "8. SSL证书检查"

    # 检查证书有效性
    local cert_info=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" -verify_return_error 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "获取失败")

    if [[ "$cert_info" != "获取失败" ]]; then
        record_result "pass" "SSL证书有效"

        # 提取过期时间
        local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
        if [[ -n "$expiry_date" ]]; then
            info "证书过期时间: $expiry_date"

            # 检查是否即将过期（30天内）
            local expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
            local current_timestamp=$(date +%s)
            local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))

            if [[ "$days_until_expiry" -gt 30 ]]; then
                record_result "pass" "SSL证书有效期充足 ($days_until_expiry天)"
            elif [[ "$days_until_expiry" -gt 7 ]]; then
                record_result "warn" "SSL证书即将过期 ($days_until_expiry天)"
            else
                record_result "fail" "SSL证书即将过期 ($days_until_expiry天)"
            fi
        fi
    else
        record_result "fail" "SSL证书检查失败"
    fi
}

# 9. 数据库连接检查
check_database_connection() {
    header "9. 数据库连接检查"

    # 通过后端API检查数据库连接
    local db_status=$(safe_ssh 5 "cd /var/www/sdszk-backend && node -e '
        import(\"./config/database.js\").then(db => {
            db.default.connection.readyState === 1 ? console.log(\"connected\") : console.log(\"disconnected\");
            process.exit();
        }).catch(() => console.log(\"error\"));
    ' 2>/dev/null" || echo "error")

    case "$db_status" in
        "connected")
            record_result "pass" "数据库连接正常"
            ;;
        "disconnected")
            record_result "fail" "数据库连接断开"
            ;;
        *)
            record_result "warn" "数据库连接状态未知"
            ;;
    esac

    # 检查MongoDB进程
    if safe_ssh 5 "pgrep mongod >/dev/null"; then
        record_result "pass" "MongoDB进程运行正常"
    else
        record_result "warn" "MongoDB进程未发现（可能使用远程数据库）"
    fi
}

# 10. 日志检查
check_logs() {
    header "10. 日志检查"

    # 检查PM2日志
    local pm2_log_errors=$(safe_ssh 5 "pm2 logs $PM2_APP_NAME --lines 50 --nostream 2>/dev/null | grep -i error | wc -l" || echo "0")
    if [[ "$pm2_log_errors" -eq 0 ]]; then
        record_result "pass" "PM2日志无错误"
    elif [[ "$pm2_log_errors" -lt 5 ]]; then
        record_result "warn" "PM2日志有少量错误 ($pm2_log_errors个)"
    else
        record_result "fail" "PM2日志错误较多 ($pm2_log_errors个)"
    fi

    # 检查Nginx日志
    local nginx_errors=$(safe_ssh 5 "tail -100 /var/log/nginx/error.log 2>/dev/null | grep -v 'client intended to send too large body' | wc -l" || echo "0")
    if [[ "$nginx_errors" -eq 0 ]]; then
        record_result "pass" "Nginx错误日志无异常"
    else
        record_result "warn" "Nginx有错误日志 ($nginx_errors条)"
    fi

    # 检查系统日志
    local system_errors=$(safe_ssh 5 "journalctl --since='1 hour ago' --priority=err --no-pager | wc -l" || echo "0")
    if [[ "$system_errors" -eq 0 ]]; then
        record_result "pass" "系统日志无严重错误"
    else
        record_result "warn" "系统有错误日志 ($system_errors条)"
    fi
}

# 生成最终报告
generate_final_report() {
    echo ""
    header "📊 部署状态检查报告"
    echo "======================================"
    echo "🕐 检查时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "🌐 检查域名: $DOMAIN"
    echo "🖥️ 服务器IP: $SERVER_IP"
    echo "======================================"
    echo "📈 检查统计:"
    echo "  总检查项: $total_checks"
    echo "  ✅ 通过: $passed_checks"
    echo "  ❌ 失败: $failed_checks"
    echo "  ⚠️ 警告: $warning_checks"
    echo "======================================"

    # 计算健康分数
    local health_score=0
    if [[ $total_checks -gt 0 ]]; then
        health_score=$(( (passed_checks * 100) / total_checks ))
    fi

    echo "🏥 健康评分: $health_score/100"

    if [[ $health_score -ge 90 ]]; then
        success "系统状态优秀 🎉"
    elif [[ $health_score -ge 80 ]]; then
        success "系统状态良好 👍"
    elif [[ $health_score -ge 70 ]]; then
        warning "系统状态一般，建议关注 ⚠️"
    elif [[ $health_score -ge 60 ]]; then
        warning "系统状态较差，需要处理 🔧"
    else
        error "系统状态严重，需要立即处理 🚨"
    fi

    echo "======================================"

    # 如果有失败项，显示建议
    if [[ $failed_checks -gt 0 ]]; then
        echo ""
        error "发现 $failed_checks 个严重问题，建议立即处理："
        echo "• 检查服务状态: npm run pm2:status"
        echo "• 重启服务: npm run pm2:restart"
        echo "• 查看日志: npm run pm2:logs"
        echo "• 重新部署: npm run deploy:quick"
    fi

    if [[ $warning_checks -gt 0 ]]; then
        echo ""
        warning "发现 $warning_checks 个警告项，建议关注监控"
    fi

    echo ""
}

# 显示帮助
show_help() {
    cat << EOF
🔍 阿里云部署状态检查工具 v1.0

用法: $0 [选项]

选项:
  --quick, -q     快速检查（跳过详细项）
  --verbose, -v   详细输出
  --help, -h      显示帮助

检查项目:
  1. 服务器连接检查
  2. 前端服务检查
  3. 后端服务检查
  4. PM2服务检查
  5. Nginx服务检查
  6. 网站访问检查
  7. API接口检查
  8. SSL证书检查
  9. 数据库连接检查
  10. 日志检查

示例:
  $0              # 完整检查
  $0 --quick      # 快速检查
  $0 --verbose    # 详细输出

EOF
}

# 主函数
main() {
    local quick_mode=false
    local verbose_mode=false

    # 参数解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            --quick|-q)
                quick_mode=true
                shift
                ;;
            --verbose|-v)
                verbose_mode=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done

    header "阿里云部署状态检查工具 v1.0"
    info "开始全面检查部署状态..."
    echo ""

    # 执行检查
    check_server_connection || { error "服务器连接失败，停止检查"; exit 1; }
    check_frontend_service
    check_backend_service
    check_pm2_service
    check_nginx_service
    check_website_access
    check_api_endpoints

    if [[ "$quick_mode" == false ]]; then
        check_ssl_certificate
        check_database_connection
        check_logs
    fi

    # 生成报告
    generate_final_report

    # 根据结果设置退出码
    if [[ $failed_checks -gt 0 ]]; then
        exit 1
    elif [[ $warning_checks -gt 5 ]]; then
        exit 2
    else
        exit 0
    fi
}

# 执行主函数
main "$@"
