#!/bin/bash

# 开发环境设置脚本
# 用于配置正确的开发环境变量，确保连接到 sdszk 数据库

set -e

# 颜色输出函数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_header() {
    echo -e "\n${BLUE}=====================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=====================================${NC}\n"
}

echo_header "设置开发环境配置"

# 检查是否在正确的目录
if [ ! -f "package.json" ] || [ ! -d "server" ]; then
    echo_error "请在项目根目录运行此脚本"
    exit 1
fi

echo_info "📁 当前目录: $(pwd)"

# 备份现有的 .env 文件（如果存在）
if [ -f "server/.env" ]; then
    echo_warning "发现现有的 .env 文件"
    echo_info "📋 当前 .env 文件内容预览:"
    echo "----------------------------------------"
    head -10 server/.env 2>/dev/null | sed 's/.*PASSWORD.*/***HIDDEN***/g; s/.*SECRET.*/***HIDDEN***/g; s/.*TOKEN.*/***HIDDEN***/g' || echo "无法读取文件"
    echo "----------------------------------------"

    echo_info "是否备份现有的 .env 文件？[y/N]"
    read -r backup_confirm
    if [[ "$backup_confirm" =~ ^[Yy]$ ]]; then
        cp server/.env "server/.env.backup.$(date +%Y%m%d_%H%M%S)"
        echo_success "已备份到 server/.env.backup.$(date +%Y%m%d_%H%M%S)"
    fi
fi

echo_info "🔧 创建开发环境配置..."

# 创建开发环境的 .env 文件
cat > server/.env << 'EOF'
# 开发环境配置
NODE_ENV=development
PORT=3000

# MongoDB 数据库配置
MONGODB_URI=mongodb://localhost:27017/sdszk

# JWT 配置
JWT_SECRET=dev-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Redis 配置
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# 上传配置
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# 安全配置
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 日志配置
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true

# 开发模式配置
DEBUG=true
ENABLE_CORS=true
CORS_ORIGIN=http://localhost:5173

# API 配置
API_PREFIX=/api
API_VERSION=v1

# 缓存配置
CACHE_TTL=300
ENABLE_CACHE=true

# 邮件配置（开发环境可以为空）
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

# 文件存储配置
STORAGE_TYPE=local
STORAGE_PATH=uploads

# 数据库备份配置
BACKUP_ENABLED=false
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=7

# 性能监控
ENABLE_MONITORING=false
MONITORING_ENDPOINT=

# 其他开发配置
ENABLE_API_DOCS=true
ENABLE_GRAPHQL_PLAYGROUND=false
EOF

echo_success "✅ 开发环境配置文件已创建"

# 验证配置
echo_info "🔍 验证配置..."

if grep -q "MONGODB_URI=mongodb://localhost:27017/sdszk" server/.env; then
    echo_success "✅ MongoDB 配置正确 - 连接到 sdszk 数据库"
else
    echo_error "❌ MongoDB 配置错误"
    exit 1
fi

if grep -q "NODE_ENV=development" server/.env; then
    echo_success "✅ 环境设置正确 - development"
else
    echo_error "❌ 环境设置错误"
    exit 1
fi

# 检查数据库连接
echo_info "🔗 测试数据库连接..."
if mongosh sdszk --eval "db.runCommand({ping: 1})" > /dev/null 2>&1; then
    echo_success "✅ 能够连接到 sdszk 数据库"

    # 显示数据库统计信息
    echo_info "📊 数据库统计信息:"
    mongosh sdszk --eval "
        print('新闻数量:', db.news.countDocuments({}));
        print('资源数量:', db.resources.countDocuments({}));
        print('新闻分类数量:', db.newscategories.countDocuments({}));
        print('资源分类数量:', db.resourcecategories.countDocuments({}));
    " 2>/dev/null || echo "无法获取统计信息"
else
    echo_warning "⚠️  无法连接到 MongoDB sdszk 数据库"
    echo_info "请确保:"
    echo "  1. MongoDB 服务正在运行"
    echo "  2. sdszk 数据库存在且有数据"
    echo "  3. 运行数据库同步: npm run db:sync"
fi

# 检查 Redis 连接
echo_info "🔗 测试 Redis 连接..."
if redis-cli ping > /dev/null 2>&1; then
    echo_success "✅ Redis 连接正常"
else
    echo_warning "⚠️  Redis 连接失败"
    echo_info "启动 Redis: redis-server --daemonize yes"
fi

echo_header "🎉 开发环境设置完成"

echo_info "📝 配置摘要:"
echo "  - 环境: development"
echo "  - 数据库: mongodb://localhost:27017/sdszk"
echo "  - 后端端口: 3000"
echo "  - 前端端口: 5173 (假设)"
echo "  - Redis: localhost:6379"
echo "  - 调试模式: 启用"
echo "  - CORS: 允许 http://localhost:5173"

echo_info "🚀 后续步骤:"
echo "  1. 重启后端服务: cd server && npm run dev"
echo "  2. 启动前端服务: npm run dev"
echo "  3. 验证 API: curl http://localhost:3000/api/health"
echo "  4. 检查数据: curl http://localhost:3000/api/news-categories"

echo_info "🔧 如果还有问题:"
echo "  1. 检查后端日志"
echo "  2. 验证数据库连接: mongosh sdszk"
echo "  3. 清除缓存: redis-cli FLUSHALL"
echo "  4. 重新同步数据: npm run db:sync"

echo_warning "⚠️  注意: 这是开发环境配置，请勿用于生产环境！"

echo_success "🎯 配置完成! 现在可以重启开发服务器了。"
