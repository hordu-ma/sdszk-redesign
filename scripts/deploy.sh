#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 显示带颜色的消息
echo_success() {
    echo -e "${GREEN}$1${NC}"
}

echo_error() {
    echo -e "${RED}$1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}$1${NC}"
}

# 确保脚本在错误时退出
set -e

# 构建前端项目
echo_success "开始构建前端项目..."
npm run build:aliyun  # 使用阿里云环境配置

# 创建部署目录
DEPLOY_DIR="dist"
if [ ! -d "$DEPLOY_DIR" ]; then
    echo_error "构建目录不存在！"
    exit 1
fi

# 服务器信息 (需要在运行时提供)
read -p "请输入服务器用户名 [root]: " SERVER_USER
SERVER_USER=${SERVER_USER:-root}

read -p "请输入服务器IP: " SERVER_IP
while [ -z "$SERVER_IP" ]; do
    echo_error "服务器IP不能为空!"
    read -p "请输入服务器IP: " SERVER_IP
done

DEPLOY_PATH="/var/www/sdszk-frontend"

# 确保远程目录存在
echo_success "确保远程目录存在..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $DEPLOY_PATH"

# 部署前端文件
echo_success "开始部署前端文件..."
rsync -avz --delete $DEPLOY_DIR/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/

# 配置Nginx
echo_success "配置Nginx..."
cat > nginx.conf << EOF
server {
    listen 80;
    server_name _;
    
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

    # API 代理配置 - 避免/api/api重复问题
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 上传Nginx配置
echo_success "上传Nginx配置..."
scp nginx.conf $SERVER_USER@$SERVER_IP:/tmp/sdszk.conf
ssh $SERVER_USER@$SERVER_IP "sudo mv /tmp/sdszk.conf /etc/nginx/sites-available/sdszk && sudo ln -sf /etc/nginx/sites-available/sdszk /etc/nginx/sites-enabled/sdszk"

# 重启Nginx
echo_success "重启Nginx..."
ssh $SERVER_USER@$SERVER_IP "sudo systemctl restart nginx"

# 清理Nginx配置文件
rm nginx.conf

# 初始化数据库
echo_warning "是否需要初始化数据库? [y/N]"
read INIT_DB
if [[ "$INIT_DB" =~ ^[Yy]$ ]]; then
    echo_success "开始初始化数据库..."
    scp scripts/init-mongo-db.sh $SERVER_USER@$SERVER_IP:/tmp/init-mongo-db.sh
    ssh $SERVER_USER@$SERVER_IP "chmod +x /tmp/init-mongo-db.sh && cd /var/www/sdszk-backend && sudo /tmp/init-mongo-db.sh"
fi

echo_success "部署完成!"
