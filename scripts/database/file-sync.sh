#!/bin/bash

# =============================================================================
# 文件同步脚本 - 优化版
# 用于在开发环境和生产环境之间同步上传的文件
# =============================================================================

set -euo pipefail

# 颜色输出
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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
SERVER_DIR="$PROJECT_ROOT/server"

# 生产环境配置
PROD_HOST="8.141.113.21"
PROD_USER="root"
PROD_UPLOADS_PATH="/var/www/sdszk-backend/uploads"

# 本地配置
LOCAL_UPLOADS_PATH="$SERVER_DIR/uploads"

# 日志文件
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$SCRIPT_DIR/file-sync-${TIMESTAMP}.log"
TEMP_DIR="/tmp/file-sync-$$"

# 清理函数
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# 检查依赖工具
check_dependencies() {
    echo_step "检查依赖工具..."

    local deps=("ssh" "rsync" "curl" "jq")
    local missing=()

    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done

    if [ ${#missing[@]} -ne 0 ]; then
        echo_error "缺少以下依赖工具: ${missing[*]}"
        echo_info "请安装缺少的工具"
        exit 1
    fi

    echo_success "所有依赖工具检查通过"
}

# 测试连接
test_connections() {
    echo_step "测试连接..."

    # 测试SSH连接
    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$PROD_USER@$PROD_HOST" exit 2>/dev/null; then
        echo_success "SSH连接正常"
    else
        echo_error "无法连接到生产服务器 $PROD_USER@$PROD_HOST"
        echo_info "请确保SSH密钥配置正确"
        exit 1
    fi

    # 测试本地API
    if curl -s http://localhost:3000/api/health &>/dev/null; then
        echo_success "本地API连接正常"
    else
        echo_error "本地API服务未运行"
        echo_info "请先启动本地服务: ./scripts/development/dev-start.sh"
        exit 1
    fi
}

# 获取数据库中的文件引用
get_file_references() {
    local env=$1
    local temp_file="$TEMP_DIR/file_refs_${env}.txt"

    mkdir -p "$TEMP_DIR"
    > "$temp_file"

    echo_info "获取${env}环境的文件引用..."

    if [ "$env" = "local" ]; then
        # 从本地API获取
        local page=1
        local limit=50

        while true; do
            local response=$(curl -s "http://localhost:3000/api/resources?page=$page&limit=$limit")
            local files=$(echo "$response" | jq -r '.data[]? | select(.fileUrl and (.fileUrl | startswith("/uploads/"))) | .fileUrl' 2>/dev/null)

            if [[ -z "$files" ]]; then
                break
            fi

            echo "$files" >> "$temp_file"
            ((page++))
        done

        # 获取新闻中的图片引用
        page=1
        while true; do
            local response=$(curl -s "http://localhost:3000/api/news?page=$page&limit=$limit")
            local images=$(echo "$response" | jq -r '.data[]? | select(.imageUrl and (.imageUrl | startswith("/uploads/"))) | .imageUrl' 2>/dev/null)

            if [[ -z "$images" ]]; then
                break
            fi

            echo "$images" >> "$temp_file"
            ((page++))
        done

    else
        # 从生产环境API获取
        local prod_files=$(ssh "$PROD_USER@$PROD_HOST" "
            curl -s http://localhost:3000/api/resources | jq -r '.data[]? | select(.fileUrl and (.fileUrl | startswith(\"/uploads/\"))) | .fileUrl' 2>/dev/null;
            curl -s http://localhost:3000/api/news | jq -r '.data[]? | select(.imageUrl and (.imageUrl | startswith(\"/uploads/\"))) | .imageUrl' 2>/dev/null
        " 2>/dev/null)

        if [[ -n "$prod_files" ]]; then
            echo "$prod_files" >> "$temp_file"
        fi
    fi

    local count=$(wc -l < "$temp_file" 2>/dev/null || echo 0)
    echo_info "${env}环境找到 $count 个文件引用"
    echo "$temp_file"
}

# 检查缺失的文件
check_missing_files() {
    local direction=$1
    local missing_file="$TEMP_DIR/missing_files.txt"

    > "$missing_file"

    if [ "$direction" = "prod-to-dev" ]; then
        echo_step "检查本地环境缺失的文件..."
        local refs_file=$(get_file_references "local")

        while IFS= read -r file_url; do
            if [[ -n "$file_url" ]]; then
                local relative_path="${file_url#/uploads/}"
                local local_path="$LOCAL_UPLOADS_PATH/$relative_path"

                if [[ ! -f "$local_path" ]]; then
                    echo "$file_url" >> "$missing_file"
                fi
            fi
        done < "$refs_file"

    else
        echo_step "检查生产环境缺失的文件..."
        local refs_file=$(get_file_references "prod")

        while IFS= read -r file_url; do
            if [[ -n "$file_url" ]]; then
                local relative_path="${file_url#/uploads/}"
                local local_path="$LOCAL_UPLOADS_PATH/$relative_path"

                if [[ -f "$local_path" ]]; then
                    # 检查生产环境是否存在
                    local prod_path="$PROD_UPLOADS_PATH/$relative_path"
                    if ! ssh "$PROD_USER@$PROD_HOST" "[ -f '$prod_path' ]" 2>/dev/null; then
                        echo "$file_url" >> "$missing_file"
                    fi
                fi
            fi
        done < "$refs_file"
    fi

    local missing_count=$(wc -l < "$missing_file" 2>/dev/null || echo 0)
    echo_info "发现 $missing_count 个缺失文件"

    echo "$missing_file"
}

# 同步文件从生产环境到开发环境
sync_prod_to_dev() {
    echo_header "从生产环境同步文件到开发环境"

    local missing_file=$(check_missing_files "prod-to-dev")
    local missing_count=$(wc -l < "$missing_file" 2>/dev/null || echo 0)

    if [ "$missing_count" -eq 0 ]; then
        echo_success "所有文件都存在，无需同步"
        return
    fi

    echo_warning "将同步 $missing_count 个文件"

    if [ "${1:-}" != "--auto" ]; then
        read -p "确认继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo_info "操作已取消"
            return
        fi
    fi

    echo_step "开始同步文件..."

    # 确保本地目录存在
    mkdir -p "$LOCAL_UPLOADS_PATH/documents" "$LOCAL_UPLOADS_PATH/images" "$LOCAL_UPLOADS_PATH/videos"

    local synced=0
    local failed=0
    local total=$missing_count

    while IFS= read -r file_url; do
        if [[ -n "$file_url" ]]; then
            local relative_path="${file_url#/uploads/}"
            local local_path="$LOCAL_UPLOADS_PATH/$relative_path"
            local prod_path="$PROD_UPLOADS_PATH/$relative_path"
            local local_dir=$(dirname "$local_path")

            # 确保本地目录存在
            mkdir -p "$local_dir"

            echo_info "同步: $file_url ($((synced + failed + 1))/$total)"

            # 检查生产环境文件是否存在
            if ssh "$PROD_USER@$PROD_HOST" "[ -f '$prod_path' ]" 2>/dev/null; then
                # 同步文件
                if rsync -avz --progress "$PROD_USER@$PROD_HOST:$prod_path" "$local_path" 2>>"$LOG_FILE"; then
                    ((synced++))
                    echo_success "  ✓ 同步成功"
                else
                    ((failed++))
                    echo_error "  ✗ 同步失败"
                fi
            else
                ((failed++))
                echo_warning "  ⚠ 生产环境文件不存在: $prod_path"
            fi
        fi
    done < "$missing_file"

    echo_success "同步完成："
    echo_success "  成功: $synced 个文件"
    if [ $failed -gt 0 ]; then
        echo_warning "  失败/跳过: $failed 个文件"
    fi
    echo_info "详细日志: $LOG_FILE"
}

# 同步文件从开发环境到生产环境
sync_dev_to_prod() {
    echo_header "从开发环境同步文件到生产环境"

    echo_warning "⚠️ 此操作将上传本地文件到生产环境"

    local missing_file=$(check_missing_files "dev-to-prod")
    local missing_count=$(wc -l < "$missing_file" 2>/dev/null || echo 0)

    if [ "$missing_count" -eq 0 ]; then
        echo_success "生产环境已有所有文件，无需同步"
        return
    fi

    echo_warning "将同步 $missing_count 个文件到生产环境"

    if [ "${1:-}" != "--auto" ]; then
        read -p "确认继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo_info "操作已取消"
            return
        fi
    fi

    echo_step "开始同步文件到生产环境..."

    # 确保生产环境目录存在
    ssh "$PROD_USER@$PROD_HOST" "mkdir -p $PROD_UPLOADS_PATH/documents $PROD_UPLOADS_PATH/images $PROD_UPLOADS_PATH/videos"

    local synced=0
    local failed=0
    local total=$missing_count

    while IFS= read -r file_url; do
        if [[ -n "$file_url" ]]; then
            local relative_path="${file_url#/uploads/}"
            local local_path="$LOCAL_UPLOADS_PATH/$relative_path"
            local prod_path="$PROD_UPLOADS_PATH/$relative_path"
            local prod_dir=$(dirname "$prod_path")

            echo_info "同步: $file_url ($((synced + failed + 1))/$total)"

            if [[ -f "$local_path" ]]; then
                # 确保生产环境目录存在
                ssh "$PROD_USER@$PROD_HOST" "mkdir -p '$prod_dir'"

                # 同步文件到生产环境
                if rsync -avz --progress "$local_path" "$PROD_USER@$PROD_HOST:$prod_path" 2>>"$LOG_FILE"; then
                    ((synced++))
                    echo_success "  ✓ 同步成功"
                else
                    ((failed++))
                    echo_error "  ✗ 同步失败"
                fi
            else
                ((failed++))
                echo_warning "  ⚠ 本地文件不存在: $local_path"
            fi
        fi
    done < "$missing_file"

    echo_success "同步完成："
    echo_success "  成功: $synced 个文件"
    if [ $failed -gt 0 ]; then
        echo_warning "  失败/跳过: $failed 个文件"
    fi
    echo_info "详细日志: $LOG_FILE"
}

# 完整双向同步
full_sync() {
    echo_header "执行完整双向文件同步"

    echo_info "此操作将："
    echo_info "1. 从生产环境同步缺失文件到开发环境"
    echo_info "2. 从开发环境同步缺失文件到生产环境"
    echo

    read -p "确认继续？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo_info "操作已取消"
        return
    fi

    sync_prod_to_dev --auto
    echo
    sync_dev_to_prod --auto
}

# 显示文件统计
show_file_stats() {
    echo_header "文件统计信息"

    # 本地文件统计
    echo_info "本地环境文件统计："
    if [ -d "$LOCAL_UPLOADS_PATH" ]; then
        find "$LOCAL_UPLOADS_PATH" -type f | wc -l | xargs echo "  总文件数:"
        find "$LOCAL_UPLOADS_PATH" -name "*.pdf" | wc -l | xargs echo "  PDF文件:"
        find "$LOCAL_UPLOADS_PATH" -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | wc -l | xargs echo "  图片文件:"
        find "$LOCAL_UPLOADS_PATH" -name "*.mp4" -o -name "*.avi" -o -name "*.mov" | wc -l | xargs echo "  视频文件:"
    else
        echo "  本地上传目录不存在"
    fi

    echo

    # 生产环境文件统计
    echo_info "生产环境文件统计："
    local prod_stats=$(ssh "$PROD_USER@$PROD_HOST" "
        if [ -d '$PROD_UPLOADS_PATH' ]; then
            echo \"总文件数: \$(find '$PROD_UPLOADS_PATH' -type f | wc -l)\"
            echo \"PDF文件: \$(find '$PROD_UPLOADS_PATH' -name '*.pdf' | wc -l)\"
            echo \"图片文件: \$(find '$PROD_UPLOADS_PATH' -name '*.jpg' -o -name '*.jpeg' -o -name '*.png' | wc -l)\"
            echo \"视频文件: \$(find '$PROD_UPLOADS_PATH' -name '*.mp4' -o -name '*.avi' -o -name '*.mov' | wc -l)\"
        else
            echo '生产环境上传目录不存在'
        fi
    " 2>/dev/null)

    echo "$prod_stats" | sed 's/^/  /'
}

# 清理孤儿文件
cleanup_orphan_files() {
    echo_header "清理孤儿文件"

    echo_warning "⚠️ 此操作将删除数据库中没有引用的文件"
    echo_info "建议先备份文件目录"

    read -p "确认继续？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo_info "操作已取消"
        return
    fi

    local refs_file=$(get_file_references "local")
    local orphan_file="$TEMP_DIR/orphan_files.txt"
    > "$orphan_file"

    echo_step "扫描孤儿文件..."

    # 扫描本地文件
    find "$LOCAL_UPLOADS_PATH" -type f | while read -r file_path; do
        local relative_path="${file_path#$LOCAL_UPLOADS_PATH}"
        local file_url="/uploads$relative_path"

        if ! grep -q "^$file_url$" "$refs_file"; then
            echo "$file_path" >> "$orphan_file"
        fi
    done

    local orphan_count=$(wc -l < "$orphan_file" 2>/dev/null || echo 0)

    if [ "$orphan_count" -eq 0 ]; then
        echo_success "未发现孤儿文件"
        return
    fi

    echo_warning "发现 $orphan_count 个孤儿文件"
    echo_info "孤儿文件列表:"
    cat "$orphan_file" | head -10 | sed 's/^/  /'
    if [ "$orphan_count" -gt 10 ]; then
        echo_info "  ... 还有 $((orphan_count - 10)) 个文件"
    fi

    read -p "确认删除这些孤儿文件？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        local deleted=0
        while IFS= read -r file_path; do
            if [[ -f "$file_path" ]]; then
                rm "$file_path"
                ((deleted++))
            fi
        done < "$orphan_file"

        echo_success "已删除 $deleted 个孤儿文件"
    else
        echo_info "清理操作已取消"
    fi
}

# 显示帮助信息
show_help() {
    cat << EOF
🗂️ 文件同步工具

用法: $0 [选项]

选项:
    prod-to-dev     从生产环境同步文件到开发环境
    dev-to-prod     从开发环境同步文件到生产环境
    full-sync       执行完整双向同步
    stats           显示文件统计信息
    cleanup         清理孤儿文件
    help            显示此帮助信息

示例:
    $0 prod-to-dev  # 同步生产环境文件到开发环境
    $0 stats        # 查看文件统计
    $0 full-sync    # 双向同步

EOF
}

# 显示菜单
show_menu() {
    echo_header "文件同步工具"
    echo "请选择操作："
    echo "  1) 从生产环境同步文件到开发环境"
    echo "  2) 从开发环境同步文件到生产环境"
    echo "  3) 执行完整双向同步"
    echo "  4) 显示文件统计信息"
    echo "  5) 清理孤儿文件"
    echo "  0) 退出"
    echo
}

# 主函数
main() {
    echo_info "🗂️ 文件同步工具启动..."
    echo_info "日志文件: $LOG_FILE"

    # 检查依赖和连接
    check_dependencies
    test_connections

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
            "full-sync")
                full_sync
                ;;
            "stats")
                show_file_stats
                ;;
            "cleanup")
                cleanup_orphan_files
                ;;
            "help"|"-h"|"--help")
                show_help
                ;;
            *)
                echo_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
        return
    fi

    # 交互式菜单
    while true; do
        show_menu
        read -p "请选择 [0-5]: " choice
        echo

        case $choice in
            1)
                sync_prod_to_dev
                ;;
            2)
                sync_dev_to_prod
                ;;
            3)
                full_sync
                ;;
            4)
                show_file_stats
                ;;
            5)
                cleanup_orphan_files
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
