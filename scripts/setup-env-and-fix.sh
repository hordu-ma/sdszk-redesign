#!/bin/bash

# 阿里云环境变量设置和服务修复脚本

ALIYUN_HOST="60.205.124.67"
ALIYUN_USER="root"
REMOTE_DIR="/var/www/sdszk-backend"

echo "=== 设置环境变量并完成修复 ==="
echo ""

echo "我们需要设置以下环境变量："
echo "1. MONGODB_URI - MongoDB连接字符串"
echo "2. JWT_SECRET - JWT密钥"
echo "3. FRONTEND_URL - 前端域名"
echo ""

# 提示用户输入环境变量
echo "请输入您的MongoDB连接字符串 (例如: mongodb+srv://username:password@cluster.mongodb.net/database):"
read -r MONGODB_URI

echo "请输入JWT密钥 (建议使用复杂的随机字符串):"
read -r JWT_SECRET

echo "前端URL (默认: https://hordu-ma.github.io):"
read -r FRONTEND_URL
FRONTEND_URL=${FRONTEND_URL:-"https://hordu-ma.github.io"}

echo ""
echo "设置的环境变量："
echo "MONGODB_URI: [已设置，长度：${#MONGODB_URI}]"
echo "JWT_SECRET: [已设置，长度：${#JWT_SECRET}]"
echo "FRONTEND_URL: $FRONTEND_URL"
echo ""

echo "是否确认设置这些环境变量？(y/n)"
read -r confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "操作已取消"
    exit 1
fi

echo "连接到服务器设置环境变量并重启服务..."

ssh $ALIYUN_USER@$ALIYUN_HOST << EOF
    echo "=== 设置环境变量 ==="
    
    # 设置环境变量
    export MONGODB_URI="$MONGODB_URI"
    export JWT_SECRET="$JWT_SECRET"
    export FRONTEND_URL="$FRONTEND_URL"
    export NODE_ENV="production"
    
    # 将环境变量写入系统配置
    echo 'export MONGODB_URI="$MONGODB_URI"' >> ~/.bashrc
    echo 'export JWT_SECRET="$JWT_SECRET"' >> ~/.bashrc
    echo 'export FRONTEND_URL="$FRONTEND_URL"' >> ~/.bashrc
    echo 'export NODE_ENV="production"' >> ~/.bashrc
    
    # 创建.env文件
    cd $REMOTE_DIR
    cat > .env << ENVEOF
MONGODB_URI=$MONGODB_URI
JWT_SECRET=$JWT_SECRET
FRONTEND_URL=$FRONTEND_URL
NODE_ENV=production
PORT=3000
ENVEOF
    
    echo "环境变量设置完成"
    
    echo "=== 重新启动服务 ==="
    pm2 restart sdszk-backend
    
    # 等待服务启动
    sleep 5
    
    echo "=== 测试MongoDB连接 ==="
    if command -v mongosh &> /dev/null; then
        mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')" --quiet && echo "✓ MongoDB连接成功" || echo "✗ MongoDB连接失败"
    else
        echo "未找到mongosh工具"
    fi
    
    echo "=== 测试健康检查API ==="
    curl -s http://localhost:3000/api/health | head -c 200
    echo ""
    
    echo "=== 服务状态 ==="
    pm2 status
    
    echo "=== 最近日志 ==="
    pm2 logs sdszk-backend --lines 10
EOF

echo ""
echo "=== 修复完成 ==="
echo "请测试以下URL："
echo "1. 健康检查: http://60.205.124.67:3000/api/health"
echo "2. API状态: http://60.205.124.67:3000/api/status"
echo "3. 前端应用: $FRONTEND_URL"
echo ""
echo "如果还有问题，运行以下命令查看日志："
echo "ssh $ALIYUN_USER@$ALIYUN_HOST 'pm2 logs sdszk-backend'"
