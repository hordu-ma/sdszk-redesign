#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# 显示带颜色的消息
echo_success() {
    echo -e "${GREEN}$1${NC}"
}

echo_error() {
    echo -e "${RED}$1${NC}"
}

# 确保脚本在错误时退出
set -e

# 构建前端项目
echo "开始构建前端项目..."
npm run build

# 创建部署目录
DEPLOY_DIR="dist"
if [ ! -d "$DEPLOY_DIR" ]; then
    echo_error "构建目录不存在！"
    exit 1
fi

# 读取部署配置
source .env.production

# 服务器信息 (需要在运行时提供)
SERVER_USER="root"
SERVER_IP="你的阿里云ECS IP"
DEPLOY_PATH="/www/wwwroot/sdszk"
DOMAIN="你的域名"

# 确保远程目录存在
ssh $SERVER_USER@$SERVER_IP "mkdir -p $DEPLOY_PATH"

# 部署前端文件
echo "开始部署前端文件..."
rsync -avz --delete $DEPLOY_DIR/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/

# 配置Nginx（如果需要）
echo "配置Nginx..."
cat > nginx.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    
    # HTTP 重定向到 HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;

    # SSL 配置
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS (uncomment if you're sure)
    # add_header Strict-Transport-Security "max-age=63072000" always;

    # 根目录配置
    root $DEPLOY_PATH;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 缓存配置
    location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
        expires max;
        add_header Cache-Control "public, no-transform";
    }

    # Vue Router 历史模式支持
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API 代理配置
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # 安全头设置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# 复制Nginx配置
scp nginx.conf $SERVER_USER@$SERVER_IP:/etc/nginx/conf.d/$DOMAIN.conf

# 重启Nginx
ssh $SERVER_USER@$SERVER_IP "nginx -t && systemctl restart nginx"

echo_success "部署完成！"
echo_success "请访问 https://$DOMAIN 查看网站."
