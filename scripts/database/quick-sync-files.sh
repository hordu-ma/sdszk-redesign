#!/bin/bash

# =============================================================================
# 快速文件同步脚本 - 从生产环境同步CMS上传的文件
# 专门解决生产环境CMS上传文件与开发环境不同步的问题
# =============================================================================

set -euo pipefail

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
PROD_HOST="60.205.124.67"
PROD_USER="root"
PROD_UPLOADS="/var/www/sdszk/uploads"
LOCAL_UPLOADS="$(dirname "$(dirname "$(dirname "${BASH_SOURCE[0]}")")")/server/uploads"

# 日志
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="./quick-sync-${TIMESTAMP}.log"

print_info() { echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"; }
print_success() { echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"; }
print_error() { echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"; }

# 检查依赖
check_deps() {
    print_info "检查依赖工具..."

    local deps=("ssh" "rsync" "curl")
    for dep in "${deps[@]}"; do
        if ! command -v $dep &> /dev/null; then
            print_error "缺少工具: $dep"
            exit 1
        fi
    done
    print_success "依赖检查通过"
}

# 测试连接
test_connection() {
    print_info "测试生产环境连接..."

    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$PROD_USER@$PROD_HOST" exit 2>/dev/null; then
        print_success "SSH连接正常"
    else
        print_error "无法连接生产环境 $PROD_USER@$PROD_HOST"
        print_info "请确保SSH密钥配置正确"
        exit 1
    fi
}

# 获取数据库中缺失的文件列表
get_missing_files() {
    print_info "获取缺失文件列表..."

    # 检查后端服务是否运行
    if ! curl -s http://localhost:3000/api/health &>/dev/null; then
        print_error "后端服务未运行，请先启动：./scripts/development/dev-start.sh"
        exit 1
    fi

    # 创建临时文件
    local temp_missing=$(mktemp)
    local temp_all=$(mktemp)

    # 获取所有资源的文件URL，增加分页处理
    local page=1
    local limit=100
    local all_files=""

    while true; do
        local response=$(curl -s "http://localhost:3000/api/resources?page=$page&limit=$limit")
        local page_files=$(echo "$response" | jq -r '.data[]? | select(.fileUrl and (.fileUrl | startswith("/uploads/"))) | .fileUrl' 2>/dev/null)

        if [[ -z "$page_files" ]]; then
            break
        fi

        echo "$page_files" >> "$temp_all"
        ((page++))
    done

    local total_files=$(wc -l < "$temp_all" 2>/dev/null || echo 0)
    print_info "数据库中找到 $total_files 个文件引用"

    if [[ $total_files -eq 0 ]]; then
        print_warning "数据库中没有找到文件引用"
        rm -f "$temp_missing" "$temp_all"
        exit 0
    fi

    # 检查本地文件是否存在
    local missing_count=0
    local existing_count=0
    while IFS= read -r file_url; do
        if [[ -n "$file_url" && "$file_url" == "/uploads/"* ]]; then
            local local_path="${LOCAL_UPLOADS}${file_url#/uploads}"
            if [[ ! -f "$local_path" ]]; then
                echo "$file_url" >> "$temp_missing"
                ((missing_count++))
            else
                ((existing_count++))
            fi
        fi
    done < "$temp_all"

    print_info "文件统计："
    print_info "  总文件数: $total_files"
    print_info "  本地存在: $existing_count"
    print_info "  本地缺失: $missing_count"

    if [[ $missing_count -eq 0 ]]; then
        print_success "所有文件都存在，无需同步"
        rm -f "$temp_missing" "$temp_all"
        exit 0
    fi

    # 显示前几个缺失文件
    print_info "前5个缺失文件："
    head -5 "$temp_missing" | while read -r file; do
        print_info "  $file"
    done

    echo "$temp_missing"
    rm -f "$temp_all"
}

# 从生产环境同步文件
sync_files() {
    local missing_file_list="$1"

    print_info "开始从生产环境同步文件..."

    # 确保本地目录存在
    mkdir -p "$LOCAL_UPLOADS/documents" "$LOCAL_UPLOADS/images" "$LOCAL_UPLOADS/videos"

    local synced=0
    local failed=0
    local total=$(wc -l < "$missing_file_list")

    while IFS= read -r file_url; do
        if [[ -n "$file_url" ]]; then
            local relative_path="${file_url#/uploads/}"
            local local_path="$LOCAL_UPLOADS/$relative_path"
            local prod_path="$PROD_UPLOADS/$relative_path"
            local local_dir=$(dirname "$local_path")

            # 确保本地目录存在
            mkdir -p "$local_dir"

            print_info "同步: $file_url ($((synced + failed + 1))/$total)"

            # 先检查生产环境文件是否存在
            if ssh "$PROD_USER@$PROD_HOST" "[ -f '$prod_path' ]" 2>/dev/null; then
                # 同步文件
                if rsync -avz --progress "$PROD_USER@$PROD_HOST:$prod_path" "$local_path" 2>>"$LOG_FILE"; then
                    ((synced++))
                    print_success "  ✓ 同步成功"
                else
                    ((failed++))
                    print_error "  ✗ 同步失败"
                fi
            else
                ((failed++))
                print_warning "  ⚠ 生产环境文件不存在: $prod_path"
            fi
        fi
    done < "$missing_file_list"

    print_success "同步完成："
    print_success "  成功: $synced 个文件"
    if [[ $failed -gt 0 ]]; then
        print_warning "  失败/跳过: $failed 个文件"
    fi

    rm -f "$missing_file_list"
}

# 验证同步结果
verify_sync() {
    print_info "验证同步结果..."

    # 重新检查API是否正常
    if curl -s "http://localhost:3000/api/resources?category=theory&limit=1" | jq -e '.data[0].fileUrl' &>/dev/null; then
        print_success "API响应正常"
    else
        print_warning "API响应异常"
    fi

    # 测试一个理论前沿文件
    local test_file=$(curl -s "http://localhost:3000/api/resources?category=theory&limit=1" | jq -r '.data[0].fileUrl? // empty')
    if [[ -n "$test_file" ]]; then
        local test_path="${LOCAL_UPLOADS}${test_file#/uploads}"
        if [[ -f "$test_path" ]]; then
            print_success "理论前沿文件验证通过: $test_file"
        else
            print_warning "理论前沿文件仍缺失: $test_file"
        fi
    fi
}

# 显示帮助
show_help() {
    echo "快速文件同步脚本 - 解决生产环境CMS上传文件不同步问题"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助"
    echo "  -c, --check    仅检查，不同步"
    echo "  -v, --verbose  详细输出"
    echo ""
    echo "说明:"
    echo "  本脚本专门解决生产环境通过CMS上传的PDF文件在开发环境缺失的问题"
    echo "  会自动检测缺失文件并从生产环境同步到本地"
    echo ""
}

# 主函数
main() {
    local check_only=false
    local verbose=false

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--check)
                check_only=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            *)
                print_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done

    echo "🔄 快速文件同步工具"
    echo "==================="
    print_info "日志文件: $LOG_FILE"
    echo ""

    # 执行同步流程
    check_deps
    test_connection

    local missing_files=$(get_missing_files)

    if [[ "$check_only" == "true" ]]; then
        print_info "检查完成，使用不带 -c 参数运行开始同步"
    else
        sync_files "$missing_files"
        verify_sync
        print_success "🎉 文件同步完成！"
        print_info "现在可以测试理论前沿PDF文件是否正常"
    fi

    print_info "详细日志: $LOG_FILE"
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
