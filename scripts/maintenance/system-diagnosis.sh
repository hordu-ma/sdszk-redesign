#!/bin/bash

# 阿里云环境状态诊断脚本 v1.0
# 用于全面检查系统状态、备份冗余、服务健康等关键指标
#
# 使用方法:
#   ./system-diagnosis.sh                    # 完整诊断
#   ./system-diagnosis.sh --quick            # 快速诊断
#   ./system-diagnosis.sh --backup-only      # 仅检查备份状态
#   ./system-diagnosis.sh --service-only     # 仅检查服务状态

set -euo pipefail

# 配置变量
SERVER_IP="60.205.124.67"
SERVER_USER="root"
SSH_OPTS="-o ConnectTimeout=10 -o StrictHostKeyChecking=no"
BACKUP_BASE_PATH="/var/www"
PM2_APP_NAME="sdszk-backend"
DEPLOY_PATH="/var/www/sdszk-backend"
LOG_FILE="/tmp/system-diagnosis-$(date +%Y%m%d_%H%M%S).log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

echo_info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

echo_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

echo_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

echo_step() {
    echo -e "${PURPLE}🔍 $1${NC}" | tee -a "$LOG_FILE"
}

echo_critical() {
    echo -e "${RED}🚨 $1${NC}" | tee -a "$LOG_FILE"
}

# SSH执行函数
safe_ssh() {
    local timeout=${1:-60}
    shift
    timeout "$timeout" ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "$@"
}

safe_ssh_script() {
    local timeout=${1:-60}
    local script="$2"
    echo "$script" | timeout "$timeout" ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" 'bash -s'
}

# 检查服务器连接
check_connection() {
    echo_step "检查服务器连接状态..."

    local start_time=$(date +%s)
    if safe_ssh 10 "echo 'Connected'" > /dev/null 2>&1; then
        local end_time=$(date +%s)
        local response_time=$((end_time - start_time))
        echo_success "服务器连接正常 (响应时间: ${response_time}s)"
        return 0
    else
        echo_error "无法连接到服务器 $SERVER_IP"
        return 1
    fi
}

# 检查系统基本信息
check_system_info() {
    echo_step "获取系统基本信息..."

    local system_info=$(safe_ssh_script 30 "
        echo '=== 系统信息 ==='
        echo '操作系统:' \$(cat /etc/os-release | grep PRETTY_NAME | cut -d'=' -f2 | tr -d '\"')
        echo '内核版本:' \$(uname -r)
        echo '系统架构:' \$(uname -m)
        echo '运行时间:' \$(uptime -p)
        echo '当前时间:' \$(date '+%Y-%m-%d %H:%M:%S')
        echo '时区:' \$(timedatectl | grep 'Time zone' | awk '{print \$3}')
        echo ''

        echo '=== 负载信息 ==='
        uptime
        echo ''

        echo '=== CPU信息 ==='
        echo 'CPU核心数:' \$(nproc)
        echo 'CPU使用率:'
        top -bn1 | grep 'Cpu(s)' | awk '{print \$2}' | cut -d'%' -f1
        echo ''
    ")

    echo "$system_info" | tee -a "$LOG_FILE"
}

# 检查磁盘使用情况
check_disk_usage() {
    echo_step "检查磁盘使用情况..."

    local disk_info=$(safe_ssh_script 30 "
        echo '=== 磁盘使用情况 ==='
        df -h
        echo ''

        echo '=== 根目录磁盘详情 ==='
        df -h / | tail -1
        root_usage=\$(df / | tail -1 | awk '{print \$5}' | sed 's/%//')
        root_available=\$(df -h / | tail -1 | awk '{print \$4}')

        echo \"使用率: \${root_usage}%\"
        echo \"可用空间: \${root_available}\"

        if [ \$root_usage -gt 90 ]; then
            echo \"状态: 🚨 危险 - 磁盘使用率超过90%\"
        elif [ \$root_usage -gt 80 ]; then
            echo \"状态: ⚠️ 警告 - 磁盘使用率超过80%\"
        elif [ \$root_usage -gt 70 ]; then
            echo \"状态: 📊 注意 - 磁盘使用率超过70%\"
        else
            echo \"状态: ✅ 正常\"
        fi
        echo ''

        echo '=== 大文件和目录 (前10个) ==='
        du -sh /var/* 2>/dev/null | sort -hr | head -10
        echo ''
    ")

    echo "$disk_info" | tee -a "$LOG_FILE"

    # 解析磁盘使用率用于后续判断
    local usage_percent=$(echo "$disk_info" | grep "使用率:" | awk '{print $2}' | sed 's/%//')
    if [ "$usage_percent" -gt 90 ]; then
        echo_critical "磁盘空间严重不足！"
        return 3
    elif [ "$usage_percent" -gt 80 ]; then
        echo_warning "磁盘空间不足，建议清理"
        return 2
    elif [ "$usage_percent" -gt 70 ]; then
        echo_warning "磁盘使用率较高，需要关注"
        return 1
    else
        echo_success "磁盘使用率正常"
        return 0
    fi
}

# 检查内存使用情况
check_memory_usage() {
    echo_step "检查内存使用情况..."

    local memory_info=$(safe_ssh_script 30 "
        echo '=== 内存使用情况 ==='
        free -h
        echo ''

        echo '=== 详细内存信息 ==='
        total_mem=\$(free -m | awk 'NR==2{printf \"%d\", \$2}')
        used_mem=\$(free -m | awk 'NR==2{printf \"%d\", \$3}')
        free_mem=\$(free -m | awk 'NR==2{printf \"%d\", \$4}')
        available_mem=\$(free -m | awk 'NR==2{printf \"%d\", \$7}')

        usage_percent=\$(awk \"BEGIN {printf \\\"%.1f\\\", \$used_mem/\$total_mem*100}\")

        echo \"总内存: \${total_mem}MB\"
        echo \"已使用: \${used_mem}MB\"
        echo \"可用内存: \${available_mem}MB\"
        echo \"使用率: \${usage_percent}%\"

        if (( \$(echo \"\$usage_percent > 90\" | bc -l) )); then
            echo \"状态: 🚨 危险 - 内存使用率超过90%\"
        elif (( \$(echo \"\$usage_percent > 80\" | bc -l) )); then
            echo \"状态: ⚠️ 警告 - 内存使用率超过80%\"
        else
            echo \"状态: ✅ 正常\"
        fi
        echo ''

        echo '=== 内存占用最高的进程 (前5个) ==='
        ps aux --sort=-%mem | head -6
        echo ''
    ")

    echo "$memory_info" | tee -a "$LOG_FILE"
}

# 检查备份文件状态
check_backup_status() {
    echo_step "检查备份文件状态..."

    local backup_info=$(safe_ssh_script 60 "
        cd $BACKUP_BASE_PATH 2>/dev/null || { echo '备份目录不存在'; exit 1; }

        echo '=== 备份目录总览 ==='
        ls -la | grep -E '(backend-backup|frontend-backup)' | head -20
        echo ''

        echo '=== 后端备份统计 ==='
        backend_backups=\$(ls -1d sdszk-backend-backup-* 2>/dev/null | wc -l)
        echo \"后端备份数量: \$backend_backups\"

        if [ \$backend_backups -gt 0 ]; then
            echo \"最新的后端备份:\"
            ls -dt sdszk-backend-backup-* 2>/dev/null | head -3
            echo \"最旧的后端备份:\"
            ls -dt sdszk-backend-backup-* 2>/dev/null | tail -3
            echo \"后端备份总大小:\"
            du -sh sdszk-backend-backup-* 2>/dev/null | awk '{sum+=\$1} END {print sum \"(approximate)\"}'

            # 详细备份大小信息
            echo \"各备份大小详情:\"
            du -sh sdszk-backend-backup-* 2>/dev/null | sort -hr | head -10
        fi
        echo ''

        echo '=== 前端备份统计 ==='
        frontend_backups=\$(ls -1d frontend-backup-* 2>/dev/null | wc -l)
        echo \"前端备份数量: \$frontend_backups\"

        if [ \$frontend_backups -gt 0 ]; then
            echo \"最新的前端备份:\"
            ls -dt frontend-backup-* 2>/dev/null | head -3
            echo \"最旧的前端备份:\"
            ls -dt frontend-backup-* 2>/dev/null | tail -3
            echo \"前端备份总大小:\"
            du -sh frontend-backup-* 2>/dev/null | awk '{sum+=\$1} END {print sum \"(approximate)\"}'

            # 详细备份大小信息
            echo \"各备份大小详情:\"
            du -sh frontend-backup-* 2>/dev/null | sort -hr | head -10
        fi
        echo ''

        echo '=== 备份冗余分析 ==='
        total_backups=\$((\$backend_backups + \$frontend_backups))
        echo \"总备份数量: \$total_backups\"

        if [ \$total_backups -gt 20 ]; then
            echo \"状态: 🚨 严重冗余 - 备份数量过多 (\$total_backups)\"
        elif [ \$total_backups -gt 10 ]; then
            echo \"状态: ⚠️ 冗余较多 - 建议清理部分备份 (\$total_backups)\"
        elif [ \$total_backups -gt 5 ]; then
            echo \"状态: 📊 适中 - 备份数量合理 (\$total_backups)\"
        else
            echo \"状态: ✅ 正常 - 备份数量适中 (\$total_backups)\"
        fi
        echo ''
    ")

    echo "$backup_info" | tee -a "$LOG_FILE"
}

# 检查临时文件和日志
check_temp_and_logs() {
    echo_step "检查临时文件和日志状态..."

    local temp_info=$(safe_ssh_script 45 "
        echo '=== /tmp 目录使用情况 ==='
        du -sh /tmp
        echo ''

        echo '=== 项目相关临时文件 ==='
        find /tmp -name '*sdszk*' -o -name '*deploy*' -o -name '*rollback*' 2>/dev/null | head -20
        echo ''

        echo '=== 大的临时文件 (前10个) ==='
        find /tmp -type f -size +10M 2>/dev/null | xargs ls -lh 2>/dev/null | head -10
        echo ''

        echo '=== PM2 日志状态 ==='
        if [ -d ~/.pm2/logs ]; then
            echo \"PM2日志目录大小:\" \$(du -sh ~/.pm2/logs 2>/dev/null | cut -f1)
            echo \"PM2日志文件数量:\" \$(ls ~/.pm2/logs/ 2>/dev/null | wc -l)
            echo \"最大的PM2日志文件:\"
            ls -lh ~/.pm2/logs/ 2>/dev/null | sort -k5 -hr | head -5
        else
            echo \"PM2日志目录不存在\"
        fi
        echo ''

        echo '=== 应用日志状态 ==='
        if [ -f '$DEPLOY_PATH/logs/app.log' ]; then
            echo \"应用日志大小:\" \$(du -sh '$DEPLOY_PATH/logs/app.log' 2>/dev/null | cut -f1)
        fi

        # 检查nginx日志
        if [ -d /var/log/nginx ]; then
            echo \"Nginx日志目录大小:\" \$(du -sh /var/log/nginx 2>/dev/null | cut -f1)
            echo \"Nginx访问日志大小:\" \$(du -sh /var/log/nginx/access.log* 2>/dev/null | cut -f1)
            echo \"Nginx错误日志大小:\" \$(du -sh /var/log/nginx/error.log* 2>/dev/null | cut -f1)
        fi
        echo ''
    ")

    echo "$temp_info" | tee -a "$LOG_FILE"
}

# 检查PM2服务状态
check_pm2_status() {
    echo_step "检查PM2服务状态..."

    local pm2_info=$(safe_ssh_script 45 "
        echo '=== PM2进程状态 ==='
        if command -v pm2 >/dev/null 2>&1; then
            pm2 status
            echo ''

            echo '=== PM2进程详情 ==='
            if pm2 list | grep -q '$PM2_APP_NAME'; then
                pm2 show '$PM2_APP_NAME'
                echo ''

                # 获取进程详细信息
                app_status=\$(pm2 jlist | jq -r '.[] | select(.name==\"$PM2_APP_NAME\") | .pm2_env.status' 2>/dev/null || echo 'unknown')
                restart_count=\$(pm2 jlist | jq -r '.[] | select(.name==\"$PM2_APP_NAME\") | .pm2_env.restart_time' 2>/dev/null || echo '0')
                memory_usage=\$(pm2 jlist | jq -r '.[] | select(.name==\"$PM2_APP_NAME\") | .monit.memory' 2>/dev/null || echo '0')
                cpu_usage=\$(pm2 jlist | jq -r '.[] | select(.name==\"$PM2_APP_NAME\") | .monit.cpu' 2>/dev/null || echo '0')

                echo \"应用状态: \$app_status\"
                echo \"重启次数: \$restart_count\"
                echo \"内存使用: \$((\$memory_usage / 1024 / 1024))MB\"
                echo \"CPU使用: \${cpu_usage}%\"

                # 健康状态评估
                instance_count=\$(pm2 list | grep -c '$PM2_APP_NAME' || echo 0)
                echo \"实例数量: \$instance_count\"

                if [ \"\$app_status\" = \"online\" ] && [ \$instance_count -eq 1 ] && [ \$restart_count -lt 10 ]; then
                    echo \"状态: ✅ 健康\"
                elif [ \"\$app_status\" = \"online\" ] && [ \$instance_count -gt 1 ]; then
                    echo \"状态: ⚠️ 多实例运行 - 可能存在冗余\"
                elif [ \$restart_count -gt 20 ]; then
                    echo \"状态: ⚠️ 重启次数过多 - 可能存在问题\"
                else
                    echo \"状态: ❌ 异常 - 需要检查\"
                fi
            else
                echo \"应用 '$PM2_APP_NAME' 未运行\"
                echo \"状态: ❌ 应用未启动\"
            fi
            echo ''

            echo '=== PM2守护进程信息 ==='
            pm2 info
        else
            echo \"PM2未安装\"
            echo \"状态: ❌ PM2不可用\"
        fi
        echo ''
    ")

    echo "$pm2_info" | tee -a "$LOG_FILE"
}

# 检查服务健康状态
check_service_health() {
    echo_step "检查服务健康状态..."

    local health_info=$(safe_ssh_script 30 "
        echo '=== API健康检查 ==='

        # 检查后端API
        if curl -s -f http://localhost:3000/api/health >/dev/null 2>&1; then
            echo \"后端API (http://localhost:3000/api/health): ✅ 正常\"
            response_time=\$(curl -w '%{time_total}' -s -o /dev/null http://localhost:3000/api/health)
            echo \"响应时间: \${response_time}s\"
        else
            echo \"后端API (http://localhost:3000/api/health): ❌ 异常\"
        fi

        # 检查数据库连接
        if curl -s -f http://localhost:3000/api/test-db >/dev/null 2>&1; then
            echo \"数据库连接: ✅ 正常\"
        else
            echo \"数据库连接: ❌ 异常或接口不存在\"
        fi

        echo ''
        echo '=== 端口监听状态 ==='
        netstat -tlnp | grep -E ':(3000|80|443|22)' | while read line; do
            echo \$line
        done
        echo ''

        echo '=== Nginx状态 ==='
        if systemctl is-active nginx >/dev/null 2>&1; then
            echo \"Nginx服务: ✅ 运行中\"
            nginx_version=\$(nginx -v 2>&1 | cut -d' ' -f3)
            echo \"版本: \$nginx_version\"
        else
            echo \"Nginx服务: ❌ 未运行\"
        fi
        echo ''
    ")

    echo "$health_info" | tee -a "$LOG_FILE"
}

# 检查网络和安全状态
check_network_security() {
    echo_step "检查网络和安全状态..."

    local network_info=$(safe_ssh_script 30 "
        echo '=== 网络连接状态 ==='
        echo \"活跃连接数: \$(netstat -an | grep ESTABLISHED | wc -l)\"
        echo \"TIME_WAIT连接数: \$(netstat -an | grep TIME_WAIT | wc -l)\"
        echo ''

        echo '=== 防火墙状态 ==='
        if command -v ufw >/dev/null 2>&1; then
            ufw status
        elif command -v iptables >/dev/null 2>&1; then
            echo \"IPTables规则数: \$(iptables -L | wc -l)\"
        else
            echo \"未检测到防火墙配置\"
        fi
        echo ''

        echo '=== SSL证书状态 ==='
        if [ -f /etc/nginx/ssl/certificate.crt ]; then
            echo \"SSL证书存在\"
            cert_expiry=\$(openssl x509 -in /etc/nginx/ssl/certificate.crt -noout -enddate 2>/dev/null | cut -d= -f2)
            echo \"证书到期时间: \$cert_expiry\"
        else
            echo \"SSL证书未找到\"
        fi
        echo ''
    ")

    echo "$network_info" | tee -a "$LOG_FILE"
}

# 生成综合诊断报告
generate_diagnosis_report() {
    echo_step "生成综合诊断报告..."

    local report_file="/tmp/system-diagnosis-report-$(date +%Y%m%d_%H%M%S).txt"

    cat > "$report_file" << EOF
=====================================
🏥 阿里云环境状态诊断报告
=====================================
• 诊断时间: $(date '+%Y-%m-%d %H:%M:%S')
• 服务器: $SERVER_IP
• 详细日志: $LOG_FILE

📊 关键指标摘要:
EOF

    # 从日志中提取关键信息
    echo "• 磁盘使用率: $(grep "使用率:" "$LOG_FILE" | tail -1 | awk '{print $2}' || echo "未知")" >> "$report_file"
    echo "• 内存使用率: $(grep "使用率:" "$LOG_FILE" | grep "%" | tail -1 | awk '{print $2}' || echo "未知")" >> "$report_file"
    echo "• 后端备份数量: $(grep "后端备份数量:" "$LOG_FILE" | awk '{print $3}' || echo "未知")" >> "$report_file"
    echo "• 前端备份数量: $(grep "前端备份数量:" "$LOG_FILE" | awk '{print $3}' || echo "未知")" >> "$report_file"
    echo "• PM2应用状态: $(grep "应用状态:" "$LOG_FILE" | awk '{print $2}' || echo "未知")" >> "$report_file"
    echo "• API健康状态: $(grep "后端API" "$LOG_FILE" | grep -o "[✅❌].*" || echo "未知")" >> "$report_file"

    cat >> "$report_file" << EOF

🔍 发现的问题:
EOF

    # 提取问题标记
    grep -E "(🚨|⚠️|❌)" "$LOG_FILE" | sed 's/^/• /' >> "$report_file" 2>/dev/null || echo "• 未发现明显问题" >> "$report_file"

    cat >> "$report_file" << EOF

💡 推荐操作:
EOF

    # 根据发现的问题生成建议
    local disk_usage=$(grep "使用率:" "$LOG_FILE" | tail -1 | awk '{print $2}' | sed 's/%//' 2>/dev/null || echo "0")
    local backup_count=$(grep "总备份数量:" "$LOG_FILE" | awk '{print $3}' 2>/dev/null || echo "0")

    if [ "$disk_usage" -gt 80 ]; then
        echo "• 🚨 立即清理磁盘空间 - 使用率超过80%" >> "$report_file"
    fi

    if [ "$backup_count" -gt 15 ]; then
        echo "• 📦 清理过期备份文件 - 当前有${backup_count}个备份" >> "$report_file"
    fi

    if grep -q "多实例运行" "$LOG_FILE"; then
        echo "• 🔧 清理重复的PM2进程实例" >> "$report_file"
    fi

    if grep -q "❌ 异常" "$LOG_FILE"; then
        echo "• 🔧 修复发现的服务异常" >> "$report_file"
    fi

    cat >> "$report_file" << EOF

📈 系统健康评分:
EOF

    # 计算健康评分
    local score=0
    [ "$disk_usage" -lt 80 ] && score=$((score + 20))
    grep -q "✅ 正常" "$LOG_FILE" && score=$((score + 20))
    grep -q "后端API.*✅" "$LOG_FILE" && score=$((score + 20))
    grep -q "应用状态: online" "$LOG_FILE" && score=$((score + 20))
    [ "$backup_count" -lt 20 ] && score=$((score + 20))

    echo "• 总分: $score/100" >> "$report_file"
    if [ $score -ge 80 ]; then
        echo "• 评级: ✅ 优秀 - 系统运行良好" >> "$report_file"
    elif [ $score -ge 60 ]; then
        echo "• 评级: ⚠️ 良好 - 有少量问题需要关注" >> "$report_file"
    elif [ $score -ge 40 ]; then
        echo "• 评级: ⚠️ 一般 - 存在多个问题需要处理" >> "$report_file"
    else
        echo "• 评级: ❌ 较差 - 需要立即处理多个严重问题" >> "$report_file"
    fi

    cat >> "$report_file" << EOF

=====================================
详细日志文件: $LOG_FILE
报告文件: $report_file
=====================================
EOF

    echo ""
    echo "📋 诊断报告已生成: $report_file"
    echo ""
    cat "$report_file"

    # 返回报告文件路径
    echo "$report_file"
}

# 显示帮助信息
show_help() {
    cat << EOF
🏥 阿里云环境状态诊断脚本 v1.0

用法: $0 [选项]

选项:
    --quick             快速诊断 (跳过详细分析)
    --backup-only       仅检查备份状态
    --service-only      仅检查服务状态
    --disk-only         仅检查磁盘状态
    --help              显示此帮助信息

示例:
    $0                  # 完整诊断
    $0 --quick          # 快速诊断
    $0 --backup-only    # 仅检查备份

输出:
    • 详细诊断日志: $LOG_FILE
    • 诊断报告: 会在执行完成后生成

EOF
}

# 主函数
main() {
    local mode="full"

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --quick)
                mode="quick"
                shift
                ;;
            --backup-only)
                mode="backup"
                shift
                ;;
            --service-only)
                mode="service"
                shift
                ;;
            --disk-only)
                mode="disk"
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 开始诊断
    echo_info "🏥 阿里云环境状态诊断开始..."
    echo_info "诊断模式: $mode"
    echo_info "日志文件: $LOG_FILE"
    echo ""

    # 检查连接
    if ! check_connection; then
        echo_error "诊断失败：无法连接到服务器"
        exit 1
    fi

    # 根据模式执行不同的检查
    case $mode in
        "full")
            check_system_info
            check_disk_usage
            check_memory_usage
            check_backup_status
            check_temp_and_logs
            check_pm2_status
            check_service_health
            check_network_security
            ;;
        "quick")
            check_system_info
            check_disk_usage
            check_pm2_status
            check_service_health
            ;;
        "backup")
            check_backup_status
            check_temp_and_logs
            ;;
        "service")
            check_pm2_status
            check_service_health
            ;;
        "disk")
            check_disk_usage
            check_temp_and_logs
            ;;
    esac

    # 生成报告
    echo ""
    echo_step "诊断完成，正在生成报告..."
    local report_file=$(generate_diagnosis_report)

    echo ""
    echo_success "🎉 系统状态诊断完成！"
    echo_info "📋 详细日志: $LOG_FILE"
    echo_info "📊 诊断报告: $report_file"
}

# 错误处理
trap 'echo_error "诊断脚本执行出错，退出码: $?" >&2' ERR

# 执行主函数
main "$@"
