#!/bin/bash

# wait-services-simple.sh - 等待服务就绪的简化脚本
# 用于CI/CD环境中等待依赖服务启动

set -euo pipefail

# 默认配置
DEFAULT_TIMEOUT=120
DEFAULT_INTERVAL=2
VERBOSE=false

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印帮助信息
show_help() {
    cat << EOF
用法: $0 [选项] <服务URL1> [服务URL2] ...

选项:
    --timeout <秒数>    超时时间（默认：${DEFAULT_TIMEOUT}秒）
    --interval <秒数>   检查间隔（默认：${DEFAULT_INTERVAL}秒）
    --verbose          详细输出
    --help             显示此帮助信息

支持的服务URL格式:
    mongo://host:port         - MongoDB服务
    redis://host:port         - Redis服务
    http://host:port/path     - HTTP服务
    tcp://host:port           - TCP端口检查

示例:
    $0 --timeout 60 --verbose mongo://localhost:27017 redis://localhost:6379
    $0 http://localhost:3000/health http://localhost:5173

EOF
}

# 日志函数
log_info() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}[INFO]${NC} $1"
    fi
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

# 检查MongoDB连接
check_mongo() {
    local url="$1"
    local host_port="${url#mongo://}"
    local host="${host_port%:*}"
    local port="${host_port#*:}"

    # 先检查端口是否开放
    if ! nc -z "$host" "$port" 2>/dev/null; then
        return 1
    fi

    # 使用mongosh或mongo客户端测试连接
    if command -v mongosh >/dev/null 2>&1; then
        mongosh --host "$host" --port "$port" --eval "db.runCommand({ping: 1})" --quiet >/dev/null 2>&1
    elif command -v mongo >/dev/null 2>&1; then
        mongo --host "$host" --port "$port" --eval "db.runCommand({ping: 1})" --quiet >/dev/null 2>&1
    else
        # 如果没有mongo客户端，只检查端口
        log_warning "MongoDB客户端未找到，仅检查端口连通性"
        return 0
    fi
}

# 检查Redis连接
check_redis() {
    local url="$1"
    local host_port="${url#redis://}"
    local host="${host_port%:*}"
    local port="${host_port#*:}"

    # 先检查端口是否开放
    if ! nc -z "$host" "$port" 2>/dev/null; then
        return 1
    fi

    # 使用redis-cli测试连接
    if command -v redis-cli >/dev/null 2>&1; then
        redis-cli -h "$host" -p "$port" ping >/dev/null 2>&1
    else
        # 如果没有redis-cli，只检查端口
        log_warning "Redis客户端未找到，仅检查端口连通性"
        return 0
    fi
}

# 检查HTTP服务
check_http() {
    local url="$1"

    if command -v curl >/dev/null 2>&1; then
        curl -s -f -m 5 "$url" >/dev/null 2>&1
    elif command -v wget >/dev/null 2>&1; then
        wget -q -O /dev/null -T 5 "$url" >/dev/null 2>&1
    else
        log_error "未找到curl或wget命令"
        return 1
    fi
}

# 检查TCP端口
check_tcp() {
    local url="$1"
    local host_port="${url#tcp://}"
    local host="${host_port%:*}"
    local port="${host_port#*:}"

    nc -z "$host" "$port" 2>/dev/null
}

# 检查单个服务
check_service() {
    local url="$1"

    case "$url" in
        mongo://*)
            check_mongo "$url"
            ;;
        redis://*)
            check_redis "$url"
            ;;
        http://*)
            check_http "$url"
            ;;
        https://*)
            check_http "$url"
            ;;
        tcp://*)
            check_tcp "$url"
            ;;
        *)
            log_error "不支持的URL格式: $url"
            return 1
            ;;
    esac
}

# 主函数
main() {
    local timeout=$DEFAULT_TIMEOUT
    local interval=$DEFAULT_INTERVAL
    local services=()

    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --timeout)
                timeout="$2"
                shift 2
                ;;
            --interval)
                interval="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE=true
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
                services+=("$1")
                shift
                ;;
        esac
    done

    # 检查是否提供了服务URL
    if [[ ${#services[@]} -eq 0 ]]; then
        log_error "请提供至少一个服务URL"
        show_help
        exit 1
    fi

    # 检查必要的命令
    if ! command -v nc >/dev/null 2>&1; then
        log_error "nc (netcat) 命令未找到，请安装 netcat"
        exit 1
    fi

    log_info "开始等待 ${#services[@]} 个服务就绪..."
    log_info "超时时间: ${timeout}秒，检查间隔: ${interval}秒"

    local start_time=$(date +%s)
    local end_time=$((start_time + timeout))

    # 等待所有服务就绪
    while [[ $(date +%s) -lt $end_time ]]; do
        local all_ready=true

        for service in "${services[@]}"; do
            log_info "检查服务: $service"

            if check_service "$service"; then
                log_info "✓ $service 已就绪"
            else
                log_info "✗ $service 未就绪"
                all_ready=false
            fi
        done

        if [[ "$all_ready" == "true" ]]; then
            log_success "所有服务都已就绪！"
            exit 0
        fi

        local elapsed=$(($(date +%s) - start_time))
        local remaining=$((timeout - elapsed))
        log_info "等待中... (剩余 ${remaining} 秒)"

        sleep "$interval"
    done

    # 超时
    log_error "等待服务超时！以下服务可能未就绪:"
    for service in "${services[@]}"; do
        if ! check_service "$service"; then
            log_error "  ✗ $service"
        fi
    done

    exit 1
}

# 运行主函数
main "$@"
