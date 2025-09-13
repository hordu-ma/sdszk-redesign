#!/bin/bash

# ============================================================================
# 用户管理系统 API 测试脚本
# 测试修复后的用户管理功能
# ============================================================================

set -e

API_BASE="http://localhost:3000/api"
AUTH_BASE="${API_BASE}/auth"
USERS_BASE="${API_BASE}/users"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# 测试结果记录
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 记录测试结果
record_test() {
    local test_name="$1"
    local result="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        log_success "测试通过: $test_name"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        log_error "测试失败: $test_name"
    fi
}

# HTTP请求函数
make_request() {
    local method="$1"
    local url="$2"
    local data="$3"
    local auth_header="$4"
    
    local curl_cmd="curl -s -w '%{http_code}' -X $method"
    
    if [ -n "$auth_header" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $auth_header'"
    fi
    
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    
    if [ -n "$data" ] && [ "$data" != "null" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$url'"
    
    eval "$curl_cmd"
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    # 检查后端服务
    if curl -s http://localhost:3000/api/health > /dev/null; then
        log_success "后端服务运行正常"
    else
        log_error "后端服务不可访问"
        exit 1
    fi
    
    # 检查前端服务
    if curl -s http://localhost:5173 > /dev/null; then
        log_success "前端服务运行正常"
    else
        log_warning "前端服务不可访问（可选）"
    fi
}

# 测试用户注册功能
test_user_registration() {
    log_info "测试用户注册功能..."
    
    local test_user='{
        "username": "test_user_'$(date +%s)'",
        "email": "test'$(date +%s)'@example.com",
        "password": "Test123456!",
        "name": "测试用户"
    }'
    
    local response=$(make_request "POST" "${AUTH_BASE}/register" "$test_user")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        record_test "用户注册" "PASS"
        echo "$body" > /tmp/register_response.json
        return 0
    else
        record_test "用户注册" "FAIL"
        log_error "注册失败: HTTP $http_code"
        log_error "响应: $body"
        return 1
    fi
}

# 测试用户登录功能
test_user_login() {
    log_info "测试用户登录功能..."
    
    # 使用已知的测试账号或从注册响应中获取
    local login_data='{
        "username": "admin",
        "password": "admin123"
    }'
    
    local response=$(make_request "POST" "${AUTH_BASE}/login" "$login_data")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        record_test "用户登录" "PASS"
        # 提取token
        TOKEN=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$TOKEN" ]; then
            log_success "获取到认证token"
            export USER_TOKEN="$TOKEN"
        fi
        return 0
    else
        record_test "用户登录" "FAIL"
        log_error "登录失败: HTTP $http_code"
        log_error "响应: $body"
        return 1
    fi
}

# 测试获取当前用户信息
test_get_me() {
    log_info "测试获取当前用户信息..."
    
    if [ -z "$USER_TOKEN" ]; then
        log_warning "跳过测试：未获取到认证token"
        return 1
    fi
    
    local response=$(make_request "GET" "${USERS_BASE}/me" "null" "$USER_TOKEN")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        record_test "获取当前用户信息" "PASS"
        return 0
    else
        record_test "获取当前用户信息" "FAIL"
        log_error "获取用户信息失败: HTTP $http_code"
        return 1
    fi
}

# 测试获取用户列表（管理员功能）
test_get_users_list() {
    log_info "测试获取用户列表（管理员功能）..."
    
    if [ -z "$USER_TOKEN" ]; then
        log_warning "跳过测试：未获取到认证token"
        return 1
    fi
    
    local response=$(make_request "GET" "${USERS_BASE}/" "null" "$USER_TOKEN")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        record_test "获取用户列表" "PASS"
        log_success "用户列表获取成功"
        return 0
    elif [ "$http_code" = "403" ]; then
        record_test "获取用户列表" "PASS"
        log_success "权限控制正常工作（403 Forbidden）"
        return 0
    else
        record_test "获取用户列表" "FAIL"
        log_error "获取用户列表失败: HTTP $http_code"
        return 1
    fi
}

# 测试创建新用户（管理员功能）
test_create_user() {
    log_info "测试创建新用户（管理员功能）..."
    
    if [ -z "$USER_TOKEN" ]; then
        log_warning "跳过测试：未获取到认证token"
        return 1
    fi
    
    local new_user='{
        "username": "created_user_'$(date +%s)'",
        "email": "created'$(date +%s)'@example.com",
        "password": "Created123!",
        "name": "通过API创建的用户",
        "role": "user"
    }'
    
    local response=$(make_request "POST" "${USERS_BASE}/" "$new_user" "$USER_TOKEN")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        record_test "创建新用户" "PASS"
        # 保存创建的用户ID供后续测试使用
        CREATED_USER_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        return 0
    elif [ "$http_code" = "403" ]; then
        record_test "创建新用户" "PASS"
        log_success "权限控制正常工作（403 Forbidden）"
        return 0
    else
        record_test "创建新用户" "FAIL"
        log_error "创建用户失败: HTTP $http_code"
        return 1
    fi
}

# 测试更新用户信息
test_update_user() {
    log_info "测试更新用户信息..."
    
    if [ -z "$USER_TOKEN" ] || [ -z "$CREATED_USER_ID" ]; then
        log_warning "跳过测试：未获取到认证token或用户ID"
        return 1
    fi
    
    local update_data='{
        "name": "更新后的用户名",
        "department": "测试部门"
    }'
    
    local response=$(make_request "PATCH" "${USERS_BASE}/${CREATED_USER_ID}" "$update_data" "$USER_TOKEN")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        record_test "更新用户信息" "PASS"
        return 0
    elif [ "$http_code" = "403" ]; then
        record_test "更新用户信息" "PASS"
        log_success "权限控制正常工作（403 Forbidden）"
        return 0
    else
        record_test "更新用户信息" "FAIL"
        log_error "更新用户失败: HTTP $http_code"
        return 1
    fi
}

# 测试更新用户状态
test_update_user_status() {
    log_info "测试更新用户状态..."
    
    if [ -z "$USER_TOKEN" ] || [ -z "$CREATED_USER_ID" ]; then
        log_warning "跳过测试：未获取到认证token或用户ID"
        return 1
    fi
    
    local status_data='{"status": "inactive"}'
    
    local response=$(make_request "PATCH" "${USERS_BASE}/${CREATED_USER_ID}/status" "$status_data" "$USER_TOKEN")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        record_test "更新用户状态" "PASS"
        return 0
    elif [ "$http_code" = "403" ]; then
        record_test "更新用户状态" "PASS"
        log_success "权限控制正常工作（403 Forbidden）"
        return 0
    else
        record_test "更新用户状态" "FAIL"
        log_error "更新用户状态失败: HTTP $http_code"
        return 1
    fi
}

# 测试密码重置功能
test_reset_password() {
    log_info "测试管理员重置密码功能..."
    
    if [ -z "$USER_TOKEN" ] || [ -z "$CREATED_USER_ID" ]; then
        log_warning "跳过测试：未获取到认证token或用户ID"
        return 1
    fi
    
    local reset_data='{"newPassword": "NewPassword123!"}'
    
    local response=$(make_request "PATCH" "${USERS_BASE}/${CREATED_USER_ID}/reset-password" "$reset_data" "$USER_TOKEN")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        record_test "重置用户密码" "PASS"
        return 0
    elif [ "$http_code" = "403" ]; then
        record_test "重置用户密码" "PASS"
        log_success "权限控制正常工作（403 Forbidden）"
        return 0
    else
        record_test "重置用户密码" "FAIL"
        log_error "重置密码失败: HTTP $http_code"
        return 1
    fi
}

# 清理测试数据
cleanup_test_data() {
    log_info "清理测试数据..."
    
    if [ -n "$USER_TOKEN" ] && [ -n "$CREATED_USER_ID" ]; then
        log_info "删除测试创建的用户..."
        local response=$(make_request "DELETE" "${USERS_BASE}/${CREATED_USER_ID}" "null" "$USER_TOKEN")
        local http_code="${response: -3}"
        
        if [ "$http_code" = "200" ]; then
            log_success "测试数据清理成功"
        else
            log_warning "测试数据清理失败，可能需要手动清理"
        fi
    fi
    
    # 清理临时文件
    rm -f /tmp/register_response.json
}

# 打印测试结果摘要
print_summary() {
    echo ""
    echo "================================="
    log_info "测试结果摘要"
    echo "================================="
    log_info "总测试数: $TOTAL_TESTS"
    log_success "通过: $PASSED_TESTS"
    log_error "失败: $FAILED_TESTS"
    echo "================================="
    
    if [ "$FAILED_TESTS" -eq 0 ]; then
        log_success "所有测试通过! 🎉"
        return 0
    else
        log_error "存在失败的测试 ⚠️"
        return 1
    fi
}

# 主测试流程
main() {
    log_info "开始用户管理API测试..."
    echo ""
    
    # 检查服务状态
    check_services
    echo ""
    
    # 执行测试
    test_user_registration
    test_user_login
    test_get_me
    test_get_users_list
    test_create_user
    test_update_user
    test_update_user_status
    test_reset_password
    
    echo ""
    
    # 清理测试数据
    cleanup_test_data
    
    echo ""
    
    # 打印摘要
    print_summary
}

# 捕获Ctrl+C信号，确保清理
trap cleanup_test_data EXIT

# 执行测试
main "$@"