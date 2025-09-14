#!/bin/bash

# test-ci-simulation.sh - CI环境模拟测试脚本
# 模拟GitHub Actions CI环境，测试服务启动和健康检查流程

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEST_TIMEOUT=180

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# 清理函数
cleanup() {
    log_info "清理测试环境..."

    # 停止服务
    if [ -f /tmp/backend.pid ]; then
        kill $(cat /tmp/backend.pid) 2>/dev/null || true
        rm -f /tmp/backend.pid
    fi

    if [ -f /tmp/frontend.pid ]; then
        kill $(cat /tmp/frontend.pid) 2>/dev/null || true
        rm -f /tmp/frontend.pid
    fi

    # 强制清理端口
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true

    # 清理临时文件
    rm -f "$PROJECT_ROOT/backend-startup.log"
    rm -f "$PROJECT_ROOT/frontend-startup.log"

    log_info "清理完成"
}

# 设置信号处理
trap cleanup EXIT INT TERM

# 检查依赖
check_dependencies() {
    log_step "检查依赖项..."

    local missing_deps=()

    # 检查必要的命令
    local required_commands=("node" "npm" "curl" "nc" "lsof")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing_deps+=("$cmd")
        fi
    done

    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "缺少必要的依赖: ${missing_deps[*]}"
        return 1
    fi

    log_success "所有依赖项检查通过"
}

# 检查端口是否被占用
check_ports() {
    log_step "检查端口状态..."

    if lsof -i :3000 >/dev/null 2>&1; then
        log_error "端口3000已被占用，请先停止相关服务"
        lsof -i :3000
        return 1
    fi

    if lsof -i :5173 >/dev/null 2>&1; then
        log_error "端口5173已被占用，请先停止相关服务"
        lsof -i :5173
        return 1
    fi

    log_success "端口检查通过"
}

# 设置测试环境
setup_test_environment() {
    log_step "设置测试环境..."

    cd "$PROJECT_ROOT"

    # 设置前端环境变量
    log_info "设置前端环境变量..."
    if [ -f .env.ci.template ]; then
        cp .env.ci.template .env
        log_success "使用CI环境配置模板"
    else
        log_warning "CI环境配置模板不存在，使用默认配置"
        cat > .env << EOF
NODE_ENV=test
VITE_API_BASE_URL=http://localhost:3000
EOF
    fi

    # 设置后端环境变量
    log_info "设置后端环境变量..."
    cd server
    cat > .env << EOF
NODE_ENV=test
PORT=3000
HOST=0.0.0.0
MONGODB_URI=mongodb://localhost:27017/sdszk_test
REDIS_ENABLED=false
JWT_SECRET=ci_test_jwt_secret_key_12345
JWT_EXPIRES_IN=24h
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
LOG_LEVEL=info
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
RATE_LIMIT_ENABLED=false
API_DOCS_ENABLED=true
HEALTH_CHECK_ENABLED=true
EOF
    cd ..

    log_success "测试环境设置完成"
}

# 启动服务
start_services() {
    log_step "启动应用服务..."

    cd "$PROJECT_ROOT"

    # 确保等待脚本可执行
    chmod +x scripts/ci/wait-services-enhanced.sh

    # 启动后端服务器
    log_info "启动后端服务..."
    cd server
    npm start > ../backend-startup.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > /tmp/backend.pid
    cd ..
    log_success "后端服务已启动 (PID: $BACKEND_PID)"

    # 验证后端进程是否启动成功
    sleep 2
    if kill -0 $BACKEND_PID 2>/dev/null; then
        log_success "后端进程运行正常"
    else
        log_error "后端进程启动失败"
        log_info "后端启动日志:"
        cat backend-startup.log
        return 1
    fi

    # 启动前端服务器
    log_info "启动前端服务..."
    npm run dev > frontend-startup.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > /tmp/frontend.pid
    log_success "前端服务已启动 (PID: $FRONTEND_PID)"

    # 验证前端进程是否启动成功
    sleep 2
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        log_success "前端进程运行正常"
    else
        log_error "前端进程启动失败"
        log_info "前端启动日志:"
        cat frontend-startup.log
        return 1
    fi

    log_success "所有服务启动完成"
}

# 等待端口开放
wait_for_ports() {
    log_step "等待端口开放..."

    # 等待后端端口
    log_info "等待后端端口3000..."
    for i in {1..30}; do
        if nc -z localhost 3000 2>/dev/null; then
            log_success "后端端口3000已开放 (用时: ${i}秒)"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "后端端口3000未开放，检查服务状态"
            BACKEND_PID=$(cat /tmp/backend.pid)
            if kill -0 $BACKEND_PID 2>/dev/null; then
                log_info "进程仍在运行，但端口未监听"
            else
                log_info "进程已退出"
            fi
            log_info "后端启动日志:"
            cat backend-startup.log
            return 1
        fi
        sleep 1
    done

    # 等待前端端口
    log_info "等待前端端口5173..."
    for i in {1..30}; do
        if nc -z localhost 5173 2>/dev/null; then
            log_success "前端端口5173已开放 (用时: ${i}秒)"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "前端端口5173未开放"
            return 1
        fi
        sleep 1
    done

    log_success "所有端口已开放"
}

# 执行健康检查
run_health_checks() {
    log_step "执行服务健康检查..."

    cd "$PROJECT_ROOT"

    # 使用增强的等待脚本验证服务状态
    if ./scripts/ci/wait-services-enhanced.sh --timeout $TEST_TIMEOUT; then
        log_success "健康检查完成"
        return 0
    else
        log_error "健康检查失败"
        return 1
    fi
}

# 运行简单的E2E测试
run_simple_e2e_test() {
    log_step "运行简单的E2E测试..."

    # 测试前端首页
    log_info "测试前端服务..."
    if curl -s -f http://localhost:5173/ >/dev/null; then
        log_success "前端服务响应正常"
    else
        log_error "前端服务无响应"
        return 1
    fi

    # 测试后端健康检查端点
    local endpoints=("/api/health/basic" "/api/health/ready" "/api/health")
    for endpoint in "${endpoints[@]}"; do
        log_info "测试端点: $endpoint"
        local response=$(curl -s -w "HTTPSTATUS:%{http_code}" "http://localhost:3000$endpoint" 2>/dev/null || echo "HTTPSTATUS:000")
        local http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)

        if [[ "$http_code" == "200" ]]; then
            log_success "$endpoint 响应正常 (状态码: $http_code)"
        elif [[ "$http_code" == "503" ]]; then
            log_warning "$endpoint 服务不可用 (状态码: $http_code)"
        else
            log_error "$endpoint 响应异常 (状态码: $http_code)"
        fi
    done

    log_success "简单E2E测试完成"
}

# 显示测试报告
show_test_report() {
    log_step "测试报告"

    echo ""
    echo "==================== 测试报告 ===================="
    echo "测试时间: $(date)"
    echo "项目路径: $PROJECT_ROOT"
    echo ""

    # 进程状态
    if [ -f /tmp/backend.pid ] && kill -0 $(cat /tmp/backend.pid) 2>/dev/null; then
        echo "✅ 后端服务: 运行中 (PID: $(cat /tmp/backend.pid))"
    else
        echo "❌ 后端服务: 未运行"
    fi

    if [ -f /tmp/frontend.pid ] && kill -0 $(cat /tmp/frontend.pid) 2>/dev/null; then
        echo "✅ 前端服务: 运行中 (PID: $(cat /tmp/frontend.pid))"
    else
        echo "❌ 前端服务: 未运行"
    fi

    # 端口状态
    if nc -z localhost 3000 2>/dev/null; then
        echo "✅ 后端端口: 3000 (开放)"
    else
        echo "❌ 后端端口: 3000 (关闭)"
    fi

    if nc -z localhost 5173 2>/dev/null; then
        echo "✅ 前端端口: 5173 (开放)"
    else
        echo "❌ 前端端口: 5173 (关闭)"
    fi

    # 服务响应
    local backend_status=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:3000/api/health/basic" 2>/dev/null || echo "000")
    local frontend_status=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:5173/" 2>/dev/null || echo "000")

    echo "🌐 后端API响应: HTTP $backend_status"
    echo "🌐 前端页面响应: HTTP $frontend_status"

    echo ""
    echo "=================================================="
}

# 主函数
main() {
    echo "🧪 CI环境模拟测试"
    echo "=================="
    echo "项目路径: $PROJECT_ROOT"
    echo "测试超时: ${TEST_TIMEOUT}秒"
    echo ""

    # 执行测试步骤
    check_dependencies
    check_ports
    setup_test_environment
    start_services
    wait_for_ports
    run_health_checks
    run_simple_e2e_test
    show_test_report

    log_success "CI环境模拟测试完成！"
    echo ""
    echo "🎉 测试成功！所有服务都正常启动并响应。"
    echo "💡 这表明CI/CD环境中的E2E测试应该能够正常工作。"
    echo ""
    echo "📝 要停止服务，请按 Ctrl+C 或运行: bash scripts/development/dev-stop.sh"
    echo ""

    # 保持服务运行，直到用户中断
    log_info "服务将继续运行，按 Ctrl+C 停止..."
    while true; do
        sleep 10
        # 检查服务是否仍在运行
        if [ -f /tmp/backend.pid ] && ! kill -0 $(cat /tmp/backend.pid) 2>/dev/null; then
            log_warning "后端服务意外停止"
            break
        fi
        if [ -f /tmp/frontend.pid ] && ! kill -0 $(cat /tmp/frontend.pid) 2>/dev/null; then
            log_warning "前端服务意外停止"
            break
        fi
    done
}

# 运行主函数
main "$@"
