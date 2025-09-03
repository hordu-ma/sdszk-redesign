#!/bin/bash

# =============================================================================
# 双向数据库同步脚本 - 优化版
# 用于在开发环境和生产环境之间双向同步MongoDB数据
# =============================================================================

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

echo_header() {
    echo -e "\n${CYAN}=====================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}=====================================${NC}\n"
}

# 配置变量
PROD_SERVER="60.205.124.67"
PROD_USER="root"
PROD_DB="sdszk"
LOCAL_DB="sdszk"
BACKUP_DIR="database-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 检查依赖工具
check_dependencies() {
    echo_step "检查依赖工具..."

    local deps=("mongodump" "mongorestore" "ssh" "jq")
    local missing=()

    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done

    if [ ${#missing[@]} -ne 0 ]; then
        echo_error "缺少以下依赖工具: ${missing[*]}"
        echo_info "请安装缺少的工具："
        echo_info "  brew install mongodb/brew/mongodb-database-tools jq"
        exit 1
    fi

    echo_success "所有依赖工具检查通过"
}

# 测试SSH连接
test_ssh_connection() {
    echo_info "测试SSH连接到生产服务器..."
    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$PROD_USER@$PROD_SERVER" exit 2>/dev/null; then
        echo_success "SSH连接正常"
    else
        echo_error "无法连接到生产服务器 $PROD_USER@$PROD_SERVER"
        echo_info "请确保SSH密钥配置正确"
        exit 1
    fi
}

# 检查本地MongoDB连接
test_local_mongodb() {
    echo_info "测试本地MongoDB连接..."
    if mongosh "$LOCAL_DB" --eval "db.runCommand('ping')" --quiet > /dev/null 2>&1; then
        echo_success "本地MongoDB连接正常"
    else
        echo_error "无法连接到本地MongoDB"
        echo_info "请确保MongoDB服务正在运行"
        exit 1
    fi
}

# 检查生产环境MongoDB连接
test_prod_mongodb() {
    echo_info "测试生产环境MongoDB连接..."
    if ssh "$PROD_USER@$PROD_SERVER" "mongosh $PROD_DB --eval \"db.runCommand('ping')\" --quiet" > /dev/null 2>&1; then
        echo_success "生产环境MongoDB连接正常"
    else
        echo_error "无法连接到生产环境MongoDB"
        exit 1
    fi
}

# 获取数据库统计信息
get_db_stats() {
    local env=$1
    local db_name=$2

    if [ "$env" = "local" ]; then
        mongosh "$db_name" --eval "
            const stats = {};
            db.getCollectionNames().forEach(collection => {
                stats[collection] = db[collection].countDocuments();
            });
            console.log(JSON.stringify(stats, null, 2));
        " --quiet 2>/dev/null || echo "{}"
    else
        ssh "$PROD_USER@$PROD_SERVER" "mongosh $db_name --eval \"
            const stats = {};
            db.getCollectionNames().forEach(collection => {
                stats[collection] = db[collection].countDocuments();
            });
            console.log(JSON.stringify(stats, null, 2));
        \" --quiet" 2>/dev/null || echo "{}"
    fi
}

# 显示数据库统计对比
show_db_comparison() {
    echo_header "数据库统计对比"

    echo_info "获取数据库统计信息..."
    local local_stats=$(get_db_stats "local" "$LOCAL_DB")
    local prod_stats=$(get_db_stats "prod" "$PROD_DB")

    echo -e "\n${CYAN}本地环境统计:${NC}"
    echo "$local_stats" | jq -r 'to_entries[] | "  \(.key): \(.value) 条记录"' 2>/dev/null || echo "  无法获取统计信息"

    echo -e "\n${CYAN}生产环境统计:${NC}"
    echo "$prod_stats" | jq -r 'to_entries[] | "  \(.key): \(.value) 条记录"' 2>/dev/null || echo "  无法获取统计信息"
    echo
}

# 从生产环境同步到本地（开发环境）
sync_prod_to_dev() {
    echo_header "从生产环境同步到开发环境"

    echo_warning "⚠️ 此操作将覆盖本地开发环境的数据库！"
    echo_info "建议先备份本地数据"
    echo
    read -p "确认继续？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo_info "操作已取消"
        return
    fi

    # 备份本地数据
    backup_local_data

    # 从生产环境导出数据
    echo_step "从生产环境导出数据..."
    local prod_backup_file="prod-backup-$TIMESTAMP"
    ssh "$PROD_USER@$PROD_SERVER" "mongodump --db $PROD_DB --out /tmp/$prod_backup_file" > /dev/null

    # 下载备份文件
    echo_step "下载备份文件..."
    mkdir -p "$BACKUP_DIR/$prod_backup_file"
    scp -r "$PROD_USER@$PROD_SERVER:/tmp/$prod_backup_file/$PROD_DB" "$BACKUP_DIR/$prod_backup_file/" > /dev/null

    # 恢复到本地
    echo_step "恢复数据到本地环境..."
    mongorestore --db "$LOCAL_DB" --drop "$BACKUP_DIR/$prod_backup_file/$PROD_DB" > /dev/null

    # 清理远程临时文件
    ssh "$PROD_USER@$PROD_SERVER" "rm -rf /tmp/$prod_backup_file"

    echo_success "从生产环境同步到开发环境完成"

    # 显示同步后的统计
    show_sync_result "local"
}

# 从开发环境同步到生产环境
sync_dev_to_prod() {
    echo_header "从开发环境同步到生产环境"

    echo_error "🚨 危险操作：此操作将覆盖生产环境的数据库！"
    echo_warning "⚠️ 请确保您有充分的理由执行此操作"
    echo_info "建议操作："
    echo_info "1. 先备份生产环境数据"
    echo_info "2. 在测试环境验证数据正确性"
    echo_info "3. 通知相关团队成员"
    echo
    read -p "确认您要覆盖生产环境数据？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo_info "操作已取消"
        return
    fi

    echo
    read -p "请再次确认（输入 'CONFIRM' 继续）: " confirm
    if [ "$confirm" != "CONFIRM" ]; then
        echo_info "操作已取消"
        return
    fi

    # 备份生产环境数据
    backup_prod_data

    # 导出本地数据
    echo_step "导出本地数据..."
    local local_backup_file="local-to-prod-$TIMESTAMP"
    mongodump --db "$LOCAL_DB" --out "$BACKUP_DIR/$local_backup_file" > /dev/null

    # 上传到生产服务器
    echo_step "上传数据到生产服务器..."
    scp -r "$BACKUP_DIR/$local_backup_file" "$PROD_USER@$PROD_SERVER:/tmp/" > /dev/null

    # 在生产环境恢复数据
    echo_step "在生产环境恢复数据..."
    ssh "$PROD_USER@$PROD_SERVER" "mongorestore --db $PROD_DB --drop /tmp/$local_backup_file/$LOCAL_DB" > /dev/null

    # 清理临时文件
    ssh "$PROD_USER@$PROD_SERVER" "rm -rf /tmp/$local_backup_file"

    echo_success "从开发环境同步到生产环境完成"

    # 显示同步后的统计
    show_sync_result "prod"
}

# 备份本地数据
backup_local_data() {
    echo_step "备份本地数据..."
    local backup_file="local-backup-$TIMESTAMP"
    mongodump --db "$LOCAL_DB" --out "$BACKUP_DIR/$backup_file" > /dev/null
    echo_success "本地数据已备份到: $BACKUP_DIR/$backup_file"
}

# 备份生产环境数据
backup_prod_data() {
    echo_step "备份生产环境数据..."
    local backup_file="prod-backup-$TIMESTAMP"
    ssh "$PROD_USER@$PROD_SERVER" "mongodump --db $PROD_DB --out /tmp/$backup_file" > /dev/null

    # 下载备份
    mkdir -p "$BACKUP_DIR/$backup_file"
    scp -r "$PROD_USER@$PROD_SERVER:/tmp/$backup_file/$PROD_DB" "$BACKUP_DIR/$backup_file/" > /dev/null

    # 清理远程临时文件
    ssh "$PROD_USER@$PROD_SERVER" "rm -rf /tmp/$backup_file"

    echo_success "生产环境数据已备份到: $BACKUP_DIR/$backup_file"
}

# 显示同步结果
show_sync_result() {
    local target_env=$1
    echo_step "验证同步结果..."

    if [ "$target_env" = "local" ]; then
        local stats=$(get_db_stats "local" "$LOCAL_DB")
        echo_info "本地环境同步后统计:"
    else
        local stats=$(get_db_stats "prod" "$PROD_DB")
        echo_info "生产环境同步后统计:"
    fi

    echo "$stats" | jq -r 'to_entries[] | "  \(.key): \(.value) 条记录"' 2>/dev/null || echo "  无法获取统计信息"
}

# 恢复数据从备份
restore_from_backup() {
    echo_header "从备份恢复数据"

    # 列出可用备份
    echo_info "可用备份文件:"
    local backups=($(ls -1 "$BACKUP_DIR" | grep -E "backup-[0-9]{8}_[0-9]{6}$" | sort -r))

    if [ ${#backups[@]} -eq 0 ]; then
        echo_warning "未找到备份文件"
        return
    fi

    echo_info "选择要恢复的备份:"
    for i in "${!backups[@]}"; do
        echo "  $((i+1))) ${backups[$i]}"
    done
    echo "  0) 取消"

    read -p "请选择 [0-${#backups[@]}]: " choice

    if [ "$choice" = "0" ] || [ -z "$choice" ]; then
        echo_info "操作已取消"
        return
    fi

    if [ "$choice" -gt 0 ] && [ "$choice" -le "${#backups[@]}" ]; then
        local selected_backup="${backups[$((choice-1))]}"
        echo_info "选择的备份: $selected_backup"

        echo_warning "⚠️ 此操作将覆盖当前本地数据库！"
        read -p "确认继续？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo_step "恢复数据..."
            local restore_path="$BACKUP_DIR/$selected_backup/$PROD_DB"
            if [ -d "$restore_path" ]; then
                mongorestore --db "$LOCAL_DB" --drop "$restore_path" > /dev/null
                echo_success "数据恢复完成"
                show_sync_result "local"
            else
                echo_error "备份文件路径不存在: $restore_path"
            fi
        else
            echo_info "操作已取消"
        fi
    else
        echo_error "无效选择"
    fi
}

# 清理旧备份
cleanup_old_backups() {
    echo_header "清理旧备份文件"

    echo_info "查找7天前的备份文件..."
    local old_backups=$(find "$BACKUP_DIR" -name "*backup-*" -type d -mtime +7)

    if [ -z "$old_backups" ]; then
        echo_info "未找到需要清理的旧备份文件"
        return
    fi

    echo_info "找到以下旧备份文件:"
    echo "$old_backups"

    read -p "确认删除这些备份文件？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$old_backups" | xargs rm -rf
        echo_success "旧备份文件已清理"
    else
        echo_info "清理操作已取消"
    fi
}

# 启动SSH隧道
start_ssh_tunnel() {
    echo_header "启动SSH隧道连接"

    echo_info "启动MongoDB SSH隧道..."
    echo_info "本地端口: 27018"
    echo_info "远程端口: 27017"
    echo_info "连接字符串: mongodb://localhost:27018/sdszk"
    echo
    echo_warning "保持此终端窗口开启，按 Ctrl+C 断开连接"

    ssh -L 27018:127.0.0.1:27017 "$PROD_USER@$PROD_SERVER" -N
}

# 显示菜单
show_menu() {
    echo_header "数据库同步工具 - 优化版"
    echo "请选择操作："
    echo "  1) 从生产环境同步到开发环境"
    echo "  2) 从开发环境同步到生产环境 🚨"
    echo "  3) 仅备份本地数据"
    echo "  4) 仅备份生产环境数据"
    echo "  5) 从备份恢复数据"
    echo "  6) 查看数据库统计对比"
    echo "  7) 启动SSH隧道连接"
    echo "  8) 清理旧备份文件"
    echo "  0) 退出"
    echo
}

# 主函数
main() {
    echo_info "🚀 数据库同步工具启动..."

    # 检查依赖
    check_dependencies
    test_ssh_connection
    test_local_mongodb
    test_prod_mongodb

    echo_success "环境检查通过"

    # 如果有命令行参数，直接执行对应操作
    if [ $# -gt 0 ]; then
        case $1 in
            "prod-to-dev")
                sync_prod_to_dev
                ;;
            "dev-to-prod")
                sync_dev_to_prod
                ;;
            "backup-local")
                backup_local_data
                ;;
            "backup-prod")
                backup_prod_data
                ;;
            "stats")
                show_db_comparison
                ;;
            "tunnel")
                start_ssh_tunnel
                ;;
            *)
                echo_error "未知参数: $1"
                echo_info "可用参数: prod-to-dev, dev-to-prod, backup-local, backup-prod, stats, tunnel"
                exit 1
                ;;
        esac
        return
    fi

    # 交互式菜单
    while true; do
        show_menu
        read -p "请选择 [0-8]: " choice
        echo

        case $choice in
            1)
                sync_prod_to_dev
                ;;
            2)
                sync_dev_to_prod
                ;;
            3)
                backup_local_data
                ;;
            4)
                backup_prod_data
                ;;
            5)
                restore_from_backup
                ;;
            6)
                show_db_comparison
                ;;
            7)
                start_ssh_tunnel
                ;;
            8)
                cleanup_old_backups
                ;;
            0)
                echo_info "退出程序"
                exit 0
                ;;
            *)
                echo_error "无效选择，请重新输入"
                ;;
        esac

        echo
        read -p "按回车键继续..." -r
        echo
    done
}

# 执行主函数
main "$@"
