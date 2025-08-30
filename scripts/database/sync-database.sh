#!/bin/bash

# 数据库同步脚本
# 用于在开发环境和生产环境之间同步MongoDB数据

set -e

# 颜色输出函数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_header() {
    echo -e "\n${BLUE}=====================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=====================================${NC}\n"
}

# 配置变量
PROD_SERVER="60.205.124.67"
PROD_USER="root"
PROD_DB="sdszk"
LOCAL_DB="sdszk"
BACKUP_DIR="database-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 显示菜单
show_menu() {
    echo_header "数据库同步工具"
    echo "请选择操作："
    echo "1) 从生产环境备份数据到本地"
    echo "2) 将生产环境数据同步到本地开发环境"
    echo "3) 备份本地数据"
    echo "4) 恢复本地数据（从备份文件）"
    echo "5) 通过SSH隧道连接生产环境"
    echo "6) 查看备份文件列表"
    echo "7) 清理旧备份文件"
    echo "0) 退出"
    echo
}

# 检查依赖
check_dependencies() {
    echo_info "检查依赖工具..."

    # 检查 mongodump
    if ! command -v mongodump &> /dev/null; then
        echo_error "mongodump 未安装，请安装 MongoDB Tools"
        echo_info "安装方法: brew install mongodb/brew/mongodb-database-tools"
        exit 1
    fi

    # 检查 mongorestore
    if ! command -v mongorestore &> /dev/null; then
        echo_error "mongorestore 未安装，请安装 MongoDB Tools"
        exit 1
    fi

    # 检查 ssh
    if ! command -v ssh &> /dev/null; then
        echo_error "ssh 未安装"
        exit 1
    fi

    echo_success "所有依赖工具检查通过"
}

# 测试SSH连接
test_ssh_connection() {
    echo_info "测试SSH连接到生产服务器..."
    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$PROD_USER@$PROD_SERVER" "echo 'SSH连接测试成功'" 2>/dev/null; then
        echo_success "SSH连接正常"
        return 0
    else
        echo_error "SSH连接失败，请检查："
        echo "  1. 服务器地址和用户名是否正确"
        echo "  2. SSH密钥是否已配置"
        echo "  3. 网络连接是否正常"
        return 1
    fi
}

# 从生产环境备份数据
backup_from_production() {
    echo_header "从生产环境备份数据"

    if ! test_ssh_connection; then
        return 1
    fi

    local backup_name="production-backup-${TIMESTAMP}"
    local backup_path="${BACKUP_DIR}/${backup_name}"

    echo_info "正在从生产环境备份数据..."
    echo_info "备份路径: ${backup_path}"

    # 通过SSH执行远程mongodump
    ssh "$PROD_USER@$PROD_SERVER" "mongodump --db $PROD_DB --out /tmp/${backup_name}" || {
        echo_error "远程备份失败"
        return 1
    }

    # 压缩远程备份
    ssh "$PROD_USER@$PROD_SERVER" "cd /tmp && tar czf ${backup_name}.tar.gz ${backup_name}/" || {
        echo_error "远程压缩失败"
        return 1
    }

    # 下载备份文件
    echo_info "正在下载备份文件..."
    scp "$PROD_USER@$PROD_SERVER:/tmp/${backup_name}.tar.gz" "${backup_path}.tar.gz" || {
        echo_error "备份文件下载失败"
        return 1
    }

    # 清理远程临时文件
    ssh "$PROD_USER@$PROD_SERVER" "rm -rf /tmp/${backup_name} /tmp/${backup_name}.tar.gz"

    # 解压本地备份文件
    echo_info "正在解压备份文件..."
    cd "$BACKUP_DIR"
    tar xzf "${backup_name}.tar.gz" || {
        echo_error "解压备份文件失败"
        return 1
    }
    mv "$backup_name" "${backup_name}-extracted"
    cd ..

    echo_success "生产环境数据备份完成: ${backup_path}.tar.gz"
    echo_info "解压后的数据位于: ${backup_path}-extracted/"
}

# 同步生产环境数据到本地
sync_from_production() {
    echo_header "同步生产环境数据到本地"

    echo_warning "此操作将完全替换本地数据库内容，是否继续？[y/N]"
    read -r confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo_info "操作已取消"
        return 0
    fi

    # 先备份本地数据
    echo_info "正在备份本地数据..."
    backup_local_data

    # 从生产环境获取数据
    if ! backup_from_production; then
        echo_error "从生产环境获取数据失败"
        return 1
    fi

    # 恢复到本地数据库
    local latest_backup=$(ls -t "${BACKUP_DIR}"/production-backup-*-extracted/ 2>/dev/null | head -1)
    if [ -z "$latest_backup" ]; then
        echo_error "没有找到可用的生产环境备份"
        return 1
    fi

    echo_info "正在将生产环境数据恢复到本地数据库..."

    # 删除本地数据库
    echo_info "清空本地数据库..."
    mongosh "$LOCAL_DB" --eval "db.dropDatabase()" || {
        echo_error "清空本地数据库失败"
        return 1
    }

    # 恢复数据
    mongorestore --db "$LOCAL_DB" "${latest_backup}/${PROD_DB}/" || {
        echo_error "数据恢复失败"
        return 1
    }

    echo_success "生产环境数据已成功同步到本地开发环境"
    echo_info "请重启开发服务器以清除缓存"
}

# 备份本地数据
backup_local_data() {
    echo_header "备份本地数据"

    local backup_name="local-backup-${TIMESTAMP}"
    local backup_path="${BACKUP_DIR}/${backup_name}"

    echo_info "正在备份本地数据..."
    echo_info "备份路径: ${backup_path}"

    mongodump --db "$LOCAL_DB" --out "$backup_path" || {
        echo_error "本地数据备份失败"
        return 1
    }

    # 压缩备份
    cd "$BACKUP_DIR"
    tar czf "${backup_name}.tar.gz" "$backup_name/" || {
        echo_error "压缩备份失败"
        return 1
    }
    rm -rf "$backup_name"
    cd ..

    echo_success "本地数据备份完成: ${backup_path}.tar.gz"
}

# 恢复本地数据
restore_local_data() {
    echo_header "恢复本地数据"

    # 列出可用的备份文件
    echo_info "可用的备份文件："
    local backups=($(ls -t "${BACKUP_DIR}"/*.tar.gz 2>/dev/null))

    if [ ${#backups[@]} -eq 0 ]; then
        echo_warning "没有找到备份文件"
        return 1
    fi

    for i in "${!backups[@]}"; do
        echo "  $((i+1))) $(basename "${backups[i]}")"
    done

    echo
    echo_info "请选择要恢复的备份文件 (输入数字):"
    read -r selection

    if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt ${#backups[@]} ]; then
        echo_error "无效的选择"
        return 1
    fi

    local selected_backup="${backups[$((selection-1))]}"
    echo_info "选择的备份: $(basename "$selected_backup")"

    echo_warning "此操作将完全替换本地数据库内容，是否继续？[y/N]"
    read -r confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo_info "操作已取消"
        return 0
    fi

    # 解压备份文件
    local temp_dir="/tmp/restore-${TIMESTAMP}"
    mkdir -p "$temp_dir"
    tar xzf "$selected_backup" -C "$temp_dir" || {
        echo_error "解压备份文件失败"
        rm -rf "$temp_dir"
        return 1
    }

    # 找到数据库目录
    local db_dir=$(find "$temp_dir" -name "$LOCAL_DB" -type d | head -1)
    if [ -z "$db_dir" ]; then
        echo_error "在备份文件中没有找到数据库 $LOCAL_DB"
        rm -rf "$temp_dir"
        return 1
    fi

    # 删除本地数据库
    echo_info "清空本地数据库..."
    mongosh "$LOCAL_DB" --eval "db.dropDatabase()" || {
        echo_error "清空本地数据库失败"
        rm -rf "$temp_dir"
        return 1
    }

    # 恢复数据
    echo_info "正在恢复数据..."
    mongorestore --db "$LOCAL_DB" "$db_dir" || {
        echo_error "数据恢复失败"
        rm -rf "$temp_dir"
        return 1
    }

    # 清理临时文件
    rm -rf "$temp_dir"

    echo_success "数据恢复完成"
}

# 通过SSH隧道连接生产环境
ssh_tunnel() {
    echo_header "建立SSH隧道连接生产环境"

    if ! test_ssh_connection; then
        return 1
    fi

    echo_info "正在建立SSH隧道..."
    echo_info "本地端口: 27018"
    echo_info "远程端口: 27017"
    echo_info "连接字符串: mongodb://localhost:27018/$PROD_DB"
    echo_warning "保持此终端窗口打开，按 Ctrl+C 断开连接"
    echo

    # 建立SSH隧道
    ssh -L 27018:127.0.0.1:27017 "$PROD_USER@$PROD_SERVER" -N
}

# 查看备份文件列表
list_backups() {
    echo_header "备份文件列表"

    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        echo_warning "没有找到备份文件"
        return 0
    fi

    echo_info "备份文件："
    ls -lah "$BACKUP_DIR"/*.tar.gz 2>/dev/null | while read -r line; do
        echo "  $line"
    done

    echo
    echo_info "备份目录总大小:"
    du -sh "$BACKUP_DIR" 2>/dev/null || echo "无法计算大小"
}

# 清理旧备份文件
cleanup_backups() {
    echo_header "清理旧备份文件"

    if [ ! -d "$BACKUP_DIR" ]; then
        echo_warning "备份目录不存在"
        return 0
    fi

    echo_info "当前备份文件："
    ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -10 | while read -r file; do
        echo "  $(basename "$file")"
    done

    echo
    echo_info "保留最新几个备份文件？[默认: 5]"
    read -r keep_count
    keep_count=${keep_count:-5}

    if ! [[ "$keep_count" =~ ^[0-9]+$ ]] || [ "$keep_count" -lt 1 ]; then
        echo_error "无效的数量"
        return 1
    fi

    echo_warning "将保留最新的 $keep_count 个备份文件，删除其余文件。是否继续？[y/N]"
    read -r confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo_info "操作已取消"
        return 0
    fi

    # 删除旧文件
    local deleted_count=0
    ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +$((keep_count + 1)) | while read -r file; do
        echo_info "删除: $(basename "$file")"
        rm -f "$file"
        ((deleted_count++))
    done

    # 清理解压的目录
    find "$BACKUP_DIR" -type d -name "*-extracted" -exec rm -rf {} + 2>/dev/null

    echo_success "清理完成"
}

# 主函数
main() {
    # 检查依赖
    check_dependencies

    while true; do
        show_menu
        echo_info "请输入选项 [0-7]:"
        read -r choice

        case $choice in
            1)
                backup_from_production
                ;;
            2)
                sync_from_production
                ;;
            3)
                backup_local_data
                ;;
            4)
                restore_local_data
                ;;
            5)
                ssh_tunnel
                ;;
            6)
                list_backups
                ;;
            7)
                cleanup_backups
                ;;
            0)
                echo_info "退出"
                exit 0
                ;;
            *)
                echo_error "无效选项，请重新选择"
                ;;
        esac

        echo
        echo_info "按回车键继续..."
        read -r
    done
}

# 如果直接运行脚本，则执行主函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
