#!/bin/bash

# CMS API快速测试脚本
# 使用方法: chmod +x test-api.sh && ./test-api.sh

BASE_URL="http://localhost:3000/api"
ADMIN_LOGIN_URL="$BASE_URL/auth/login"

echo "🚀 开始CMS API功能测试..."
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
test_api() {
    local test_name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local expected_status="$5"
    local headers="$6"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}测试: $test_name${NC}"
    
    if [ -n "$headers" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" -H "$headers" -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" -d "$data")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ 通过 (状态码: $status_code)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ 失败 (期望: $expected_status, 实际: $status_code)${NC}"
        echo -e "${RED}响应内容: $body${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo "---"
}

# 1. 测试基础连接
echo "1. 测试基础连接..."
test_api "服务器连通性" "GET" "$BASE_URL/auth/me" "" "401"

# 2. 测试管理员登录
echo "2. 测试管理员登录..."
LOGIN_DATA='{"username": "admin", "password": "Admin123456"}'
LOGIN_RESPONSE=$(curl -s -X POST "$ADMIN_LOGIN_URL" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA")

echo "登录响应: $LOGIN_RESPONSE"

# 提取token（如果登录成功）
if echo "$LOGIN_RESPONSE" | grep -q "token\|success"; then
    echo -e "${GREEN}✓ 登录测试通过${NC}"
    # 提取实际的token
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        echo "已获取认证token"
        TOKEN="Bearer $TOKEN"
    else
        echo -e "${YELLOW}未能提取token，使用测试token${NC}"
        TOKEN="Bearer fake-token-for-testing"
    fi
else
    echo -e "${RED}✗ 登录失败，请检查用户名密码${NC}"
    TOKEN=""
fi

# 3. 测试新闻相关API
echo "3. 测试新闻管理API..."
if [ -n "$TOKEN" ]; then
    test_api "获取新闻列表" "GET" "$BASE_URL/admin/news" "" "200" "Authorization: $TOKEN"
    
    # 获取新闻分类列表，用于创建新闻
    echo "获取新闻分类列表..."
    CATEGORIES_RESPONSE=$(curl -s -X GET "$BASE_URL/news-categories" -H "Authorization: $TOKEN")
    CATEGORY_ID=$(echo "$CATEGORIES_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$CATEGORY_ID" ]; then
        # 测试创建新闻 - 使用真实的分类ID和所需字段
        NEWS_DATA="{
            \"title\": \"测试新闻标题\",
            \"content\": \"这是一条测试新闻的内容，包含足够的字符数以满足验证要求。这是测试用的新闻内容，用于验证系统功能是否正常工作。这是一条完整的测试新闻内容，确保满足最低字符要求。\",
            \"summary\": \"测试新闻摘要内容，用于验证系统功能\",
            \"category\": \"$CATEGORY_ID\",
            \"status\": \"draft\",
            \"tags\": [\"测试\", \"新闻\"]
        }"
        test_api "创建新闻" "POST" "$BASE_URL/admin/news" "$NEWS_DATA" "201" "Authorization: $TOKEN"
    else
        echo -e "${YELLOW}未找到有效的新闻分类，跳过创建新闻测试${NC}"
    fi
else
    echo -e "${YELLOW}跳过新闻API测试（需要认证token）${NC}"
fi

# 4. 测试资源相关API
echo "4. 测试资源管理API..."
if [ -n "$TOKEN" ]; then
    test_api "获取资源列表" "GET" "$BASE_URL/admin/resources" "" "200" "Authorization: $TOKEN"
    test_api "获取资源分类" "GET" "$BASE_URL/resource-categories" "" "200" "Authorization: $TOKEN"
else
    echo -e "${YELLOW}跳过资源API测试（需要认证token）${NC}"
fi

# 5. 测试用户管理API
echo "5. 测试用户管理API..."
if [ -n "$TOKEN" ]; then
    test_api "获取用户列表" "GET" "$BASE_URL/admin/users" "" "200" "Authorization: $TOKEN"
    test_api "获取角色列表" "GET" "$BASE_URL/admin/roles" "" "200" "Authorization: $TOKEN"
    test_api "获取权限列表" "GET" "$BASE_URL/admin/permissions" "" "200" "Authorization: $TOKEN"
else
    echo -e "${YELLOW}跳过用户管理API测试（需要认证token）${NC}"
fi

# 6. 测试系统设置API
echo "6. 测试系统设置API..."
test_api "获取公开设置" "GET" "$BASE_URL/settings/public" "" "200"

# 7. 测试文件上传准备
echo "7. 测试文件上传端点..."
if [ -n "$TOKEN" ]; then
    test_api "文件上传端点检查" "POST" "$BASE_URL/uploads/single" "" "400" "Authorization: $TOKEN"
else
    echo -e "${YELLOW}跳过文件上传测试（需要认证token）${NC}"
fi

# 测试结果汇总
echo "=================================="
echo "🏁 测试完成！"
echo -e "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 所有API测试通过！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  发现 $FAILED_TESTS 个问题需要修复${NC}"
    exit 1
fi
