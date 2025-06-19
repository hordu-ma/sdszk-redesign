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

echo_success "开始初始化数据库..."

# 确保环境变量已加载
if [ -f "/var/www/sdszk-backend/.env" ]; then
    source /var/www/sdszk-backend/.env
else
    echo_error "找不到.env文件，将使用默认MongoDB连接"
    export MONGODB_URI="mongodb://localhost:27017/sdszk"
fi

# 确认MongoDB状态
echo_success "检查MongoDB服务状态..."
if ! systemctl is-active --quiet mongod; then
    echo_error "MongoDB服务未运行，尝试启动..."
    sudo systemctl start mongod
    sleep 2
    
    if ! systemctl is-active --quiet mongod; then
        echo_error "无法启动MongoDB服务，请检查MongoDB安装"
        exit 1
    fi
fi

# 确认MongoDB连接
echo_success "测试MongoDB连接..."
if ! mongosh --quiet --eval "db.serverStatus()" $MONGODB_URI > /dev/null; then
    echo_error "MongoDB连接失败，请检查连接字符串和凭据"
    exit 1
fi

# 执行MongoDB初始化脚本
echo_success "执行mongo-init.js脚本..."
cd /var/www/sdszk-backend
mongosh --quiet $MONGODB_URI scripts/mongo-init.js

# 执行数据迁移脚本
echo_success "执行数据迁移脚本..."
cd /var/www/sdszk-backend
node scripts/run-migration.js up

# 执行种子数据脚本
echo_success "插入示例新闻数据..."
cd /var/www/sdszk-backend
node scripts/seedNews.js

echo_success "数据库初始化完成!"

# 验证数据
echo_success "验证数据库中的数据..."
COLLECTIONS=$(mongosh --quiet --eval "db.getCollectionNames()" $MONGODB_URI)
echo "已创建的集合: $COLLECTIONS"

NEWS_COUNT=$(mongosh --quiet --eval "db.news.countDocuments()" $MONGODB_URI)
echo "新闻数量: $NEWS_COUNT"

CATEGORIES_COUNT=$(mongosh --quiet --eval "db.newscategories.countDocuments()" $MONGODB_URI)
echo "新闻分类数量: $CATEGORIES_COUNT"

RESOURCE_CATEGORIES_COUNT=$(mongosh --quiet --eval "db.resourcecategories.countDocuments()" $MONGODB_URI)
echo "资源分类数量: $RESOURCE_CATEGORIES_COUNT"

USERS_COUNT=$(mongosh --quiet --eval "db.users.countDocuments()" $MONGODB_URI)
echo "用户数量: $USERS_COUNT"
