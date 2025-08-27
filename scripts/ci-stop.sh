#!/bin/bash

echo "🛑 停止CI环境服务..."

# 设置错误处理 - 但允许继续执行清理
set +e

# 停止函数
stop_service() {
    local service_name=$1
    local port=$2
    local pid_file=$3

    echo "🔄 停止 $service_name..."

    # 方法1: 通过PID文件停止
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
            sleep 2
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null
            fi
            echo "✅ $service_name (PID: $pid) 已停止"
        fi
        rm -f "$pid_file"
    fi

    # 方法2: 通过端口停止
    if [ ! -z "$port" ]; then
        local pids=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$pids" ]; then
            echo "$pids" | xargs kill -9 2>/dev/null
            echo "✅ 端口 $port 上的进程已停止"
        fi
    fi
}

# 停止前端服务器 (端口 5173)
stop_service "前端开发服务器" "5173" "/tmp/ci-frontend.pid"

# 停止后端服务器 (端口 3000)
stop_service "后端API服务器" "3000" "/tmp/ci-backend.pid"

# 停止所有相关的Node.js进程
echo "🔄 清理Node.js进程..."
pkill -f "vite" 2>/dev/null && echo "✅ Vite进程已停止"
pkill -f "node.*app.js" 2>/dev/null && echo "✅ 后端应用进程已停止"
pkill -f "nodemon" 2>/dev/null && echo "✅ Nodemon进程已停止"

# 等待进程完全停止
sleep 2

# 检查端口是否已释放
check_port() {
    local port=$1
    local service_name=$2

    if lsof -ti:$port >/dev/null 2>&1; then
        echo "⚠️  警告: $service_name (端口 $port) 可能仍在运行"
        return 1
    else
        echo "✅ $service_name (端口 $port) 已完全停止"
        return 0
    fi
}

echo "🔍 验证服务停止状态..."
check_port 5173 "前端服务"
check_port 3000 "后端服务"

# 清理临时文件
echo "🧹 清理临时文件..."
rm -f /tmp/ci-*.pid
rm -f .env 2>/dev/null
rm -f server/.env 2>/dev/null

# 清理日志文件（如果有）
rm -f *.log 2>/dev/null
rm -f server/*.log 2>/dev/null

# 清理测试数据库（可选）
if [ "$CLEANUP_TEST_DB" = "true" ]; then
    echo "🗑️  清理测试数据库..."
    mongosh --host localhost:27017 --eval "
        try {
            db = db.getSiblingDB('sdszk_test');
            db.dropDatabase();
            print('测试数据库已清理');
        } catch(e) {
            print('数据库清理失败: ' + e);
        }
    " 2>/dev/null || echo "ℹ️  跳过数据库清理"
fi

# 清理Redis测试数据（可选）
if [ "$CLEANUP_TEST_REDIS" = "true" ]; then
    echo "🗑️  清理Redis测试数据..."
    redis-cli -h localhost -p 6379 -n 1 FLUSHDB 2>/dev/null && echo "✅ Redis测试数据已清理" || echo "ℹ️  跳过Redis清理"
fi

echo "🎉 CI环境清理完成！"

# 最终状态检查
echo "📊 最终状态检查:"
echo "   - 前端服务 (5173): $(lsof -ti:5173 >/dev/null 2>&1 && echo '❌ 仍在运行' || echo '✅ 已停止')"
echo "   - 后端服务 (3000): $(lsof -ti:3000 >/dev/null 2>&1 && echo '❌ 仍在运行' || echo '✅ 已停止')"

exit 0
