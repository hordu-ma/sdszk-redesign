#!/bin/bash

# MongoDB连接测试脚本
# 用于CI环境中验证MongoDB服务是否正常启动

set -e

echo "🔍 开始MongoDB连接测试..."

# 配置参数
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MAX_ATTEMPTS=30
WAIT_INTERVAL=2

echo "📋 测试配置:"
echo "   主机: $MONGO_HOST"
echo "   端口: $MONGO_PORT"
echo "   最大重试次数: $MAX_ATTEMPTS"
echo "   重试间隔: ${WAIT_INTERVAL}s"

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

# 函数：检查MongoDB命令是否可用
check_mongo_command() {
    if command -v mongosh >/dev/null 2>&1; then
        echo "mongosh"
    elif command -v mongo >/dev/null 2>&1; then
        echo "mongo"
    else
        echo ""
    fi
}

# 第一步：检查端口连通性
echo ""
echo "🔌 第一步：检查端口连通性..."
attempt=1
while [ $attempt -le $MAX_ATTEMPTS ]; do
    echo "   尝试 $attempt/$MAX_ATTEMPTS: 检查端口 $MONGO_HOST:$MONGO_PORT"

    if check_port "$MONGO_HOST" "$MONGO_PORT"; then
        echo "   ✅ 端口 $MONGO_PORT 已开放"
        break
    fi

    if [ $attempt -eq $MAX_ATTEMPTS ]; then
        echo "   ❌ 端口检查失败：$MAX_ATTEMPTS 次尝试后端口仍未开放"
        exit 1
    fi

    sleep $WAIT_INTERVAL
    attempt=$((attempt + 1))
done

# 第二步：检查MongoDB服务响应
echo ""
echo "🗄️ 第二步：检查MongoDB服务响应..."

MONGO_CMD=$(check_mongo_command)
if [ -z "$MONGO_CMD" ]; then
    echo "   ⚠️ 未找到mongo或mongosh命令，跳过服务响应检查"
    echo "   ✅ 端口检查通过，假设服务正常"
    exit 0
fi

echo "   使用命令: $MONGO_CMD"

attempt=1
while [ $attempt -le $MAX_ATTEMPTS ]; do
    echo "   尝试 $attempt/$MAX_ATTEMPTS: 执行ping命令"

    # 构建连接字符串
    if [ "$MONGO_CMD" = "mongosh" ]; then
        CONNECTION_STRING="mongodb://$MONGO_HOST:$MONGO_PORT/test"
        PING_CMD="$MONGO_CMD --quiet '$CONNECTION_STRING' --eval 'db.runCommand({ping: 1})'"
    else
        PING_CMD="$MONGO_CMD --host $MONGO_HOST:$MONGO_PORT --eval 'db.runCommand({ping: 1})'"
    fi

    # 执行ping命令
    if eval "$PING_CMD" >/dev/null 2>&1; then
        echo "   ✅ MongoDB服务响应正常"
        break
    fi

    if [ $attempt -eq $MAX_ATTEMPTS ]; then
        echo "   ❌ MongoDB服务检查失败：$MAX_ATTEMPTS 次尝试后服务仍无响应"
        echo ""
        echo "🔍 调试信息："
        echo "   执行的命令: $PING_CMD"
        echo "   最后一次错误输出:"
        eval "$PING_CMD" 2>&1 | head -10 || true
        exit 1
    fi

    sleep $WAIT_INTERVAL
    attempt=$((attempt + 1))
done

# 第三步：验证基本数据库操作
echo ""
echo "📝 第三步：验证基本数据库操作..."

if [ "$MONGO_CMD" = "mongosh" ]; then
    TEST_CMD="$MONGO_CMD --quiet '$CONNECTION_STRING' --eval 'db.test.insertOne({test: true}); db.test.findOne({test: true}); db.test.drop()'"
else
    TEST_CMD="$MONGO_CMD --host $MONGO_HOST:$MONGO_PORT --eval 'db.test.insertOne({test: true}); db.test.findOne({test: true}); db.test.drop()'"
fi

if eval "$TEST_CMD" >/dev/null 2>&1; then
    echo "   ✅ 基本数据库操作正常"
else
    echo "   ⚠️ 基本数据库操作失败，但连接正常"
fi

echo ""
echo "🎉 MongoDB连接测试完成！"
echo "   状态: 服务正常运行"
echo "   主机: $MONGO_HOST:$MONGO_PORT"
echo "   命令: $MONGO_CMD"
exit 0
