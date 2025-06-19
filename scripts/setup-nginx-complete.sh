#!/bin/bash

# Nginx完整配置脚本 - 配置前端静态文件 + API代理

ALIYUN_HOST="60.205.124.67"
ALIYUN_USER="root"

echo "=== 配置Nginx完整代理方案 ==="

ssh $ALIYUN_USER@$ALIYUN_HOST << 'EOF'

echo "1. 备份当前Nginx配置..."
cp /etc/nginx/sites-available/sdszk /etc/nginx/sites-available/sdszk.backup.$(date +%Y%m%d_%H%M%S)

echo "2. 创建完整的Nginx配置..."
cat > /etc/nginx/sites-available/sdszk << 'NGINXEOF'
server {
    listen 80;
    server_name horsduroot.com www.horsduroot.com;
    
    # 前端静态文件根目录
    root /var/www/frontend;
    index index.html;
    
    # 启用gzip压缩
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_comp_level 6;
    
    # 前端路由 - SPA应用
    location / {
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
    
    # API代理到后端服务
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS 头部
        add_header Access-Control-Allow-Origin "https://horsduroot.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        # 处理预检请求
        if ($request_method = OPTIONS) {
            return 204;
        }
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 上传文件代理
    location /uploads/ {
        proxy_pass http://localhost:3000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:3000/api/health;
        proxy_set_header Host $host;
    }
    
    # 安全配置
    location ~ /\. {
        deny all;
    }
    
    # 日志配置
    access_log /var/log/nginx/sdszk.access.log;
    error_log /var/log/nginx/sdszk.error.log;
}

# 重定向www到非www
server {
    listen 80;
    server_name www.horsduroot.com;
    return 301 https://horsduroot.com$request_uri;
}

# API子域名重定向（兼容旧配置）
server {
    listen 80;
    server_name api.horsduroot.com;
    return 301 https://horsduroot.com/api$request_uri;
}
NGINXEOF

echo "3. 创建前端文件目录..."
mkdir -p /var/www/frontend
chown -R www-data:www-data /var/www/frontend

echo "4. 检查Nginx配置语法..."
nginx -t

echo "5. 重新加载Nginx配置..."
systemctl reload nginx

echo "6. 检查Nginx状态..."
systemctl status nginx --no-pager -l

echo "7. 显示当前配置..."
echo "前端目录: /var/www/frontend"
echo "后端API: localhost:3000"
echo "域名: horsduroot.com"
echo "API路径: horsduroot.com/api"

EOF

echo ""
echo "=== Nginx配置完成 ==="
echo "接下来需要："
echo "1. 构建前端项目"
echo "2. 上传前端文件到 /var/www/frontend"
echo "3. 测试完整功能"
