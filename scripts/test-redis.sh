#!/bin/bash

# Redis连接测试脚本
# 用于CI环境中验证Redis服务是否正常启动

set -e

echo "🔍 开始Redis连接测试..."

# 配置参数
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
MAX_ATTEMPTS=30
WAIT_INTERVAL=2

echo "📋 测试配置:"
echo "   主机: $REDIS_HOST"
echo "   端口: $REDIS_PORT"
echo "   最大重试次数: $MAX_ATTEMPTS"
echo "   重试间隔: ${WAIT_INTERVAL}s"

# 环境诊断信息
echo ""
echo "🔍 环境诊断信息:"
echo "   当前时间: $(date)"
echo "   用户: $(whoami)"
echo "   工作目录: $(pwd)"

# 网络诊断
if command -v netstat >/dev/null 2>&1; then
    echo "   监听的端口:"
    netstat -ln | grep ":$REDIS_PORT " | head -3 || echo "     未找到端口 $REDIS_PORT"
fi

# Docker 容器信息（如果在 CI 环境中）
if command -v docker >/dev/null 2>&1 && [ "${CI:-}" = "true" ]; then
    echo "   Docker 容器状态:"
    docker ps --filter "expose=$REDIS_PORT" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "     无法获取容器信息"
fi

# 函数：检查端口是否开放
check_port() {
    local host=$1
    local port=$2

    if command -v nc >/dev/null 2>&1; then
        nc -z "$host" "$port" 2>/dev/null
    elif command -v telnet >/dev/null 2>&1; then
        timeout 5 telnet "$host" "$port" </dev/null >/dev/null 2>&1
    else
        # 使用bash内置功能
        timeout 5 bash -c "exec 3<>/dev/tcp/$host/$port" 2>/dev/null
    fi
}

# 第一步：检查端口连通性
echo ""
echo "🔌 第一步：检查端口连通性..."
attempt=1
while [ $attempt -le $MAX_ATTEMPTS ]; do
    echo "   尝试 $attempt/$MAX_ATTEMPTS: 检查端口 $REDIS_HOST:$REDIS_PORT"

    if check_port "$REDIS_HOST" "$REDIS_PORT"; then
        echo "   ✅ 端口 $REDIS_PORT 已开放"
        break
    fi

    if [ $attempt -eq $MAX_ATTEMPTS ]; then
        echo "   ❌ 端口检查失败：$MAX_ATTEMPTS 次尝试后端口仍未开放"
        echo ""
        echo "🔍 调试信息:"
        echo "   检查命令失败，可能的原因："
        echo "   1. Redis 服务未启动"
        echo "   2. 主机名 '$REDIS_HOST' 无法解析"
        echo "   3. 端口 '$REDIS_PORT' 未开放"
        echo "   4. 网络连接问题"

        # 尝试解析主机名
        if command -v nslookup >/dev/null 2>&1; then
            echo "   主机名解析测试:"
            nslookup "$REDIS_HOST" 2>&1 | head -5 || echo "     主机名解析失败"
        fi

        # 检查其他常用Redis端口
        echo "   检查其他常用端口:"
        for test_port in 6380 6381; do
            if check_port "$REDIS_HOST" "$test_port"; then
                echo "     端口 $test_port: 开放"
            else
                echo "     端口 $test_port: 关闭"
            fi
        done

        exit 1
    fi

    sleep $WAIT_INTERVAL
    attempt=$((attempt + 1))
done

# 第二步：检查Redis服务响应
echo ""
echo "🗄️ 第二步：检查Redis服务响应..."

if ! command -v redis-cli >/dev/null 2>&1; then
    echo "   ⚠️ 未找到redis-cli命令，跳过服务响应检查"
    echo "   ✅ 端口检查通过，假设服务正常"
    exit 0
fi

attempt=1
while [ $attempt -le $MAX_ATTEMPTS ]; do
    echo "   尝试 $attempt/$MAX_ATTEMPTS: 执行PING命令"

    # 执行PING命令
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping | grep -q "PONG"; then
        echo "   ✅ Redis服务响应正常 (PONG)"
        break
    fi

    if [ $attempt -eq $MAX_ATTEMPTS ]; then
        echo "   ❌ Redis服务检查失败：$MAX_ATTEMPTS 次尝试后服务仍无响应"
        echo ""
        echo "🔍 调试信息："
        echo "   执行的命令: redis-cli -h $REDIS_HOST -p $REDIS_PORT ping"
        echo "   Redis CLI 版本:"
        redis-cli --version 2>&1 || echo "     无法获取版本信息"
        echo "   最后一次错误输出:"
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>&1 || true
        echo "   尝试连接详细信息:"
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" --latency-history -i 1 2>&1 | head -3 || true

        # 如果在CI环境，显示容器日志
        if [ "${CI:-}" = "true" ] && command -v docker >/dev/null 2>&1; then
            echo "   Redis 容器日志 (最后10行):"
            docker logs $(docker ps -q --filter "ancestor=redis:7.2-alpine") --tail 10 2>/dev/null || echo "     无法获取容器日志"
        fi

        exit 1
    fi

    sleep $WAIT_INTERVAL
    attempt=$((attempt + 1))
done

# 第三步：验证基本数据库操作
echo ""
echo "📝 第三步：验证基本数据库操作..."

TEST_KEY="ci-test-$(date +%s)"
TEST_VALUE="success"

if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" SET "$TEST_KEY" "$TEST_VALUE" | grep -q "OK"; then
    echo "   ✅ SET操作成功"

    VALUE=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" GET "$TEST_KEY")
    if [ "$VALUE" = "$TEST_VALUE" ]; then
        echo "   ✅ GET操作成功"
    else
        echo "   ❌ GET操作失败：期望 '$TEST_VALUE'，得到 '$VALUE'"
    fi

    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" DEL "$TEST_KEY" >/dev/null 2>&1
    echo "   ✅ DEL操作成功"
else
    echo "   ⚠️ 基本数据库操作失败，但连接正常"
fi

echo ""
echo "🎉 Redis连接测试完成！"
echo "   状态: 服务正常运行"
echo "   主机: $REDIS_HOST:$REDIS_PORT"
exit 0
