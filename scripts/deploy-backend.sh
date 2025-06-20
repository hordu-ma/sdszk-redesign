#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 显示部署信息
echo_warning "准备部署后端到阿里云..."

# 检查必要的配置
if [ ! -f "./server/.env.production" ]; then
    echo_error "未找到生产环境配置文件 ./server/.env.production"
    exit 1
fi

# 创建构建目录
BUILD_DIR="./server-dist"
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# 复制必要的文件到构建目录
echo_warning "正在准备后端文件..."
cp -r ./server/* $BUILD_DIR/
cp ./server/.env.production $BUILD_DIR/.env

# 进入构建目录安装依赖
echo_warning "正在安装生产环境依赖..."
cd $BUILD_DIR
npm install --production

# 创建必要的目录
mkdir -p uploads/documents uploads/images uploads/videos logs

# 打包项目
echo_warning "正在打包项目..."
zip -r ../server-deploy.zip . -x "node_modules/.cache/*"

# 返回项目根目录
cd ..

echo_success "后端打包完成: server-deploy.zip"

# 服务器配置
SERVER_USER="root"
SERVER_IP="60.205.124.67"
DEPLOY_PATH="/var/www/sdszk-backend"

echo_warning "开始自动部署到服务器..."

# 上传文件到服务器
echo_warning "正在上传文件到服务器..."
scp server-deploy.zip $SERVER_USER@$SERVER_IP:/tmp/

# 在服务器上执行部署
echo_warning "正在服务器上部署..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
    # 停止现有服务
    pm2 stop sdszk-backend || true
    
    # 备份现有代码
    if [ -d "/var/www/sdszk-backend" ]; then
        mv /var/www/sdszk-backend /var/www/sdszk-backend-backup-$(date +%Y%m%d_%H%M%S)
    fi
    
    # 创建部署目录
    mkdir -p /var/www/sdszk-backend
    
    # 解压新代码
    cd /var/www/sdszk-backend
    unzip -o /tmp/server-deploy.zip
    
    # 安装依赖
    npm install --production
    
    # 创建必要目录
    mkdir -p uploads/documents uploads/images uploads/videos logs
    
    # 设置权限
    chmod -R 755 uploads logs
    
    # 重启服务
    pm2 restart sdszk-backend || pm2 start app.js --name sdszk-backend
    
    # 清理临时文件
    rm /tmp/server-deploy.zip
EOF

echo_success "后端部署完成!"
echo_warning "正在检查服务状态..."

# 检查服务状态
ssh $SERVER_USER@$SERVER_IP "pm2 status"

echo_success "部署成功! 服务已重启"
