#!/bin/bash

# 数据库初始化脚本
# 这个脚本将初始化MongoDB数据库，创建必要的集合和索引，并插入初始数据

echo "开始初始化数据库..."

# 确保环境变量已加载
source /var/www/sdszk-backend/.env

# 执行MongoDB初始化脚本
# 注意：这里假设您使用的是本地MongoDB并且有足够的权限
echo "执行mongo-init.js脚本..."
mongosh --quiet "${MONGODB_URI}" /var/www/sdszk-backend/scripts/mongo-init.js

# 执行数据迁移脚本
echo "执行数据迁移脚本..."
cd /var/www/sdszk-backend
node scripts/run-migration.js up

# 执行种子数据脚本
echo "插入示例新闻数据..."
cd /var/www/sdszk-backend
node scripts/seedNews.js

echo "数据库初始化完成!"
