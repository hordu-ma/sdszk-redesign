#!/bin/bash

# 开发环境启动脚本
# 使用方法: ./scripts/dev-start.sh [local|docker]

MODE=${1:-local}

echo "🚀 启动开发环境..."

case $MODE in
  "local")
    echo "📦 使用本地MongoDB..."
    # 检查MongoDB是否已启动
    if ! pgrep -x "mongod" > /dev/null; then
      echo "启动本地MongoDB服务..."
      brew services start mongodb/brew/mongodb-community
      sleep 2
    else
      echo "MongoDB已在运行"
    fi
    ;;
  "docker")
    echo "🐳 使用Docker MongoDB..."
    docker-compose -f docker-compose.dev.yml up -d
    sleep 3
    ;;
  *)
    echo "❌ 无效参数。使用: $0 [local|docker]"
    exit 1
    ;;
esac

# 检查MongoDB连接
echo "🔍 检查MongoDB连接..."
if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
  echo "✅ MongoDB连接成功！"
else
  echo "❌ MongoDB连接失败"
  exit 1
fi

echo "🎯 启动后端服务器..."
cd server && npm run start &
BACKEND_PID=$!

echo "🎨 启动前端开发服务器..."
cd .. && npm run dev &
FRONTEND_PID=$!

echo "📋 开发服务器已启动:"
echo "  - 后端: http://localhost:3000"
echo "  - 前端: http://localhost:5173"
echo "  - MongoDB: mongodb://localhost:27017/sdszk"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo '🛑 停止所有服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
