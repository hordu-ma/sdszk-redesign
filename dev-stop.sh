#!/bin/bash

echo "🛑 停止山东省思政课一体化中心开发环境..."

# 停止前端开发服务器 (通常在 5173 端口)
echo "🌐 停止前端开发服务器..."
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "✅ 前端服务器已停止" || echo "ℹ️  前端服务器未运行"

# 停止后端服务器 (通常在 3000 端口)
echo "🖥️  停止后端服务器..."
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✅ 后端服务器已停止" || echo "ℹ️  后端服务器未运行"

# 询问是否停止 Redis
echo ""
if pgrep -f redis-server > /dev/null; then
    read -p "❓ 检测到 Redis 正在运行，是否停止? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -f redis-server
        echo "✅ Redis 服务器已停止"
    else
        echo "📊 Redis 服务器保持运行状态"
    fi
else
    echo "ℹ️  Redis 服务器未运行"
fi

echo "🎉 开发环境停止完成！"
