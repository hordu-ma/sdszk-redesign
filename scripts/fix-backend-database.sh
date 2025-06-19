#!/bin/bash

# 修复后端服务和数据库连接问题

SERVER_IP="60.205.124.67"
SSH_KEY="~/.ssh/id_rsa_aliyun"

echo "🔧 修复后端服务和数据库连接问题..."
echo "================================"

# 1. 检查并修复后端目录和环境配置
echo "1️⃣ 检查后端部署目录..."
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
echo "检查当前后端目录结构："
ls -la /var/www/sdszk-backend/ 2>/dev/null || echo "❌ /var/www/sdszk-backend/ 不存在"
ls -la /root/sdszk-redesign/server/ 2>/dev/null || echo "❌ /root/sdszk-redesign/server/ 不存在"

echo -e "\n检查当前工作目录："
pwd
whoami

echo -e "\n查找 app.js 文件位置："
find /var/www -name "app.js" -type f 2>/dev/null
find /root -name "app.js" -type f 2>/dev/null
EOF

# 2. 修复 MongoDB 连接和环境变量
echo -e "\n2️⃣ 修复 MongoDB 连接..."
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
echo "检查 MongoDB 服务状态："
systemctl status mongod --no-pager -l | head -10

echo -e "\n检查 MongoDB 是否运行："
pgrep -f mongod || echo "MongoDB 未运行"

echo -e "\n启动 MongoDB 服务："
systemctl start mongod
systemctl enable mongod

echo -e "\n等待 MongoDB 启动..."
sleep 5

echo -e "\n验证 MongoDB 连接："
mongo --eval "db.adminCommand('ismaster')" 2>/dev/null || echo "MongoDB 连接失败"

echo -e "\n检查 MongoDB 端口："
netstat -tlnp | grep 27017
EOF

# 3. 修复后端环境变量和重新启动
echo -e "\n3️⃣ 重新配置和启动后端服务..."
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
# 查找正确的后端目录
BACKEND_DIR=""
if [ -d "/var/www/sdszk-backend" ]; then
    BACKEND_DIR="/var/www/sdszk-backend"
elif [ -d "/root/sdszk-redesign/server" ]; then
    BACKEND_DIR="/root/sdszk-redesign/server"
fi

if [ -z "$BACKEND_DIR" ]; then
    echo "❌ 找不到后端目录，尝试创建..."
    mkdir -p /root/sdszk-redesign/server
    BACKEND_DIR="/root/sdszk-redesign/server"
    
    # 如果 /var/www/sdszk-backend 存在，复制内容
    if [ -d "/var/www/sdszk-backend" ]; then
        echo "复制后端文件到正确位置..."
        cp -r /var/www/sdszk-backend/* /root/sdszk-redesign/server/
    fi
fi

echo "使用后端目录: $BACKEND_DIR"
cd "$BACKEND_DIR"

# 创建正确的 .env 文件
echo "创建环境变量文件..."
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sdszk
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024
CORS_ORIGIN=https://horsduroot.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
ENVEOF

echo "环境变量文件内容："
cat .env

# 确保日志目录存在
mkdir -p logs

# 停止之前的进程
echo -e "\n清理之前的进程..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pkill -f "node.*app.js" 2>/dev/null || true
sleep 2

# 启动后端服务
echo -e "\n启动后端服务..."
pm2 start app.js --name "sdszk-backend" \
    --output "./logs/app.log" \
    --error "./logs/error.log" \
    --time \
    --max-memory-restart 200M

echo -e "\n等待服务启动..."
sleep 5

echo -e "\n检查服务状态："
pm2 status

echo -e "\n检查端口监听："
netstat -tlnp | grep :3000

echo -e "\n测试健康检查："
curl -s http://localhost:3000/api/health || echo "健康检查失败"
EOF

# 4. 测试数据库连接和创建测试数据
echo -e "\n4️⃣ 测试数据库连接和初始化..."
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
echo "测试 MongoDB 连接并创建测试数据："

# 创建测试用户和数据
mongo sdszk --eval "
try {
    // 创建一个测试新闻分类
    db.newscategories.insertOne({
        _id: 'core',
        name: '核心理论',
        description: '马克思主义核心理论',
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    // 创建一个测试资源分类
    db.resourcecategories.insertOne({
        _id: 'theory',
        name: '理论学习',
        description: '理论学习资源',
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    print('✅ 测试数据创建成功');
} catch(e) {
    print('❌ 测试数据创建失败: ' + e);
}
" 2>/dev/null || echo "MongoDB 操作失败"

# 检查数据库
mongo sdszk --eval "
print('数据库状态:');
print('新闻分类数量: ' + db.newscategories.count());
print('资源分类数量: ' + db.resourcecategories.count());
" 2>/dev/null || echo "数据库查询失败"
EOF

# 5. 最终验证
echo -e "\n5️⃣ 最终验证..."
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
echo "=== 最终验证结果 ==="

echo "1. 后端服务状态："
pm2 status | grep sdszk-backend

echo -e "\n2. 端口监听："
netstat -tlnp | grep :3000

echo -e "\n3. API 测试："
echo "健康检查："
curl -s http://localhost:3000/api/health | head -3

echo -e "\n新闻分类接口："
curl -s http://localhost:3000/api/news-categories/core | head -3

echo -e "\n资源接口："
curl -s "http://localhost:3000/api/resources?category=theory&limit=5" | head -3

echo -e "\n4. 通过 Nginx 代理测试："
echo "代理健康检查："
curl -s http://localhost/api/health | head -3

echo -e "\n5. 外部访问测试："
echo "外部健康检查："
curl -s https://horsduroot.com/api/health | head -3

echo -e "\n6. 检查最近的错误日志："
if [ -d "/var/www/sdszk-backend" ]; then
    cd /var/www/sdszk-backend
elif [ -d "/root/sdszk-redesign/server" ]; then
    cd /root/sdszk-redesign/server
fi

if [ -f "logs/error.log" ]; then
    echo "最近的错误日志 (5行)："
    tail -5 logs/error.log
else
    echo "未找到错误日志文件"
fi
EOF

echo -e "\n✅ 修复完成！"
echo "如果还有问题，请检查："
echo "- MongoDB 是否正确启动并监听 27017 端口"
echo "- 后端代码是否有语法错误"
echo "- 防火墙是否阻止了内部通信"
