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
zip -r ../server-deploy.zip ./*

# 返回项目根目录
cd ..

echo_success "后端打包完成: server-deploy.zip"
echo_warning "接下来请按照以下步骤操作:"
echo "1. 上传 server-deploy.zip 到阿里云服务器"
echo "2. 在阿里云服务器上解压: unzip server-deploy.zip -d /var/www/sdszk-backend"
echo "3. 安装Node.js环境(如未安装): apt-get install nodejs npm"
echo "4. 启动服务: cd /var/www/sdszk-backend && npm start"
echo ""
echo_warning "重要: 确保在阿里云上设置了以下环境变量:"
echo "- MONGODB_URI: MongoDB数据库连接字符串"
echo "- JWT_SECRET: JWT密钥"
echo "- FRONTEND_URL: 前端URL(GitHub Pages地址)"
