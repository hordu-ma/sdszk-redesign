#!/bin/bash

# 修正后端CORS配置以适配Nginx代理

ALIYUN_HOST="60.205.124.67"
ALIYUN_USER="root"

echo "=== 修正后端CORS配置 ==="

ssh $ALIYUN_USER@$ALIYUN_HOST << 'EOF'
cd /var/www/sdszk-backend

echo "1. 备份当前app.js..."
cp server/app.js server/app.js.backup.cors.$(date +%Y%m%d_%H%M%S)

echo "2. 创建CORS修复脚本..."
cat > fix_cors.js << 'CORSEOF'
import fs from 'fs';

let appContent = fs.readFileSync('server/app.js', 'utf8');

// 更新CORS配置
const corsPattern = /app\.use\(\s*cors\(\{[\s\S]*?\}\)\s*\);/;

const newCorsConfig = `app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5180",
        "http://localhost:5182", 
        "http://localhost:5179",
        "http://localhost:5178",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://horsduroot.com", // 主域名
        "http://horsduroot.com",  // HTTP版本
        "https://www.horsduroot.com", // www子域名
        "http://www.horsduroot.com",
        "https://hordu-ma.github.io", // GitHub Pages备用
        process.env.FRONTEND_URL,
        undefined, // 允许无origin的请求（如curl、本地测试）
      ].filter(Boolean);
      
      console.log('CORS检查 - Origin:', origin, 'Allowed:', allowedOrigins.includes(origin));
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('CORS拒绝 - Origin:', origin);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization", 
      "Cookie",
      "X-Requested-With",
      "Accept",
      "Origin"
    ],
    exposedHeaders: ["set-cookie", "Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 3600,
  })
);`;

if (corsPattern.test(appContent)) {
  appContent = appContent.replace(corsPattern, newCorsConfig);
  fs.writeFileSync('server/app.js', appContent);
  console.log('✅ CORS配置已更新');
} else {
  console.log('❌ 未找到CORS配置模式');
}
CORSEOF

echo "3. 执行CORS修复..."
node fix_cors.js

echo "4. 检查修复结果..."
grep -A 10 -B 2 "horsduroot.com" server/app.js

echo "5. 重启后端服务..."
pm2 restart sdszk-backend

echo "6. 等待服务启动..."
sleep 5

echo "7. 测试后端服务..."
curl -s http://localhost:3000/ | head -c 100

echo "8. 检查PM2状态..."
pm2 status
EOF

echo ""
echo "=== 后端CORS配置完成 ==="
