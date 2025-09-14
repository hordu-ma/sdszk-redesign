#!/bin/bash

# test-health-endpoints.sh - 测试健康检查端点
# 用于验证新增的分层健康检查功能

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
BACKEND_URL="http://localhost:3000"
ENDPOINTS=(
    "/api/health/basic"
    "/api/health/ready"
    "/api/health"
)

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[成功]${NC} $1"
}

log_error() {
    echo -e "${RED}[错误]${NC} $1"
}

log_test() {
    echo -e "${YELLOW}[测试]${NC} $1"
}

# 测试单个端点
test_endpoint() {
    local endpoint="$1"
    local url="${BACKEND_URL}${endpoint}"

    log_test "测试端点: $endpoint"

    if command -v curl >/dev/null 2>&1; then
        local response=$(curl -s -w "HTTPSTATUS:%{http_code}" -m 5 "$url" 2>/dev/null || echo "HTTPSTATUS:000")
        local body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
        local http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)

        log_info "状态码: $http_code"

        if [[ "$http_code" == "200" ]]; then
            log_success "端点响应正常"

            # 尝试解析JSON响应
            if echo "$body" | python3 -m json.tool >/dev/null 2>&1; then
                log_info "响应格式: 有效JSON"
                echo "$body" | python3 -m json.tool | head -10
            else
                log_info "响应内容: $body"
            fi
        elif [[ "$http_code" == "503" ]]; then
            log_info "服务不可用（可能是依赖服务未就绪）"
            echo "$body" | head -5
        elif [[ "$http_code" == "000" ]]; then
            log_error "无法连接到服务"
        else
            log_error "意外的状态码: $http_code"
            echo "$body" | head -5
        fi
    else
        log_error "curl命令未找到"
        return 1
    fi

    echo ""
}

# 检查服务是否运行
check_service_running() {
    log_info "检查后端服务是否运行..."

    if lsof -i :3000 >/dev/null 2>&1; then
        log_success "端口3000已被占用，服务可能在运行"
        lsof -i :3000 | head -5
    else
        log_error "端口3000未被占用，后端服务可能未启动"
        echo "请先启动后端服务："
        echo "  cd server && npm start"
        echo "或者："
        echo "  bash scripts/development/dev-start.sh"
        return 1
    fi

    echo ""
}

# 主函数
main() {
    echo "🔍 健康检查端点测试"
    echo "===================="
    echo ""

    # 检查服务状态
    if ! check_service_running; then
        exit 1
    fi

    # 测试所有端点
    for endpoint in "${ENDPOINTS[@]}"; do
        test_endpoint "$endpoint"
    done

    echo "测试完成！"
    echo ""
    echo "💡 说明："
    echo "- /api/health/basic: 基础服务状态，用于CI快速检查"
    echo "- /api/health/ready: 依赖服务就绪状态"
    echo "- /api/health: 完整健康检查信息"
}

# 运行主函数
main "$@"
