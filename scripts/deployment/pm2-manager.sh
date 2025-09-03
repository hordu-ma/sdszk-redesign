#!/bin/bash

# PM2管理和维护脚本
# 用于日常PM2服务的管理、监控和维护

set -e

# 颜色输出函数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log_with_timestamp() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

echo_info() {
    log_with_timestamp "${BLUE}ℹ️ $1${NC}"
}

echo_success() {
    log_with_timestamp "${GREEN}✅ $1${NC}"
}

echo_warning() {
    log_with_timestamp "${YELLOW}⚠️ $1${NC}"
}

echo_error() {
    log_with_timestamp "${RED}❌ $1${NC}"
}

echo_step() {
    log_with_timestamp "${PURPLE}🔄 $1${NC}"
}

# 配置变量
SERVER_IP="60.205.124.67"
SERVER_USER="root"
PM2_APP_NAME="sdszk-backend"
DEPLOY_PATH="/var/www/sdszk-backend"

# 显示帮助信息
show_help() {
    cat << EOF
🛠️ PM2 管理和维护工具

用法: $0 [选项]

选项:
    status          显示PM2服务状态
    clean           清理所有异常PM2进程
    restart         重启服务（安全重启）
    force-restart   强制重启服务
    logs            查看服务日志
    monitor         实时监控服务状态
    health          执行健康检查
    optimize        优化PM2配置
    backup-config   备份PM2配置
    restore-config  恢复PM2配置
    maintenance     执行完整维护检查
    help            显示此帮助信息

示例:
    $0 status       # 查看服务状态
    $0 clean        # 清理异常进程
    $0 restart      # 重启服务
    $0 logs         # 查看日志
    $0 health       # 健康检查

EOF
}

# 检查服务器连接
check_server_connection() {
    echo_info "检查服务器连接..."
    if ! ssh -o ConnectTimeout=5 "$SERVER_USER@$SERVER_IP" "echo 'Connected'" > /dev/null 2>&1; then
        echo_error "无法连接到服务器 $SERVER_IP"
        exit 1
    fi
    echo_success "服务器连接正常"
}

# 显示PM2服务状态
show_status() {
    echo_step "获取PM2服务状态..."
    ssh "$SERVER_USER@$SERVER_IP" << 'EOF'
        echo "📊 PM2进程状态:"
        pm2 status

        echo ""
        echo "📈 系统资源使用:"
        pm2 monit --no-daemon | head -20

        echo ""
        echo "🔍 应用详细信息:"
        if pm2 list | grep -q 'sdszk-backend'; then
            pm2 show sdszk-backend
        else
            echo "❌ 未找到 sdszk-backend 应用"
        fi
EOF
}

# 清理异常PM2进程
clean_pm2() {
    echo_step "清理异常PM2进程..."
    ssh "$SERVER_USER@$SERVER_IP" << 'EOF'
        echo "🧹 开始清理异常进程..."

        # 显示当前状态
        echo "清理前的进程状态:"
        pm2 list

        # 删除所有stopped/errored进程
        stopped_processes=$(pm2 jlist | jq -r '.[] | select(.pm2_env.status == "stopped" or .pm2_env.status == "errored") | .name' 2>/dev/null || echo "")

        if [ -n "$stopped_processes" ]; then
            echo "发现异常进程，正在清理..."
            echo "$stopped_processes" | while read -r process_name; do
                if [ -n "$process_name" ]; then
                    echo "删除进程: $process_name"
                    pm2 delete "$process_name" 2>/dev/null || true
                fi
            done
        else
            echo "✅ 未发现异常进程"
        fi

        # 清理孤儿进程
        echo "检查孤儿进程..."
        pm2 kill 2>/dev/null || true
        sleep 2

        echo "清理后的进程状态:"
        pm2 list

        echo "✅ 清理完成"
EOF
}

# 安全重启服务
restart_service() {
    echo_step "安全重启服务..."
    ssh "$SERVER_USER@$SERVER_IP" << EOF
        cd '$DEPLOY_PATH'

        echo "🔄 开始安全重启..."

        # 检查当前实例数量
        current_instances=\$(pm2 list | grep -c '$PM2_APP_NAME' || echo 0)
        echo "当前实例数量: \$current_instances"

        if [ \$current_instances -gt 1 ]; then
            echo "⚠️ 检测到多个实例，执行强制清理..."
            pm2 stop '$PM2_APP_NAME' 2>/dev/null || true
            pm2 delete '$PM2_APP_NAME' 2>/dev/null || true
            sleep 2

            echo "启动新实例..."
            pm2 start app.js --name '$PM2_APP_NAME' --env production \\
                --max-restarts 10 \\
                --restart-delay 3000 \\
                --max-memory-restart 500M \\
                --watch false \\
                --merge-logs true
        elif [ \$current_instances -eq 1 ]; then
            echo "正常重启单个实例..."
            pm2 restart '$PM2_APP_NAME'
        else
            echo "未发现实例，启动新实例..."
            pm2 start app.js --name '$PM2_APP_NAME' --env production \\
                --max-restarts 10 \\
                --restart-delay 3000 \\
                --max-memory-restart 500M \\
                --watch false \\
                --merge-logs true
        fi

        # 保存配置
        pm2 save

        # 验证结果
        sleep 3
        final_instances=\$(pm2 list | grep '$PM2_APP_NAME' | grep 'online' | wc -l)
        if [ \$final_instances -eq 1 ]; then
            echo "✅ 重启成功，确认只有一个实例在运行"
        else
            echo "❌ 重启后实例数量异常: \$final_instances"
            pm2 list | grep '$PM2_APP_NAME'
        fi
EOF
}

# 强制重启服务
force_restart_service() {
    echo_step "强制重启服务..."
    ssh "$SERVER_USER@$SERVER_IP" << EOF
        echo "🚨 执行强制重启..."

        # 强制停止所有实例
        pm2 stop '$PM2_APP_NAME' 2>/dev/null || true
        pm2 delete '$PM2_APP_NAME' 2>/dev/null || true

        # 杀死PM2守护进程
        pm2 kill 2>/dev/null || true
        sleep 3

        # 重新启动
        cd '$DEPLOY_PATH'
        pm2 start app.js --name '$PM2_APP_NAME' --env production \\
            --max-restarts 10 \\
            --restart-delay 3000 \\
            --max-memory-restart 500M \\
            --watch false \\
            --merge-logs true

        pm2 save

        echo "✅ 强制重启完成"
        pm2 status '$PM2_APP_NAME'
EOF
}

# 查看日志
show_logs() {
    local lines=${1:-50}
    echo_step "查看服务日志 (最近 $lines 行)..."
    ssh "$SERVER_USER@$SERVER_IP" "pm2 logs '$PM2_APP_NAME' --lines $lines"
}

# 实时监控
monitor_service() {
    echo_step "开始实时监控 (按 Ctrl+C 退出)..."
    ssh "$SERVER_USER@$SERVER_IP" "pm2 monit"
}

# 健康检查
health_check() {
    echo_step "执行健康检查..."
    ssh "$SERVER_USER@$SERVER_IP" << EOF
        echo "🏥 开始健康检查..."

        # 检查PM2状态
        echo "1. PM2状态检查:"
        pm2_status=\$(pm2 jlist | jq -r '.[] | select(.name=="$PM2_APP_NAME") | .pm2_env.status' 2>/dev/null || echo "not_found")
        echo "   状态: \$pm2_status"

        # 检查实例数量
        echo "2. 实例数量检查:"
        instance_count=\$(pm2 list | grep -c '$PM2_APP_NAME' || echo 0)
        echo "   实例数量: \$instance_count"

        # 检查重启次数
        echo "3. 重启次数检查:"
        restart_count=\$(pm2 jlist | jq -r '.[] | select(.name=="$PM2_APP_NAME") | .pm2_env.restart_time' 2>/dev/null || echo "0")
        echo "   重启次数: \$restart_count"

        # 检查内存使用
        echo "4. 内存使用检查:"
        memory_usage=\$(pm2 jlist | jq -r '.[] | select(.name=="$PM2_APP_NAME") | .monit.memory' 2>/dev/null || echo "0")
        echo "   内存使用: \$((\$memory_usage / 1024 / 1024))MB"

        # 检查API接口
        echo "5. API接口检查:"
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            echo "   ✅ API接口正常"
        else
            echo "   ❌ API接口异常"
        fi

        # 生成健康评分
        score=0
        [ "\$pm2_status" = "online" ] && score=\$((score + 20))
        [ \$instance_count -eq 1 ] && score=\$((score + 20))
        [ \$restart_count -lt 5 ] && score=\$((score + 20))
        [ \$memory_usage -lt 524288000 ] && score=\$((score + 20)) # 500MB
        curl -s http://localhost:3000/api/health > /dev/null 2>&1 && score=\$((score + 20))

        echo ""
        echo "📊 健康评分: \$score/100"
        if [ \$score -ge 80 ]; then
            echo "✅ 系统健康状况良好"
        elif [ \$score -ge 60 ]; then
            echo "⚠️ 系统健康状况一般，建议检查"
        else
            echo "❌ 系统健康状况异常，需要立即处理"
        fi
EOF
}

# 优化PM2配置
optimize_pm2() {
    echo_step "优化PM2配置..."
    ssh "$SERVER_USER@$SERVER_IP" << EOF
        echo "⚙️ 优化PM2配置..."

        # 设置PM2环境变量
        pm2 set pm2:log-date-format "YYYY-MM-DD HH:mm:ss Z"
        pm2 set pm2:merge-logs true
        pm2 set pm2:autodump true

        # 安装PM2日志轮转
        if ! pm2 list | grep -q "pm2-logrotate"; then
            echo "安装PM2日志轮转..."
            pm2 install pm2-logrotate
            pm2 set pm2-logrotate:max_size 10M
            pm2 set pm2-logrotate:retain 7
        fi

        # 重启应用以应用新配置
        if pm2 list | grep -q '$PM2_APP_NAME'; then
            pm2 restart '$PM2_APP_NAME'
        fi

        pm2 save
        echo "✅ PM2配置优化完成"
EOF
}

# 备份PM2配置
backup_pm2_config() {
    local backup_file="pm2-config-backup-$(date +%Y%m%d_%H%M%S).json"
    echo_step "备份PM2配置到 $backup_file..."
    ssh "$SERVER_USER@$SERVER_IP" "pm2 save && cat ~/.pm2/dump.pm2" > "$backup_file"
    echo_success "配置已备份到: $backup_file"
}

# 恢复PM2配置
restore_pm2_config() {
    local backup_file=$1
    if [[ -z "$backup_file" ]]; then
        echo_error "请指定备份文件路径"
        echo "用法: $0 restore-config <backup_file>"
        exit 1
    fi

    if [[ ! -f "$backup_file" ]]; then
        echo_error "备份文件不存在: $backup_file"
        exit 1
    fi

    echo_step "从 $backup_file 恢复PM2配置..."
    scp "$backup_file" "$SERVER_USER@$SERVER_IP:~/.pm2/dump.pm2"
    ssh "$SERVER_USER@$SERVER_IP" "pm2 kill && pm2 resurrect"
    echo_success "配置恢复完成"
}

# 完整维护检查
full_maintenance() {
    echo_step "执行完整维护检查..."
    echo_info "这将执行以下操作:"
    echo_info "1. 清理异常进程"
    echo_info "2. 优化配置"
    echo_info "3. 重启服务"
    echo_info "4. 健康检查"
    echo_info "5. 备份配置"

    read -p "确认继续？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo_info "维护已取消"
        exit 0
    fi

    clean_pm2
    optimize_pm2
    restart_service
    health_check
    backup_pm2_config

    echo_success "完整维护检查完成"
}

# 主函数
main() {
    local action=${1:-help}

    echo_info "🛠️ PM2管理工具启动..."

    case $action in
        "status")
            check_server_connection
            show_status
            ;;
        "clean")
            check_server_connection
            clean_pm2
            ;;
        "restart")
            check_server_connection
            restart_service
            ;;
        "force-restart")
            check_server_connection
            force_restart_service
            ;;
        "logs")
            check_server_connection
            show_logs "${2:-50}"
            ;;
        "monitor")
            check_server_connection
            monitor_service
            ;;
        "health")
            check_server_connection
            health_check
            ;;
        "optimize")
            check_server_connection
            optimize_pm2
            ;;
        "backup-config")
            check_server_connection
            backup_pm2_config
            ;;
        "restore-config")
            check_server_connection
            restore_pm2_config "$2"
            ;;
        "maintenance")
            check_server_connection
            full_maintenance
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@"
