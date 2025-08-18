#!/bin/bash

echo "🚀 启动山东省思政课一体化中心开发环境..."

# 检查 Redis 是否已在运行
echo "📊 检查 Redis 服务状态..."
if pgrep -f redis-server > /dev/null; then
    echo "✅ Redis 已在运行"
else
    echo "🔄 启动 Redis 服务器..."
    redis-server --daemonize yes
    sleep 2
    
    # 验证 Redis 是否成功启动
    if pgrep -f redis-server > /dev/null; then
        echo "✅ Redis 启动成功"
    else
        echo "❌ Redis 启动失败"
        exit 1
    fi
fi

# 验证 Redis 连接
echo "🔍 验证 Redis 连接..."
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis 连接正常"
else
    echo "❌ Redis 连接失败，请检查服务状态"
    exit 1
fi

# 启动后端服务器
echo "🖥️  启动后端服务器..."
cd server
npm run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端开发服务器
echo "🌐 启动前端开发服务器..."
cd ..
npm run dev &
FRONTEND_PID=$!

echo "🎉 开发环境启动完成！"
echo "📝 后端服务器 PID: $BACKEND_PID"
echo "📝 前端服务器 PID: $FRONTEND_PID"
echo ""
echo "🌍 前台访问: http://localhost:5173"
echo "🔧 管理后台: http://localhost:5173/admin"
echo "📡 API 服务: http://localhost:3000"
echo ""
echo "💡 提示: Redis 以临时模式运行，会话结束后自动停止"
echo "按 Ctrl+C 停止前后端服务"

# 捕获中断信号，清理进程
cleanup() {
    echo ""
    echo "🔄 正在停止服务..."
    
    # 停止前后端进程
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "🖥️  后端服务器已停止"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "🌐 前端服务器已停止"
    fi
    
    # 询问是否停止 Redis
    echo ""
    read -p "❓ 是否停止 Redis 服务器? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -f redis-server
        echo "📊 Redis 服务器已停止"
    else
        echo "📊 Redis 服务器保持运行状态"
    fi
    
    echo "✅ 开发环境清理完成"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 等待用户中断
wait
