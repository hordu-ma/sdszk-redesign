#!/bin/bash

# API连接测试脚本
# 用于测试所有主要API端点

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

echo_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# 服务器地址（可以通过参数传入）
SERVER_URL=${1:-"http://localhost:3000"}

echo_info "=== API连接测试 ==="
echo_info "测试服务器: $SERVER_URL"
echo_info "测试时间: $(date)"

# 测试用的API端点
declare -a endpoints=(
    "GET:$SERVER_URL/api/health:健康检查"
    "GET:$SERVER_URL/api/status:状态检查"
    "GET:$SERVER_URL/api/news-categories/core1:核心分类1"
    "GET:$SERVER_URL/api/resources?category=theory&limit=5:资源列表"
    "POST:$SERVER_URL/api/auth/login:登录接口"
)

# 测试每个端点
for endpoint in "${endpoints[@]}"; do
    IFS=':' read -r method url description <<< "$endpoint"
    
    echo_info "测试: $description ($method $url)"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" "$url" 2>/dev/null)
    elif [ "$method" = "POST" ] && [[ "$url" == *"/login"* ]]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" \
            -X POST \
            -H "Content-Type: application/json" \
            -d '{"username":"admin","password":"admin123"}' \
            "$url" 2>/dev/null)
    fi
    
    if [ $? -eq 0 ]; then
        http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
        time_total=$(echo "$response" | grep "TIME" | cut -d: -f2)
        response_body=$(echo "$response" | sed '/HTTP_CODE\|TIME/d')
        
        echo "  状态码: $http_code"
        echo "  响应时间: ${time_total}s"
        
        if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
            echo_success "  ✓ 成功"
        elif [[ "$http_code" == "429" ]]; then
            echo_error "  ✗ 频率限制 (429)"
        elif [[ "$http_code" == "401" ]]; then
            echo_error "  ✗ 认证失败 (401)"
        elif [[ "$http_code" == "500" ]]; then
            echo_error "  ✗ 服务器错误 (500)"
        else
            echo_error "  ✗ 错误 ($http_code)"
        fi
        
        # 如果响应体不为空且不是很长，显示前200个字符
        if [ -n "$response_body" ] && [ ${#response_body} -lt 200 ]; then
            echo "  响应: $response_body"
        fi
    else
        echo_error "  ✗ 连接失败"
    fi
    
    echo ""
    sleep 1  # 避免触发频率限制
done

echo_info "=== 测试完成 ==="

# 给出建议
echo_info "问题排查建议："
echo "1. 如果多个API返回500错误，检查服务器日志: pm2 logs sdszk-backend"
echo "2. 如果返回429错误，说明频率限制生效，等待1分钟后重试"
echo "3. 如果连接失败，检查服务是否启动: pm2 status"
echo "4. 如果登录返回401，可能需要重置admin密码"
