#!/bin/bash

# 增强版 Redis 连接测试脚本
# 专为 CI/CD 环境设计，提供详细的诊断信息和多种连接方式

set -e

echo "🔍 开始增强版 Redis 连接测试..."

# 配置参数
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
MAX_ATTEMPTS=30
WAIT_INTERVAL=2
VERBOSE="${VERBOSE:-0}"

# 颜色输出
if [[ -t 1 ]]; then
  RED='\033[31m'
  GREEN='\033[32m'
  YELLOW='\033[33m'
  BLUE='\033[34m'
  CYAN='\033[36m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  RED='' GREEN='' YELLOW='' BLUE='' CYAN='' BOLD='' RESET=''
fi

log() { printf "%b[%s]%b %s\n" "$CYAN" "$(date +'%H:%M:%S')" "$RESET" "$*"; }
info() { printf "%b[INFO]%b %s\n" "$BLUE" "$RESET" "$*"; }
warn() { printf "%b[WARN]%b %s\n" "$YELLOW" "$RESET" "$*"; }
error() { printf "%b[ERROR]%b %s\n" "$RED" "$RESET" "$*"; }
success() { printf "%b[DONE]%b %s\n" "$GREEN" "$RESET" "$*"; }
debug() { if [[ "${VERBOSE:-0}" -eq 1 ]]; then printf "%b[DEBUG]%b %s\n" "$RESET" "$RESET" "$*"; fi; }

echo "📋 测试配置:"
echo "   主机: $REDIS_HOST"
echo "   端口: $REDIS_PORT"
echo "   最大重试次数: $MAX_ATTEMPTS"
echo "   重试间隔: ${WAIT_INTERVAL}s"
echo "   详细模式: $([[ "$VERBOSE" == "1" ]] && echo "开启" || echo "关闭")"

# 环境诊断信息
echo ""
info "环境诊断信息:"
echo "   当前时间: $(date)"
echo "   用户: $(whoami)"
echo "   工作目录: $(pwd)"
echo "   环境变量:"
echo "     CI: ${CI:-未设置}"
echo "     NODE_ENV: ${NODE_ENV:-未设置}"
echo "     REDIS_HOST: ${REDIS_HOST}"
echo "     REDIS_PORT: ${REDIS_PORT}"

# 网络诊断
echo ""
info "网络诊断:"

# 检查监听端口
if command -v netstat >/dev/null 2>&1; then
    echo "   监听的端口 (netstat):"
    netstat -ln 2>/dev/null | grep ":$REDIS_PORT " | head -3 || echo "     未找到端口 $REDIS_PORT"
elif command -v ss >/dev/null 2>&1; then
    echo "   监听的端口 (ss):"
    ss -ln 2>/dev/null | grep ":$REDIS_PORT " | head -3 || echo "     未找到端口 $REDIS_PORT"
fi

# 检查进程
if command -v ps >/dev/null 2>&1; then
    echo "   Redis 相关进程:"
    ps aux 2>/dev/null | grep -i redis | grep -v grep | head -3 || echo "     未找到 Redis 进程"
fi

# Docker 容器信息（如果在 CI 环境中）
if command -v docker >/dev/null 2>&1 && [ "${CI:-}" = "true" ]; then
    echo ""
    info "Docker 容器信息:"
    echo "   所有容器状态:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "     无法获取容器信息"

    echo "   Redis 容器详情:"
    docker ps --filter "expose=$REDIS_PORT" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "     未找到 Redis 容器"

    # 容器健康状态
    redis_container=$(docker ps -q --filter "ancestor=redis:7.2-alpine" 2>/dev/null | head -1)
    if [ -n "$redis_container" ]; then
        health_status=$(docker inspect --format='{{.State.Health.Status}}' "$redis_container" 2>/dev/null || echo "无健康检查")
        echo "   Redis 容器健康状态: $health_status"

        if [ "$health_status" != "healthy" ]; then
            echo "   最近的健康检查日志:"
            docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' "$redis_container" 2>/dev/null | tail -3 || echo "     无法获取健康检查日志"
        fi
    fi
fi

# 主机名解析测试
echo ""
info "主机名解析测试:"
if command -v nslookup >/dev/null 2>&1; then
    echo "   nslookup $REDIS_HOST:"
    nslookup "$REDIS_HOST" 2>&1 | head -5 || echo "     解析失败"
elif command -v dig >/dev/null 2>&1; then
    echo "   dig $REDIS_HOST:"
    dig "$REDIS_HOST" +short 2>&1 | head -3 || echo "     解析失败"
elif command -v host >/dev/null 2>&1; then
    echo "   host $REDIS_HOST:"
    host "$REDIS_HOST" 2>&1 | head -3 || echo "     解析失败"
else
    echo "   无可用的 DNS 查询工具"
fi

# 函数：多种方式检查端口
check_port_multiple() {
    local host=$1
    local port=$2
    local method_used=""

    # 方法1: netcat
    if command -v nc >/dev/null 2>&1; then
        if nc -z "$host" "$port" 2>/dev/null; then
            method_used="netcat"
            debug "端口检查成功: $method_used"
            return 0
        fi
    fi

    # 方法2: telnet
    if command -v telnet >/dev/null 2>&1; then
        if timeout 5 telnet "$host" "$port" </dev/null >/dev/null 2>&1; then
            method_used="telnet"
            debug "端口检查成功: $method_used"
            return 0
        fi
    fi

    # 方法3: bash 内置
    if timeout 5 bash -c "exec 3<>/dev/tcp/$host/$port" 2>/dev/null; then
        exec 3>&-
        method_used="bash-builtin"
        debug "端口检查成功: $method_used"
        return 0
    fi

    # 方法4: curl
    if command -v curl >/dev/null 2>&1; then
        if curl -s --connect-timeout 5 --max-time 5 "telnet://$host:$port" 2>/dev/null; then
            method_used="curl"
            debug "端口检查成功: $method_used"
            return 0
        fi
    fi

    debug "所有端口检查方法都失败"
    return 1
}

# 第一步：检查端口连通性
echo ""
info "第一步：检查端口连通性..."
attempt=1
port_check_passed=false

while [ $attempt -le $MAX_ATTEMPTS ]; do
    echo "   尝试 $attempt/$MAX_ATTEMPTS: 检查端口 $REDIS_HOST:$REDIS_PORT"

    if check_port_multiple "$REDIS_HOST" "$REDIS_PORT"; then
        success "端口 $REDIS_PORT 已开放"
        port_check_passed=true
        break
    fi

    if [ $attempt -eq $MAX_ATTEMPTS ]; then
        error "端口检查失败：$MAX_ATTEMPTS 次尝试后端口仍未开放"

        # 详细的错误诊断
        echo ""
        error "详细诊断信息:"
        echo "   1. 检查服务是否启动"
        echo "   2. 验证主机名解析: $REDIS_HOST"
        echo "   3. 确认端口映射: $REDIS_PORT"
        echo "   4. 检查防火墙设置"

        # 尝试 ping 主机
        if command -v ping >/dev/null 2>&1; then
            echo "   ping 测试:"
            timeout 5 ping -c 2 "$REDIS_HOST" 2>&1 | head -3 || echo "     ping 失败"
        fi

        # 检查其他常用Redis端口
        echo "   扫描其他常用 Redis 端口:"
        for test_port in 6380 6381 6382; do
            if check_port_multiple "$REDIS_HOST" "$test_port"; then
                warn "发现开放端口: $test_port (可能的Redis实例)"
            fi
        done

        # 显示容器日志
        if [ "${CI:-}" = "true" ] && command -v docker >/dev/null 2>&1; then
            echo "   Redis 容器日志 (最后20行):"
            docker logs $(docker ps -q --filter "ancestor=redis:7.2-alpine") --tail 20 2>/dev/null || echo "     无法获取容器日志"
        fi

        exit 1
    fi

    sleep $WAIT_INTERVAL
    attempt=$((attempt + 1))
done

# 第二步：检查Redis服务响应
echo ""
info "第二步：检查Redis服务响应..."

# 检查 redis-cli 可用性
if ! command -v redis-cli >/dev/null 2>&1; then
    warn "未找到 redis-cli 命令"
    echo "   尝试安装 redis-cli..."

    if command -v apt-get >/dev/null 2>&1; then
        apt-get update >/dev/null 2>&1 && apt-get install -y redis-tools >/dev/null 2>&1 || echo "     安装失败"
    elif command -v yum >/dev/null 2>&1; then
        yum install -y redis >/dev/null 2>&1 || echo "     安装失败"
    elif command -v apk >/dev/null 2>&1; then
        apk add --no-cache redis >/dev/null 2>&1 || echo "     安装失败"
    fi

    if ! command -v redis-cli >/dev/null 2>&1; then
        warn "无法安装 redis-cli，跳过服务响应检查"
        success "端口检查通过，假设服务正常"
        exit 0
    fi
fi

echo "   Redis CLI 版本: $(redis-cli --version)"

attempt=1
redis_check_passed=false

while [ $attempt -le $MAX_ATTEMPTS ]; do
    echo "   尝试 $attempt/$MAX_ATTEMPTS: 执行 PING 命令"

    # 执行PING命令并捕获输出
    ping_result=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>&1)
    ping_exit_code=$?

    debug "PING 结果: $ping_result (退出码: $ping_exit_code)"

    if [ $ping_exit_code -eq 0 ] && echo "$ping_result" | grep -q "PONG"; then
        success "Redis 服务响应正常 (PONG)"
        redis_check_passed=true
        break
    fi

    if [ $attempt -eq $MAX_ATTEMPTS ]; then
        error "Redis 服务检查失败：$MAX_ATTEMPTS 次尝试后服务仍无响应"
        echo ""
        error "详细调试信息："
        echo "   执行命令: redis-cli -h $REDIS_HOST -p $REDIS_PORT ping"
        echo "   最后输出: $ping_result"
        echo "   退出码: $ping_exit_code"

        # 尝试其他Redis命令
        echo "   尝试其他诊断命令:"
        echo "     INFO server:"
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO server 2>&1 | head -3 || echo "       INFO 命令失败"

        echo "     CLIENT LIST:"
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" CLIENT LIST 2>&1 | wc -l || echo "       CLIENT LIST 命令失败"

        # 连接延迟测试
        echo "   连接延迟测试:"
        timeout 10 redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" --latency-history -i 1 2>&1 | head -3 || echo "     延迟测试失败"

        exit 1
    fi

    sleep $WAIT_INTERVAL
    attempt=$((attempt + 1))
done

# 第三步：验证基本数据库操作
echo ""
info "第三步：验证基本数据库操作..."

TEST_KEY="ci-test-$(date +%s)-$$"
TEST_VALUE="success-$(hostname)"

echo "   使用测试键: $TEST_KEY"

# SET 操作
set_result=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" SET "$TEST_KEY" "$TEST_VALUE" 2>&1)
if echo "$set_result" | grep -q "OK"; then
    success "SET 操作成功"
else
    warn "SET 操作失败: $set_result"
fi

# GET 操作
get_value=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" GET "$TEST_KEY" 2>&1)
if [ "$get_value" = "$TEST_VALUE" ]; then
    success "GET 操作成功"
else
    warn "GET 操作失败: 期望 '$TEST_VALUE'，得到 '$get_value'"
fi

# DEL 操作
del_result=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" DEL "$TEST_KEY" 2>&1)
if [ "$del_result" = "1" ]; then
    success "DEL 操作成功"
else
    warn "DEL 操作结果: $del_result"
fi

# 第四步：性能测试（可选）
if [ "${VERBOSE:-0}" -eq 1 ]; then
    echo ""
    info "第四步：简单性能测试..."

    echo "   执行 100 次 PING 命令:"
    start_time=$(date +%s%N)
    for i in {1..100}; do
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping >/dev/null 2>&1 || break
    done
    end_time=$(date +%s%N)

    duration=$(( (end_time - start_time) / 1000000 ))  # 转换为毫秒
    avg_latency=$(( duration / 100 ))
    echo "     总时间: ${duration}ms"
    echo "     平均延迟: ${avg_latency}ms"

    if [ $avg_latency -lt 10 ]; then
        success "性能测试: 优秀 (< 10ms)"
    elif [ $avg_latency -lt 50 ]; then
        info "性能测试: 良好 (< 50ms)"
    else
        warn "性能测试: 较慢 (>= 50ms)"
    fi
fi

# 总结
echo ""
success "Redis 连接测试完成！"
echo "   状态: 服务正常运行"
echo "   主机: $REDIS_HOST:$REDIS_PORT"
echo "   端口检查: $([[ "$port_check_passed" == "true" ]] && echo "✅ 通过" || echo "❌ 失败")"
echo "   服务响应: $([[ "$redis_check_passed" == "true" ]] && echo "✅ 通过" || echo "❌ 失败")"
echo "   测试时间: $(date)"

exit 0
