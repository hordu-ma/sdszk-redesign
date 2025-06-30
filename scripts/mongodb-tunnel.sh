#!/bin/bash

# MongoDB SSH隧道连接脚本
# 用于通过SSH隧道安全连接阿里云服务器上的MongoDB数据库

echo "🚀 正在建立MongoDB SSH隧道..."
echo "📋 服务器信息："
echo "   - 服务器IP: 60.205.124.67"
echo "   - 本地端口: 27018 (避免与本地MongoDB冲突)"
echo "   - 远程端口: 27017"
echo "   - 数据库: sdszk-db"
echo ""

echo "⚡ 建立隧道连接..."
echo "💡 连接成功后，请在MongoDB Compass中使用以下连接字符串："
echo "   mongodb://localhost:27018/sdszk-db"
echo ""
echo "⚠️  注意事项："
echo "   1. 保持此终端窗口开启，关闭将断开隧道连接"
echo "   2. 使用端口27018避免与本地MongoDB服务冲突"
echo "   3. 按 Ctrl+C 可断开连接"
echo ""
echo "🔗 正在连接..."

# 建立SSH隧道：本地27018端口 -> 阿里云27017端口
ssh -L 27018:127.0.0.1:27017 root@60.205.124.67 -N

echo ""
echo "✅ 隧道连接已断开"
