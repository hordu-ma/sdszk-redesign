#!/bin/bash

# =============================================================================
# 生产环境文件同步脚本
# 用于将生产环境上传的PDF文件同步到开发环境
# =============================================================================

set -euo pipefail

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
SERVER_DIR="$PROJECT_ROOT/server"

# 生产环境配置
PROD_HOST="60.205.124.67"
PROD_USER="root"
PROD_UPLOADS_PATH="/var/www/sdszk/uploads"
PROD_DB_URI="mongodb://localhost:27017/sdszk"

# 本地配置
LOCAL_UPLOADS_PATH="$SERVER_DIR/uploads"
LOCAL_DB_URI="mongodb://localhost:27017/sdszk"

# 日志文件
LOG_FILE="$SCRIPT_DIR/sync-$(date +%Y%m%d-%H%M%S).log"
MISSING_FILES_LIST="$SCRIPT_DIR/missing-files-$(date +%Y%m%d-%H%M%S).txt"

# 函数：打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}" | tee -a "$LOG_FILE"
}

print_info() {
    print_message "$BLUE" "ℹ️  $1"
}

print_success() {
    print_message "$GREEN" "✅ $1"
}

print_warning() {
    print_message "$YELLOW" "⚠️  $1"
}

print_error() {
    print_message "$RED" "❌ $1"
}

# 函数：检查依赖
check_dependencies() {
    print_info "检查依赖工具..."

    local missing_deps=()

    if ! command -v ssh &> /dev/null; then
        missing_deps+=("ssh")
    fi

    if ! command -v rsync &> /dev/null; then
        missing_deps+=("rsync")
    fi

    if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
        missing_deps+=("mongosh 或 mongo")
    fi

    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "缺少必要工具: ${missing_deps[*]}"
        print_info "请安装缺少的工具后重试"
        exit 1
    fi

    print_success "依赖检查通过"
}

# 函数：测试SSH连接
test_ssh_connection() {
    print_info "测试生产环境SSH连接..."

    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$PROD_USER@$PROD_HOST" exit 2>/dev/null; then
        print_success "SSH连接测试成功"
    else
        print_error "无法连接到生产环境"
        print_info "请确保："
        print_info "1. SSH密钥已配置"
        print_info "2. 网络连接正常"
        print_info "3. 服务器地址正确: $PROD_USER@$PROD_HOST"
        exit 1
    fi
}

# 函数：获取数据库中的文件列表
get_database_files() {
    print_info "获取数据库中的文件列表..."

    local temp_script=$(mktemp)
    cat > "$temp_script" << 'EOF'
const { MongoClient } = require('mongodb');

async function getFileUrls() {
    const client = new MongoClient(process.argv[2]);
    try {
        await client.connect();
        const db = client.db('sdszk');
        const resources = await db.collection('resources').find({}, {
            projection: { fileUrl: 1, title: 1, createdAt: 1 }
        }).toArray();

        const files = resources
            .filter(r => r.fileUrl && r.fileUrl.startsWith('/uploads/'))
            .map(r => ({
                fileUrl: r.fileUrl,
                title: r.title,
                createdAt: r.createdAt
            }));

        console.log(JSON.stringify(files, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

getFileUrls();
EOF

    if command -v node &> /dev/null; then
        local files_json=$(node "$temp_script" "$LOCAL_DB_URI" 2>>"$LOG_FILE")
        rm -f "$temp_script"
        echo "$files_json"
    else
        rm -f "$temp_script"
        print_error "需要Node.js来查询数据库"
        exit 1
    fi
}

# 函数：检查本地文件存在性
check_local_files() {
    print_info "检查本地文件存在性..."

    local files_json="$1"
    local missing_files=()
    local existing_files=()

    while IFS= read -r file_info; do
        local file_url=$(echo "$file_info" | jq -r '.fileUrl')
        local title=$(echo "$file_info" | jq -r '.title')
        local created_at=$(echo "$file_info" | jq -r '.createdAt')

        if [ "$file_url" != "null" ] && [ -n "$file_url" ]; then
            local local_path="$LOCAL_UPLOADS_PATH${file_url#/uploads}"

            if [ -f "$local_path" ]; then
                existing_files+=("$file_url")
            else
                missing_files+=("$file_url|$title|$created_at")
                echo "$file_url" >> "$MISSING_FILES_LIST"
            fi
        fi
    done <<< $(echo "$files_json" | jq -c '.[]')

    print_info "文件统计："
    print_info "  总文件数: $(echo "$files_json" | jq length)"
    print_info "  本地存在: ${#existing_files[@]}"
    print_info "  缺失文件: ${#missing_files[@]}"

    if [ ${#missing_files[@]} -gt 0 ]; then
        print_warning "缺失文件列表已保存到: $MISSING_FILES_LIST"

        print_info "前10个缺失文件："
        local count=0
        for file_entry in "${missing_files[@]}"; do
            if [ $count -ge 10 ]; then break; fi

            IFS='|' read -r file_url title created_at <<< "$file_entry"
            print_info "  $((count+1)). $title"
            print_info "     文件: $file_url"
            print_info "     创建: $created_at"
            echo ""
            ((count++))
        done
    fi

    echo "${#missing_files[@]}"
}

# 函数：检查生产环境文件存在性
check_production_files() {
    print_info "检查生产环境文件存在性..."

    local missing_count=0
    local found_count=0
    local prod_missing=()

    while IFS= read -r file_url; do
        if [ -n "$file_url" ]; then
            local prod_path="$PROD_UPLOADS_PATH${file_url#/uploads}"

            if ssh "$PROD_USER@$PROD_HOST" "[ -f '$prod_path' ]" 2>/dev/null; then
                ((found_count++))
            else
                ((missing_count++))
                prod_missing+=("$file_url")
            fi
        fi
    done < "$MISSING_FILES_LIST"

    print_info "生产环境文件检查结果："
    print_info "  找到文件: $found_count"
    print_info "  缺失文件: $missing_count"

    if [ ${#prod_missing[@]} -gt 0 ]; then
        print_warning "生产环境也缺失的文件："
        for missing_file in "${prod_missing[@]}"; do
            print_warning "  $missing_file"
        done
    fi

    echo "$found_count"
}

# 函数：从生产环境同步文件
sync_files_from_production() {
    local files_to_sync="$1"

    print_info "开始从生产环境同步文件..."
    print_info "准备同步 $files_to_sync 个文件"

    # 确保本地目录存在
    mkdir -p "$LOCAL_UPLOADS_PATH/documents"
    mkdir -p "$LOCAL_UPLOADS_PATH/images"
    mkdir -p "$LOCAL_UPLOADS_PATH/videos"

    local synced_count=0
    local failed_count=0

    while IFS= read -r file_url; do
        if [ -n "$file_url" ]; then
            local relative_path="${file_url#/uploads/}"
            local local_path="$LOCAL_UPLOADS_PATH/$relative_path"
            local local_dir=$(dirname "$local_path")
            local prod_path="$PROD_UPLOADS_PATH/$relative_path"

            # 确保本地目录存在
            mkdir -p "$local_dir"

            print_info "同步: $file_url"

            if rsync -avz --progress "$PROD_USER@$PROD_HOST:$prod_path" "$local_path" 2>>"$LOG_FILE"; then
                ((synced_count++))
                print_success "  ✓ 同步成功"
            else
                ((failed_count++))
                print_error "  ✗ 同步失败"
            fi
        fi
    done < "$MISSING_FILES_LIST"

    print_success "文件同步完成："
    print_success "  成功: $synced_count"
    if [ $failed_count -gt 0 ]; then
        print_warning "  失败: $failed_count"
    fi
}

# 函数：验证同步结果
verify_sync_result() {
    print_info "验证同步结果..."

    local verified_count=0
    local still_missing=0

    while IFS= read -r file_url; do
        if [ -n "$file_url" ]; then
            local local_path="$LOCAL_UPLOADS_PATH${file_url#/uploads}"

            if [ -f "$local_path" ]; then
                ((verified_count++))
            else
                ((still_missing++))
                print_warning "仍然缺失: $file_url"
            fi
        fi
    done < "$MISSING_FILES_LIST"

    print_success "验证结果："
    print_success "  已修复: $verified_count"
    if [ $still_missing -gt 0 ]; then
        print_warning "  仍缺失: $still_missing"
    fi
}

# 函数：创建文件备份
create_backup() {
    print_info "创建本地文件备份..."

    local backup_dir="$PROJECT_ROOT/backups/uploads-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"

    if [ -d "$LOCAL_UPLOADS_PATH" ]; then
        cp -r "$LOCAL_UPLOADS_PATH"/* "$backup_dir/" 2>/dev/null || true
        print_success "备份创建完成: $backup_dir"
    else
        print_warning "本地uploads目录不存在，跳过备份"
    fi
}

# 函数：显示使用帮助
show_help() {
    echo "生产环境文件同步脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -c, --check    仅检查文件状态，不进行同步"
    echo "  -s, --sync     检查并同步缺失文件"
    echo "  -f, --force    强制同步所有文件（覆盖本地文件）"
    echo "  -b, --backup   同步前创建备份"
    echo ""
    echo "示例:"
    echo "  $0 --check           # 仅检查文件状态"
    echo "  $0 --sync --backup   # 创建备份后同步文件"
    echo "  $0 --force           # 强制同步所有文件"
    echo ""
}

# 主函数
main() {
    local action="check"
    local create_backup_flag=false
    local force_sync=false

    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--check)
                action="check"
                shift
                ;;
            -s|--sync)
                action="sync"
                shift
                ;;
            -f|--force)
                action="force"
                force_sync=true
                shift
                ;;
            -b|--backup)
                create_backup_flag=true
                shift
                ;;
            *)
                print_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done

    print_info "生产环境文件同步工具启动"
    print_info "日志文件: $LOG_FILE"
    print_info "操作模式: $action"
    echo ""

    # 执行预检查
    check_dependencies
    test_ssh_connection

    # 创建备份（如果需要）
    if [ "$create_backup_flag" = true ]; then
        create_backup
    fi

    # 获取数据库文件列表
    local files_json=$(get_database_files)
    if [ -z "$files_json" ] || [ "$files_json" = "[]" ]; then
        print_warning "数据库中没有找到文件记录"
        exit 0
    fi

    # 检查本地文件
    local missing_count=$(check_local_files "$files_json")

    if [ "$missing_count" -eq 0 ]; then
        print_success "所有文件都存在，无需同步"
        exit 0
    fi

    # 检查生产环境文件
    local available_count=$(check_production_files)

    if [ "$available_count" -eq 0 ]; then
        print_error "生产环境也没有找到缺失的文件"
        exit 1
    fi

    # 根据操作模式执行
    case $action in
        "check")
            print_info "检查完成，使用 --sync 参数开始同步"
            ;;
        "sync"|"force")
            sync_files_from_production "$available_count"
            verify_sync_result
            print_success "同步操作完成"
            ;;
    esac

    print_info "操作完成，详细日志请查看: $LOG_FILE"
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
