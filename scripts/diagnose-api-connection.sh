#!/bin/bash

# API 连接问题诊断和修复脚本
# 解决 net::ERR_CONNECTION_REFUSED 问题

SERVER_IP="60.205.124.67"
SSH_KEY="~/.ssh/id_rsa_aliyun"

echo "🔍 开始诊断 API 连接问题..."
echo "================================"

# 1. 检查后端服务状态
echo "1️⃣ 检查后端 PM2 服务状态..."
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
echo "PM2 进程列表："
pm2 list

echo -e "\nPM2 详细状态："
pm2 status

echo -e "\n检查端口监听情况："
netstat -tlnp | grep :3000

echo -e "\n检查进程占用端口："
lsof -i :3000

echo -e "\n检查 Node.js 进程："
ps aux | grep node

echo -e "\n检查系统内存使用："
free -h

echo -e "\n检查磁盘空间："
df -h
EOF

# 2. 检查后端日志
echo -e "\n2️⃣ 检查后端错误日志..."
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
echo "PM2 应用日志 (最近50行)："
pm2 logs --lines 50

echo -e "\n检查应用错误日志："
if [ -f "/root/sdszk-redesign/server/logs/error.log" ]; then
    echo "应用错误日志 (最近20行)："
    tail -20 /root/sdszk-redesign/server/logs/error.log
else
    echo "未找到应用错误日志文件"
fi

echo -e "\n检查系统日志中的 Node.js 相关错误："
journalctl -u pm2-root --since "1 hour ago" --no-pager -n 20
EOF

# 3. 测试本地 API 连接
echo -e "\n3️⃣ 测试服务器本地 API 连接..."
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
echo "测试本地端口 3000 连接："
curl -v http://localhost:3000/api/health 2>&1 | head -20

echo -e "\n测试 health 接口："
curl -s http://localhost:3000/api/health || echo "health 接口无响应"

echo -e "\n测试 news-categories 接口："
curl -s http://localhost:3000/api/news-categories/core || echo "news-categories 接口无响应"
EOF

# 4. 检查 Nginx 配置和日志
echo -e "\n4️⃣ 检查 Nginx 配置和错误日志..."
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
echo "检查 Nginx 配置语法："
nginx -t

echo -e "\n当前 Nginx 站点配置："
cat /etc/nginx/sites-available/sdszk | grep -A 10 -B 5 "location /api"

echo -e "\nNginx 错误日志 (最近20行)："
tail -20 /var/log/nginx/error.log

echo -e "\nNginx 访问日志中的 API 请求 (最近10行)："
tail -20 /var/log/nginx/access.log | grep "/api"

echo -e "\n检查 Nginx 进程状态："
systemctl status nginx --no-pager -l
EOF

# 5. 重启后端服务
echo -e "\n5️⃣ 尝试重启后端服务..."
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
echo "停止当前 PM2 进程..."
pm2 stop all
pm2 delete all

echo "清理端口占用..."
pkill -f "node.*app.js" || true
sleep 2

echo "切换到后端目录..."
cd /root/sdszk-redesign/server

echo "检查环境变量文件..."
if [ -f ".env" ]; then
    echo ".env 文件存在"
    grep -E "PORT|MONGODB_URI|JWT_SECRET" .env | head -5
else
    echo "创建 .env 文件..."
    cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sdszk
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CORS_ORIGIN=https://horsduroot.com
ENVEOF
fi

echo "启动后端服务..."
pm2 start app.js --name "sdszk-backend" --log-file "/root/sdszk-redesign/server/logs/app.log" --error-file "/root/sdszk-redesign/server/logs/error.log"

echo "等待服务启动..."
sleep 5

echo "检查服务状态..."
pm2 status

echo "测试服务是否正常："
curl -s http://localhost:3000/api/health || echo "服务启动失败"
EOF

# 6. 验证修复效果
echo -e "\n6️⃣ 验证修复效果..."
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
echo "最终验证："
echo "1. 端口监听状态："
netstat -tlnp | grep :3000

echo -e "\n2. PM2 状态："
pm2 list

echo -e "\n3. API 接口测试："
curl -s http://localhost:3000/api/health
echo

echo -e "\n4. 通过 Nginx 代理测试："
curl -s http://localhost/api/health
echo

echo -e "\n5. 外部访问测试："
curl -s https://horsduroot.com/api/health
echo
EOF

echo -e "\n✅ 诊断完成！"
echo "如果问题仍然存在，请检查："
echo "- MongoDB 服务是否正常运行"
echo "- 防火墙设置"
echo "- 应用代码中是否有启动错误"
