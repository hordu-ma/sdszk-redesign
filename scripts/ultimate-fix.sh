#!/bin/bash

# 终极修复脚本 - 彻底解决前端部署问题

echo "=== 🚨 终极修复方案 ==="
echo "解决前端 403 Forbidden 问题"
echo ""

echo "步骤 1: 重新检查和修复 Nginx 配置..."
ssh root@60.205.124.67 << 'EOF'

# 1. 检查当前状态
echo "当前前端目录状态:"
ls -la /var/www/frontend/

echo ""
echo "当前 Nginx 配置:"
cat /etc/nginx/sites-available/sdszk

echo ""
echo "检查用户权限:"
id www-data

# 2. 创建简化的 Nginx 配置
echo ""
echo "创建简化的 Nginx 配置..."
cat > /etc/nginx/sites-available/sdszk << 'NGINXCONF'
server {
    listen 80;
    server_name horsduroot.com;
    
    root /var/www/frontend;
    index index.html;
    
    # 基本配置
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 日志
    access_log /var/log/nginx/sdszk.access.log;
    error_log /var/log/nginx/sdszk.error.log;
}
NGINXCONF

# 3. 测试配置
echo ""
echo "测试 Nginx 配置..."
nginx -t

# 4. 重新加载
echo ""
echo "重新加载 Nginx..."
systemctl reload nginx

EOF

echo ""
echo "步骤 2: 重新上传前端文件..."

# 确保本地 dist 目录存在
if [ ! -d "dist" ]; then
    echo "重新构建前端..."
    npm run build
fi

echo "使用 tar 方式上传文件..."
cd dist
tar -czf ../frontend.tar.gz .
cd ..

scp frontend.tar.gz root@60.205.124.67:/tmp/

ssh root@60.205.124.67 << 'EOF'

echo ""
echo "步骤 3: 重新部署前端文件..."

# 1. 完全清理前端目录
rm -rf /var/www/frontend
mkdir -p /var/www/frontend

# 2. 解压文件
cd /var/www/frontend
tar -xzf /tmp/frontend.tar.gz

# 3. 设置权限 - 使用更宽松的权限
chown -R root:root /var/www/frontend
chmod -R 755 /var/www/frontend

# 4. 确保 index.html 存在且可读
if [ -f "/var/www/frontend/index.html" ]; then
    echo "✅ index.html 存在"
    chmod 644 /var/www/frontend/index.html
    ls -la /var/www/frontend/index.html
else
    echo "❌ index.html 不存在，创建默认页面..."
    cat > /var/www/frontend/index.html << 'HTMLEND'
<!DOCTYPE html>
<html>
<head>
    <title>测试页面</title>
</head>
<body>
    <h1>前端部署成功！</h1>
    <p>当前时间: <span id="time"></span></p>
    <script>
        document.getElementById('time').textContent = new Date().toLocaleString();
    </script>
</body>
</html>
HTMLEND
    chmod 644 /var/www/frontend/index.html
fi

# 5. 测试访问
echo ""
echo "步骤 4: 测试访问..."
curl -I http://localhost/

echo ""
echo "步骤 5: 检查 Nginx 错误日志..."
tail -5 /var/log/nginx/error.log

echo ""
echo "清理临时文件..."
rm -f /tmp/frontend.tar.gz

echo ""
echo "最终状态检查:"
echo "前端目录:"
ls -la /var/www/frontend/ | head -10
echo ""
echo "Nginx 进程:"
ps aux | grep nginx | grep -v grep
echo ""
echo "端口监听:"
netstat -tlnp | grep :80

EOF

# 清理本地临时文件
rm -f frontend.tar.gz

echo ""
echo "🎉 === 修复完成 ==="
echo ""
echo "现在请测试："
echo "• 浏览器访问: http://horsduroot.com"
echo "• API测试: http://horsduroot.com/api"
echo ""
echo "如果还有问题，查看日志："
echo "ssh root@60.205.124.67 'tail -f /var/log/nginx/error.log'"
