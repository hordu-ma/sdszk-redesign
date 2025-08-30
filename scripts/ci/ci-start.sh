#!/bin/bash

echo "🚀 启动CI环境服务..."

# 设置错误处理
set -e

# 等待服务函数
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=30
    local attempt=1

    echo "⏳ 等待 $service_name 服务启动 ($host:$port)..."

    while [ $attempt -le $max_attempts ]; do
        if nc -z $host $port 2>/dev/null; then
            echo "✅ $service_name 服务已就绪"
            return 0
        fi

        echo "   尝试 $attempt/$max_attempts - 等待 $service_name..."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo "❌ $service_name 服务启动超时"
    return 1
}

# 验证服务连接函数
verify_service() {
    local service=$1
    local check_command=$2

    echo "🔍 验证 $service 连接..."
    if eval $check_command; then
        echo "✅ $service 连接正常"
        return 0
    else
        echo "❌ $service 连接失败"
        return 1
    fi
}

# 检查必要工具
echo "🔧 检查必要工具..."
command -v node >/dev/null 2>&1 || { echo "❌ 需要 Node.js"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ 需要 npm"; exit 1; }

# 设置环境变量
export NODE_ENV=test
export CI=true

# 复制CI环境配置文件
echo "📝 设置CI环境配置..."
if [ -f ".env.ci" ]; then
    cp .env.ci .env
    echo "✅ 前端环境配置已设置"
else
    echo "⚠️  警告: .env.ci 文件不存在"
fi

if [ -f "server/.env.ci" ]; then
    cp server/.env.ci server/.env
    echo "✅ 后端环境配置已设置"
else
    echo "⚠️  警告: server/.env.ci 文件不存在"
fi

# 等待数据库服务就绪
echo "🔄 等待数据库服务..."
wait_for_service localhost 27017 "MongoDB"
wait_for_service localhost 6379 "Redis"

# 验证数据库连接
verify_service "MongoDB" "mongosh --host localhost:27017 --eval 'db.runCommand({ping: 1})' >/dev/null 2>&1"
verify_service "Redis" "redis-cli -h localhost -p 6379 ping >/dev/null 2>&1"

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm ci
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd server
    npm ci
    cd ..
fi

# 启动后端服务器
echo "🖥️  启动后端服务器..."
cd server
npm start &
BACKEND_PID=$!
cd ..

# 等待后端服务器启动
echo "⏳ 等待后端服务器启动..."
wait_for_service localhost 3000 "后端API"

# 验证API连接
verify_service "后端API" "curl -f http://localhost:3000/api/health >/dev/null 2>&1 || curl -f http://localhost:3000/api/status >/dev/null 2>&1"

# 启动前端开发服务器
echo "🌐 启动前端开发服务器..."
npm run dev &
FRONTEND_PID=$!

# 等待前端服务器启动
echo "⏳ 等待前端服务器启动..."
wait_for_service localhost 5173 "前端开发服务器"

# 验证前端页面
verify_service "前端应用" "curl -f http://localhost:5173 >/dev/null 2>&1"

echo "🎉 CI环境启动完成！"
echo "📝 后端服务器 PID: $BACKEND_PID"
echo "📝 前端服务器 PID: $FRONTEND_PID"
echo ""
echo "🌍 前端应用: http://localhost:5173"
echo "📡 API服务: http://localhost:3000"
echo "🔧 API健康检查: http://localhost:3000/api/health"
echo ""

# 将PID写入文件以便后续清理
echo $BACKEND_PID > /tmp/ci-backend.pid
echo $FRONTEND_PID > /tmp/ci-frontend.pid

echo "✅ 所有服务已启动并验证完成，准备运行测试"
