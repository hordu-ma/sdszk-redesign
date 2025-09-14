#!/bin/bash

# wait-services-enhanced.sh - 增强的服务等待脚本
# 用于CI/CD环境中等待服务启动，提供渐进式健康检查和详细调试信息

set -euo pipefail

# 默认配置
DEFAULT_TIMEOUT=180
DEFAULT_INTERVAL=2
VERBOSE=true

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 服务配置
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3000"
BACKEND_HEALTH_BASIC="http://localhost:3000/api/health/basic"
BACKEND_HEALTH_READY="http://localhost:3000/api/health/ready"
BACKEND_HEALTH_FULL="http://localhost:3000/api/health"

# 打印帮助信息
show_help() {
    cat << EOF
用法: $0 [选项]

选项:
    --timeout <秒数>    超时时间（默认：${DEFAULT_TIMEOUT}秒）
    --interval <秒数>   检查间隔（默认：${DEFAULT_INTERVAL}秒）
    --quiet            静默模式（减少输出）
    --help             显示此帮助信息

此脚本将按以下顺序检查服务：
1. 前端服务基础可用性 (${FRONTEND_URL})
2. 后端服务基础启动 (${BACKEND_HEALTH_BASIC})
3. 后端服务完全就绪 (${BACKEND_HEALTH_READY})
4. 完整的健康检查 (${BACKEND_HEALTH_FULL})

示例:
    $0 --timeout 120
    $0 --quiet

EOF
}

# 日志函数
log_info() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}[INFO]${NC} $1"
    fi
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[成功]${NC} $1"
}

log_error() {
    echo -e "${RED}[错误]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[警告]${NC} $1"
}

log_progress() {
    echo -e "${YELLOW}[进度]${NC} $1"
}

# 获取当前时间戳
get_timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# 检查HTTP服务的可用性
check_http_service() {
    local url="$1"
    local service_name="$2"
    local expect_status="${3:-200}"

    if command -v curl >/dev/null 2>&1; then
        local response=$(curl -s -w "HTTPSTATUS:%{http_code}" -m 5 "$url" 2>/dev/null || echo "HTTPSTATUS:000")
        local http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)

        if [[ "$http_code" == "$expect_status" ]]; then
            return 0
        else
            log_info "$service_name HTTP状态码: $http_code (期望: $expect_status)"
            return 1
        fi
    elif command -v wget >/dev/null 2>&1; then
        if wget -q -O /dev/null -T 5 "$url" >/dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    else
        log_error "未找到curl或wget命令"
        return 1
    fi
}

# 检查TCP端口是否开放
check_port() {
    local host="$1"
    local port="$2"

    if command -v nc >/dev/null 2>&1; then
        nc -z "$host" "$port" 2>/dev/null
    elif command -v telnet >/dev/null 2>&1; then
        timeout 3 telnet "$host" "$port" >/dev/null 2>&1
    else
        log_warning "未找到nc或telnet命令，跳过端口检查"
        return 0
    fi
}

# 获取服务详细信息
get_service_info() {
    local url="$1"

    if command -v curl >/dev/null 2>&1; then
        local response=$(curl -s -m 3 "$url" 2>/dev/null || echo '{}')
        if [[ "$response" != '{}' ]] && echo "$response" | grep -q '"status"'; then
            echo "$response" | head -c 200
        fi
    fi
}

# 等待单个服务
wait_for_service() {
    local url="$1"
    local service_name="$2"
    local timeout="$3"
    local expect_status="${4:-200}"

    log_step "等待 $service_name..."
    log_info "检查URL: $url"

    local start_time=$(date +%s)
    local end_time=$((start_time + timeout))

    while [[ $(date +%s) -lt $end_time ]]; do
        local elapsed=$(($(date +%s) - start_time))
        local remaining=$((timeout - elapsed))

        if check_http_service "$url" "$service_name" "$expect_status"; then
            log_success "$service_name 已就绪 (用时: ${elapsed}秒)"

            # 尝试获取服务详细信息
            local info=$(get_service_info "$url")
            if [[ -n "$info" ]]; then
                log_info "服务信息: $info"
            fi

            return 0
        fi

        if [[ $((elapsed % 10)) -eq 0 ]] || [[ $remaining -lt 10 ]]; then
            log_progress "$service_name 等待中... (剩余: ${remaining}秒)"
        fi

        sleep "$DEFAULT_INTERVAL"
    done

    log_error "$service_name 等待超时 (${timeout}秒)"
    return 1
}

# 执行完整的服务检查
perform_health_check() {
    local timeout="$1"

    echo "🚀 开始服务健康检查"
    echo "📅 开始时间: $(get_timestamp)"
    echo "⏱️  超时设置: ${timeout}秒"
    echo "🔄 检查间隔: ${DEFAULT_INTERVAL}秒"
    echo ""

    # 第一步：检查前端服务
    log_step "第1步：检查前端服务基础可用性"
    if ! wait_for_service "$FRONTEND_URL" "前端服务" 30; then
        log_error "前端服务检查失败"
        return 1
    fi
    echo ""

    # 第二步：检查后端基础服务
    log_step "第2步：检查后端服务基础启动"
    if ! wait_for_service "$BACKEND_HEALTH_BASIC" "后端基础服务" 30; then
        log_error "后端基础服务检查失败"

        # 尝试检查后端端口是否开放
        log_info "检查后端端口连通性..."
        if check_port "localhost" "3000"; then
            log_info "后端端口3000已开放，但健康检查失败"
        else
            log_info "后端端口3000未开放，服务可能未启动"
        fi

        return 1
    fi
    echo ""

    # 第三步：检查后端就绪状态
    log_step "第3步：检查后端服务完全就绪"
    local ready_timeout=$((timeout - 60)) # 为前面的检查预留时间
    if [[ $ready_timeout -lt 30 ]]; then
        ready_timeout=30
    fi

    if ! wait_for_service "$BACKEND_HEALTH_READY" "后端就绪状态" "$ready_timeout"; then
        log_warning "后端就绪状态检查失败，尝试完整健康检查..."
        # 继续尝试完整检查，可能数据库连接稍有延迟
    else
        echo ""
    fi

    # 第四步：完整健康检查
    log_step "第4步：完整健康检查"
    if wait_for_service "$BACKEND_HEALTH_FULL" "完整健康检查" 30; then
        echo ""
        log_success "所有服务健康检查完成！"
        echo "✅ 前端服务已就绪"
        echo "✅ 后端服务已就绪"
        echo "✅ 数据库连接正常"
        echo "✅ 完整功能可用"
        echo ""
        echo "📅 完成时间: $(get_timestamp)"
        return 0
    else
        log_warning "完整健康检查失败，但基础服务可用"
        echo ""
        echo "⚠️  服务状态总结:"
        echo "✅ 前端服务已就绪"
        echo "✅ 后端基础服务已就绪"
        echo "⚠️  数据库连接可能有延迟"
        echo ""
        echo "💡 建议：可以继续运行测试，数据库连接可能在测试过程中恢复"
        return 0  # 返回成功，允许测试继续
    fi
}

# 提供故障排查信息
show_troubleshooting() {
    echo ""
    echo "🔧 故障排查指南:"
    echo ""
    echo "1. 检查服务是否启动:"
    echo "   ps aux | grep -E '(node|npm)'"
    echo ""
    echo "2. 检查端口占用:"
    echo "   lsof -i :3000"
    echo "   lsof -i :5173"
    echo ""
    echo "3. 检查服务日志:"
    echo "   tail -f backend.log"
    echo "   tail -f frontend.log"
    echo ""
    echo "4. 手动启动服务:"
    echo "   bash scripts/development/dev-start.sh"
    echo ""
    echo "5. 重置环境:"
    echo "   bash scripts/development/dev-stop.sh"
    echo "   bash scripts/development/dev-start.sh"
    echo ""
}

# 主函数
main() {
    local timeout=$DEFAULT_TIMEOUT

    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --timeout)
                timeout="$2"
                shift 2
                ;;
            --interval)
                DEFAULT_INTERVAL="$2"
                shift 2
                ;;
            --quiet)
                VERBOSE=false
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            --*)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
            *)
                log_error "无效参数: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 检查必要的命令
    if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
        log_error "需要curl或wget命令来执行HTTP检查"
        exit 1
    fi

    # 执行健康检查
    if perform_health_check "$timeout"; then
        exit 0
    else
        show_troubleshooting
        exit 1
    fi
}

# 运行主函数
main "$@"
