#!/bin/bash

# 最终修复脚本 - 解决所有问题

ALIYUN_HOST="60.205.124.67"
ALIYUN_USER="root"
REMOTE_DIR="/var/www/sdszk-backend"

echo "=== 最终修复方案 ==="
echo "目标: 解决health路由404问题和500错误"
echo ""

ssh $ALIYUN_USER@$ALIYUN_HOST << 'EOF'
cd /var/www/sdszk-backend

echo "=== 1. 备份当前文件 ==="
cp server/app.js server/app.js.backup.final
cp server/routes/health.js server/routes/health.js.backup.final

echo "=== 2. 检查问题 ==="
echo "当前app.js中的路由配置："
grep -n "app.use\|app.get" server/app.js | head -10

echo ""
echo "=== 3. 重写app.js路由部分 ==="
# 创建临时的路由修复脚本
cat > fix_routes.js << 'FIXEOF'
const fs = require('fs');

// 读取app.js文件
let appContent = fs.readFileSync('server/app.js', 'utf8');

// 删除所有现有的health路由相关内容
appContent = appContent.replace(/import healthRoutes.*\n/g, '');
appContent = appContent.replace(/app\.use\("\/api", healthRoutes\);?\n?/g, '');

// 在主路由之前添加健康检查路由
const healthRouteCode = `
// 健康检查路由
app.get("/api/health", async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      database: {
        status: dbStates[dbStatus],
        connected: dbStatus === 1
      },
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB'
      },
      environment: process.env.NODE_ENV || 'development'
    };

    if (dbStatus !== 1) {
      return res.status(503).json({
        ...healthData,
        status: 'error',
        message: 'Database not connected'
      });
    }

    res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

app.get("/api/status", async (req, res) => {
  try {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      api: {
        name: 'SDSZK API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime()
      }
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Status check failed',
      timestamp: new Date().toISOString()
    });
  }
});

`;

// 找到主路由定义的位置并插入健康检查路由
const mainRoutePattern = /app\.get\("\/", \(req, res\)/;
appContent = appContent.replace(mainRoutePattern, healthRouteCode + '\napp.get("/", (req, res)');

// 写回文件
fs.writeFileSync('server/app.js', appContent);
console.log('app.js已更新');
FIXEOF

echo "运行路由修复脚本..."
node fix_routes.js

echo ""
echo "=== 4. 检查修复结果 ==="
echo "查找健康检查路由："
grep -A 5 -B 2 "api/health" server/app.js

echo ""
echo "=== 5. 重启服务 ==="
pm2 restart sdszk-backend

echo "等待服务启动..."
sleep 10

echo ""
echo "=== 6. 测试修复结果 ==="
echo "测试健康检查:"
curl -s http://localhost:3000/api/health

echo ""
echo ""
echo "测试状态检查:"
curl -s http://localhost:3000/api/status

echo ""
echo ""
echo "测试主页:"
curl -s http://localhost:3000/

echo ""
echo ""
echo "=== 7. 最终服务状态 ==="
pm2 status

echo ""
echo "端口监听状态:"
netstat -tlnp | grep :3000

echo ""
echo "=== 修复完成! ==="
EOF

echo ""
echo "=== 验证外部访问 ==="
echo "测试外部健康检查:"
curl -s http://60.205.124.67:3000/api/health || echo "外部访问失败"

echo ""
echo "修复脚本执行完成!"
echo ""
echo "请在浏览器中测试:"
echo "1. http://60.205.124.67:3000/api/health"
echo "2. http://60.205.124.67:3000/api/status" 
echo "3. 前端应用: https://horsduroot.com"
