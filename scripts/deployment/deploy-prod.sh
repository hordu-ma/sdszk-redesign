#!/bin/bash

# 部署脚本 - 用于生产环境部署
set -e

echo "🚀 开始部署山东省思政教育平台..."

# 检查必要的环境变量
if [ -z "$MONGO_PASSWORD" ] || [ -z "$REDIS_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
    echo "❌ 请设置必要的环境变量: MONGO_PASSWORD, REDIS_PASSWORD, JWT_SECRET"
    exit 1
fi

# 创建必要的目录
echo "📁 创建部署目录..."
mkdir -p logs ssl

# 停止现有服务
echo "⏹️  停止现有服务..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# 清理旧镜像
echo "🧹 清理旧镜像..."
docker system prune -f

# 构建新镜像
echo "🏗️  构建应用镜像..."
docker-compose -f docker-compose.prod.yml build --no-cache

# 启动服务
echo "🎯 启动生产服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 健康检查
echo "🏥 执行健康检查..."
for i in {1..10}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ 服务启动成功!"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ 服务启动失败，请检查日志"
        docker-compose -f docker-compose.prod.yml logs
        exit 1
    fi
    echo "等待服务启动... ($i/10)"
    sleep 10
done

# 显示服务状态
echo "📊 服务状态:"
docker-compose -f docker-compose.prod.yml ps

# 显示日志
echo "📝 最近日志:"
docker-compose -f docker-compose.prod.yml logs --tail=20

echo "🎉 部署完成!"
echo "📱 应用访问地址: http://localhost"
echo "📋 管理面板: http://localhost/admin"
echo "🔍 查看日志: docker-compose -f docker-compose.prod.yml logs -f"
