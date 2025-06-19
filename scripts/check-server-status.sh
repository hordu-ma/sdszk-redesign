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

# 服务器信息
read -p "请输入服务器用户名 [root]: " SERVER_USER
SERVER_USER=${SERVER_USER:-root}

read -p "请输入服务器IP: " SERVER_IP
while [ -z "$SERVER_IP" ]; do
    echo_error "服务器IP不能为空!"
    read -p "请输入服务器IP: " SERVER_IP
done

echo_success "====== 检查服务状态 ======"

# 检查Nginx状态
echo_success "\n[Nginx状态]"
ssh $SERVER_USER@$SERVER_IP "sudo systemctl status nginx | grep Active"

# 检查MongoDB状态
echo_success "\n[MongoDB状态]"
ssh $SERVER_USER@$SERVER_IP "sudo systemctl status mongod | grep Active"

# 检查后端服务状态
echo_success "\n[后端服务状态]"
ssh $SERVER_USER@$SERVER_IP "cd /var/www/sdszk-backend && pm2 status"

# 检查前端文件
echo_success "\n[前端文件]"
ssh $SERVER_USER@$SERVER_IP "ls -la /var/www/sdszk-frontend"

# 检查Nginx配置
echo_success "\n[Nginx配置]"
ssh $SERVER_USER@$SERVER_IP "cat /etc/nginx/sites-available/sdszk"

# 检查数据库状态
echo_success "\n[MongoDB数据状态]"
ssh $SERVER_USER@$SERVER_IP "mongosh --quiet --eval 'db.getCollectionNames()' mongodb://localhost:27017/sdszk"

# 测试API
echo_success "\n[API测试]"
ssh $SERVER_USER@$SERVER_IP "curl -s http://localhost:3000/api/news-categories | head -20"

echo_success "\n====== 检查完成 ======"
