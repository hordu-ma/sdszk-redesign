#!/bin/bash

# 备份清理和磁盘维护脚本 v1.0
# 用于清理过期备份、临时文件和释放磁盘空间
#
# 使用方法:
#   ./cleanup-backups.sh                    # 交互式模式
#   ./cleanup-backups.sh --auto             # 自动模式（保留5个备份）
#   ./cleanup-backups.sh --keep 10          # 保留指定数量的备份
#   ./cleanup-backups.sh --emergency        # 紧急模式（只保留2个备份）
#   ./cleanup-backups.sh --dry-run          # 模拟运行，不实际删除

set -euo pipefail

# 配置变量
SERVER_IP="60.205.124.67"
SERVER_USER="root"
SSH_OPTS="-o ConnectTimeout=10 -o StrictHostKeyChecking=no"
BACKUP_BASE_PATH="/var/www"
TEMP_CLEANUP_PATHS="/tmp"
DEFAULT_KEEP_COUNT=5
EMERGENCY_KEEP_COUNT=2
LOG_FILE="/tmp/backup-cleanup-$(date +%Y%m%d_%H%M%S).log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    echo -e "${BLUE}🔄 $1${NC}" | tee -a "$LOG_FILE"
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

# 显示帮助信息
show_help() {
    cat << EOF
备份清理和磁盘维护脚本 v1.0

使用方法:
    $0 [选项]

选项:
    --auto              自动模式，保留${DEFAULT_KEEP_COUNT}个最新备份
    --keep N            保留指定数量的备份
    --emergency         紧急模式，只保留${EMERGENCY_KEEP_COUNT}个最新备份
    --dry-run           模拟运行，显示将要删除的文件但不实际删除
    --temp-only         仅清理临时文件，不清理备份
    --help              显示此帮助信息

示例:
    $0                          # 交互式模式
    $0 --auto                   # 自动保留5个备份
    $0 --keep 10               # 保留10个备份
    $0 --emergency             # 紧急清理，仅保留2个备份
    $0 --dry-run --keep 3      # 模拟保留3个备份的清理

日志文件: $LOG_FILE
EOF
}

# 检查服务器连接
check_connection() {
    echo_step "检查服务器连接..."
    if safe_ssh 10 "echo 'Connected'" > /dev/null 2>&1; then
        echo_success "服务器连接正常"
    else
        echo_error "无法连接到服务器 $SERVER_IP"
        exit 1
    fi
}

# 获取磁盘使用情况
get_disk_usage() {
    echo_step "检查磁盘使用情况..."

    local disk_info=$(safe_ssh 30 "df -h / | tail -1")
    local usage_percent=$(echo "$disk_info" | awk '{print $5}' | sed 's/%//')
    local available=$(echo "$disk_info" | awk '{print $4}')

    echo_info "磁盘使用率: ${usage_percent}%"
    echo_info "可用空间: $available"

    if [ "$usage_percent" -gt 90 ]; then
        echo_error "⚠️ 磁盘使用率超过90%，强烈建议清理！"
        return 2
    elif [ "$usage_percent" -gt 80 ]; then
        echo_warning "磁盘使用率超过80%，建议清理"
        return 1
    else
        echo_success "磁盘使用率正常"
        return 0
    fi
}

# 统计备份文件
count_backups() {
    echo_step "统计备份文件..."

    local count_script="
        cd $BACKUP_BASE_PATH 2>/dev/null || exit 1
        backend_count=\$(ls -1d sdszk-backend-backup-* 2>/dev/null | wc -l)
        frontend_count=\$(ls -1d frontend-backup-* 2>/dev/null | wc -l)

        echo \"backend_backups:\$backend_count\"
        echo \"frontend_backups:\$frontend_count\"

        if [ \$backend_count -gt 0 ]; then
            echo \"=== 后端备份列表 ===\"
            ls -dt sdszk-backend-backup-* 2>/dev/null | head -10
        fi

        if [ \$frontend_count -gt 0 ]; then
            echo \"=== 前端备份列表 (最新10个) ===\"
            ls -dt frontend-backup-* 2>/dev/null | head -10
        fi
    "

    local result=$(safe_ssh_script 60 "$count_script")
    local backend_count=$(echo "$result" | grep "backend_backups:" | cut -d: -f2)
    local frontend_count=$(echo "$result" | grep "frontend_backups:" | cut -d: -f2)

    echo_info "后端备份数量: $backend_count"
    echo_info "前端备份数量: $frontend_count"

    echo "$result" | grep -v "backups:" | tee -a "$LOG_FILE"

    echo "$backend_count $frontend_count"
}

# 清理后端备份
cleanup_backend_backups() {
    local keep_count=$1
    local dry_run=${2:-false}

    echo_step "清理后端备份 (保留 $keep_count 个)..."

    local cleanup_script="
        cd $BACKUP_BASE_PATH 2>/dev/null || exit 1

        backup_count=\$(ls -1d sdszk-backend-backup-* 2>/dev/null | wc -l)
        echo \"当前后端备份数量: \$backup_count\"

        if [ \$backup_count -le $keep_count ]; then
            echo \"备份数量不超过 $keep_count 个，无需清理\"
            exit 0
        fi

        to_delete=\$((\$backup_count - $keep_count))
        echo \"需要删除 \$to_delete 个旧备份\"

        ls -dt sdszk-backend-backup-* 2>/dev/null | tail -n +\$(($keep_count + 1)) | while read dir; do
            if [ -d \"\$dir\" ]; then
                size=\$(du -sh \"\$dir\" | cut -f1)
                if [ \"$dry_run\" = \"true\" ]; then
                    echo \"[DRY-RUN] 将删除: \$dir (大小: \$size)\"
                else
                    echo \"正在删除: \$dir (大小: \$size)\"
                    rm -rf \"\$dir\"
                fi
            fi
        done

        if [ \"$dry_run\" != \"true\" ]; then
            remaining=\$(ls -1d sdszk-backend-backup-* 2>/dev/null | wc -l)
            echo \"清理后剩余备份数量: \$remaining\"
        fi
    "

    if safe_ssh_script 120 "$cleanup_script"; then
        if [ "$dry_run" = "true" ]; then
            echo_success "模拟清理完成"
        else
            echo_success "后端备份清理完成"
        fi
    else
        echo_error "后端备份清理失败"
        return 1
    fi
}

# 清理前端备份
cleanup_frontend_backups() {
    local keep_count=$1
    local dry_run=${2:-false}

    echo_step "清理前端备份 (保留 $keep_count 个)..."

    local cleanup_script="
        cd $BACKUP_BASE_PATH 2>/dev/null || exit 1

        backup_count=\$(ls -1d frontend-backup-* 2>/dev/null | wc -l)
        echo \"当前前端备份数量: \$backup_count\"

        if [ \$backup_count -le $keep_count ]; then
            echo \"前端备份数量不超过 $keep_count 个，无需清理\"
            exit 0
        fi

        to_delete=\$((\$backup_count - $keep_count))
        echo \"需要删除 \$to_delete 个旧前端备份\"

        ls -dt frontend-backup-* 2>/dev/null | tail -n +\$(($keep_count + 1)) | while read dir; do
            if [ -d \"\$dir\" ]; then
                size=\$(du -sh \"\$dir\" | cut -f1)
                if [ \"$dry_run\" = \"true\" ]; then
                    echo \"[DRY-RUN] 将删除: \$dir (大小: \$size)\"
                else
                    echo \"正在删除: \$dir (大小: \$size)\"
                    rm -rf \"\$dir\"
                fi
            fi
        done

        if [ \"$dry_run\" != \"true\" ]; then
            remaining=\$(ls -1d frontend-backup-* 2>/dev/null | wc -l)
            echo \"清理后剩余前端备份数量: \$remaining\"
        fi
    "

    if safe_ssh_script 120 "$cleanup_script"; then
        if [ "$dry_run" = "true" ]; then
            echo_success "前端备份模拟清理完成"
        else
            echo_success "前端备份清理完成"
        fi
    else
        echo_error "前端备份清理失败"
        return 1
    fi
}

# 清理临时文件
cleanup_temp_files() {
    local dry_run=${1:-false}

    echo_step "清理临时文件..."

    local cleanup_script="
        echo \"=== 清理 /tmp 目录 ===\"

        # 清理部署相关临时文件
        find /tmp -name 'sdszk-*deploy*.zip' -mtime +1 2>/dev/null | while read file; do
            if [ -f \"\$file\" ]; then
                size=\$(du -sh \"\$file\" | cut -f1)
                if [ \"$dry_run\" = \"true\" ]; then
                    echo \"[DRY-RUN] 将删除临时文件: \$file (大小: \$size)\"
                else
                    echo \"删除临时文件: \$file (大小: \$size)\"
                    rm -f \"\$file\"
                fi
            fi
        done

        # 清理诊断日志文件（保留最近1天的）
        find /tmp -name '*diagnosis*.log' -mtime +1 2>/dev/null | while read file; do
            if [ -f \"\$file\" ]; then
                if [ \"$dry_run\" = \"true\" ]; then
                    echo \"[DRY-RUN] 将删除诊断日志: \$file\"
                else
                    echo \"删除诊断日志: \$file\"
                    rm -f \"\$file\"
                fi
            fi
        done

        # 清理旧的回滚信息文件
        find /tmp -name '*rollback*.info' -mtime +7 2>/dev/null | while read file; do
            if [ -f \"\$file\" ]; then
                if [ \"$dry_run\" = \"true\" ]; then
                    echo \"[DRY-RUN] 将删除回滚信息: \$file\"
                else
                    echo \"删除回滚信息: \$file\"
                    rm -f \"\$file\"
                fi
            fi
        done

        echo \"临时文件清理完成\"
    "

    if safe_ssh_script 60 "$cleanup_script"; then
        if [ "$dry_run" = "true" ]; then
            echo_success "临时文件模拟清理完成"
        else
            echo_success "临时文件清理完成"
        fi
    else
        echo_error "临时文件清理失败"
        return 1
    fi
}

# 交互式模式
interactive_mode() {
    echo_info "=== 交互式清理模式 ==="

    # 显示当前状态
    get_disk_usage
    echo ""

    local counts=$(count_backups)
    local backend_count=$(echo "$counts" | cut -d' ' -f1)
    local frontend_count=$(echo "$counts" | cut -d' ' -f2)

    echo ""
    echo_info "请选择清理选项："
    echo "1) 清理后端备份 (当前: $backend_count 个)"
    echo "2) 清理前端备份 (当前: $frontend_count 个)"
    echo "3) 清理临时文件"
    echo "4) 全部清理"
    echo "5) 退出"
    echo ""

    read -p "请选择 (1-5): " choice

    case $choice in
        1)
            read -p "保留多少个后端备份? (默认: $DEFAULT_KEEP_COUNT): " keep_count
            keep_count=${keep_count:-$DEFAULT_KEEP_COUNT}
            cleanup_backend_backups "$keep_count" false
            ;;
        2)
            read -p "保留多少个前端备份? (默认: $DEFAULT_KEEP_COUNT): " keep_count
            keep_count=${keep_count:-$DEFAULT_KEEP_COUNT}
            cleanup_frontend_backups "$keep_count" false
            ;;
        3)
            cleanup_temp_files false
            ;;
        4)
            read -p "保留多少个备份? (默认: $DEFAULT_KEEP_COUNT): " keep_count
            keep_count=${keep_count:-$DEFAULT_KEEP_COUNT}
            cleanup_backend_backups "$keep_count" false
            cleanup_frontend_backups "$keep_count" false
            cleanup_temp_files false
            ;;
        5)
            echo_info "退出清理"
            exit 0
            ;;
        *)
            echo_error "无效选择"
            exit 1
            ;;
    esac
}

# 生成清理报告
generate_cleanup_report() {
    echo_step "生成清理报告..."

    echo ""
    echo "======================================"
    echo "📊 清理完成报告"
    echo "======================================"
    echo "• 清理时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "• 服务器: $SERVER_IP"

    # 显示最终状态
    get_disk_usage
    count_backups > /dev/null

    echo "• 日志文件: $LOG_FILE"
    echo "======================================"
    echo ""

    echo_success "🎉 清理任务完成！"
}

# 主函数
main() {
    local keep_count=$DEFAULT_KEEP_COUNT
    local dry_run=false
    local auto_mode=false
    local emergency_mode=false
    local temp_only=false

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --auto)
                auto_mode=true
                shift
                ;;
            --keep)
                keep_count="$2"
                auto_mode=true
                shift 2
                ;;
            --emergency)
                emergency_mode=true
                keep_count=$EMERGENCY_KEEP_COUNT
                auto_mode=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            --temp-only)
                temp_only=true
                auto_mode=true
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

    # 初始化
    echo_info "🧹 备份清理和磁盘维护脚本 v1.0"
    echo_info "日志文件: $LOG_FILE"
    echo ""

    # 检查连接
    check_connection

    if [ "$dry_run" = "true" ]; then
        echo_warning "⚠️ 模拟运行模式 - 不会实际删除文件"
        echo ""
    fi

    if [ "$emergency_mode" = "true" ]; then
        echo_warning "🚨 紧急清理模式 - 仅保留 $EMERGENCY_KEEP_COUNT 个备份"
        echo ""
    fi

    # 执行清理
    if [ "$auto_mode" = "true" ]; then
        if [ "$temp_only" = "true" ]; then
            cleanup_temp_files "$dry_run"
        else
            cleanup_backend_backups "$keep_count" "$dry_run"
            cleanup_frontend_backups "$keep_count" "$dry_run"
            cleanup_temp_files "$dry_run"
        fi
    else
        interactive_mode
    fi

    # 生成报告
    if [ "$dry_run" != "true" ]; then
        generate_cleanup_report
    else
        echo_info "模拟运行完成，查看日志: $LOG_FILE"
    fi
}

# 错误处理
trap 'echo_error "脚本执行出错，退出码: $?"' ERR

# 执行主函数
main "$@"
