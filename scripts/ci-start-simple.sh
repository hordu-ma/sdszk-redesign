#!/bin/bash

echo "🚀 启动简化CI环境..."

# 设置错误处理
set -e

# 基本环境变量
export NODE_ENV=test
export CI=true

# 创建基本环境配置
echo "📝 创建环境配置..."
cat > .env << EOF
NODE_ENV=test
VITE_API_BASE_URL=http://localhost:3000/api
CI=true
EOF

cat > server/.env << EOF
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/sdszk_test
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_ENABLED=true
JWT_SECRET=test-secret-key-do-not-use-in-production
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173
EOF

# 等待数据库服务函数
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_wait=60

    echo "⏳ 等待 $service_name ($host:$port)..."
    timeout $max_wait bash -c "until nc -z $host $port; do sleep 1; done" || {
        echo "❌ $service_name 启动超时"
        return 1
    }
    echo "✅ $service_name 已就绪"
}

# 等待数据库服务
wait_for_service localhost 27017 "MongoDB"
wait_for_service localhost 6379 "Redis"

# 验证数据库连接
echo "🔍 验证数据库连接..."
mongosh --host localhost:27017 --quiet --eval "db.runCommand({ping: 1})" >/dev/null 2>&1 || {
    echo "❌ MongoDB连接失败"
    exit 1
}

redis-cli -h localhost -p 6379 ping >/dev/null 2>&1 || {
    echo "❌ Redis连接失败"
    exit 1
}

echo "✅ 数据库连接验证通过"

# 启动后端服务
echo "🖥️ 启动后端服务..."
cd server
npm start &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/ci-backend.pid
cd ..

# 等待后端服务启动
echo "⏳ 等待后端服务..."
timeout 120 bash -c 'until curl -sf http://localhost:3000 >/dev/null 2>&1; do
    echo "等待后端响应..."
    sleep 2
done' || {
    echo "❌ 后端服务启动失败"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
}

echo "✅ 后端服务已启动"

# 启动前端服务
echo "🌐 启动前端服务..."
npm run dev &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/ci-frontend.pid

# 等待前端服务启动
echo "⏳ 等待前端服务..."
timeout 120 bash -c 'until curl -sf http://localhost:5173 >/dev/null 2>&1; do
    echo "等待前端响应..."
    sleep 2
done' || {
    echo "❌ 前端服务启动失败"
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
}

echo "✅ 前端服务已启动"

# 最终验证
echo "🔍 最终验证服务状态..."

# 检查后端
if curl -sf http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ 后端服务响应正常"
else
    echo "❌ 后端服务验证失败"
    exit 1
fi

# 检查前端
if curl -sf http://localhost:5173 >/dev/null 2>&1; then
    echo "✅ 前端服务响应正常"
else
    echo "❌ 前端服务验证失败"
    exit 1
fi

echo "🎉 CI环境启动完成！"
echo "📊 服务状态:"
echo "  - 后端服务: http://localhost:3000 (PID: $BACKEND_PID)"
echo "  - 前端服务: http://localhost:5173 (PID: $FRONTEND_PID)"
echo "  - MongoDB: localhost:27017"
echo "  - Redis: localhost:6379"
echo ""
echo "✅ 准备运行测试"
