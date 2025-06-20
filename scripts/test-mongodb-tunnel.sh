#!/bin/bash

# MongoDB隧道连接测试脚本
echo "🔍 MongoDB SSH隧道连接测试"
echo "=========================="

# 检查SSH连接
echo "1. 测试SSH连接..."
if ssh -o ConnectTimeout=5 root@60.205.124.67 "echo '✅ SSH连接正常'" 2>/dev/null; then
    echo "   ✅ SSH连接成功"
else
    echo "   ❌ SSH连接失败"
    exit 1
fi

# 检查远程MongoDB状态
echo "2. 检查远程MongoDB状态..."
if ssh root@60.205.124.67 "docker ps | grep mongo" >/dev/null 2>&1; then
    echo "   ✅ MongoDB容器运行正常"
else
    echo "   ❌ MongoDB容器未运行"
    exit 1
fi

# 测试隧道建立
echo "3. 测试SSH隧道建立..."
ssh -L 27018:localhost:27017 root@60.205.124.67 -N &
TUNNEL_PID=$!
sleep 3

if lsof -i :27018 >/dev/null 2>&1; then
    echo "   ✅ SSH隧道建立成功 (端口27018)"
    
    # 测试MongoDB连接（如果本地有mongosh）
    echo "4. 测试数据库连接..."
    if command -v mongosh >/dev/null 2>&1; then
        if timeout 5 mongosh mongodb://localhost:27018/sdszk --eval "db.stats()" --quiet >/dev/null 2>&1; then
            echo "   ✅ MongoDB连接测试成功"
        else
            echo "   ⚠️ MongoDB连接测试超时（隧道正常，可能是认证问题）"
        fi
    else
        echo "   ℹ️ 本地未安装mongosh，跳过数据库连接测试"
    fi
    
    # 清理
    kill $TUNNEL_PID 2>/dev/null
    echo ""
    echo "✅ 测试完成！您可以使用以下连接信息："
    echo "   MongoDB Compass: mongodb://localhost:27018/sdszk"
    echo "   启动隧道命令: ./scripts/mongodb-tunnel.sh"
else
    echo "   ❌ SSH隧道建立失败"
    kill $TUNNEL_PID 2>/dev/null
    exit 1
fi
