#!/bin/bash

# 生产环境问题修复脚本
# 解决500错误和429错误

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

echo_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

echo_info "=== 生产环境问题修复脚本 ==="
echo_info "当前时间: $(date)"

# 1. 检查服务状态
echo_info "1. 检查当前服务状态..."
if pgrep -f "node.*app.js" > /dev/null; then
    echo_warning "发现运行中的服务，准备重启..."
    pkill -f "node.*app.js"
    sleep 3
else
    echo_info "没有发现运行中的服务"
fi

# 2. 检查和设置环境变量
echo_info "2. 检查环境变量配置..."
if [ -z "$MONGODB_URI" ]; then
    echo_error "MONGODB_URI 未设置！"
    echo "请设置环境变量："
    echo "export MONGODB_URI='您的MongoDB连接字符串'"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo_error "JWT_SECRET 未设置！"
    echo "请设置环境变量："
    echo "export JWT_SECRET='您的JWT密钥'"
    exit 1
fi

if [ -z "$FRONTEND_URL" ]; then
    echo_warning "FRONTEND_URL 未设置，使用默认值"
    export FRONTEND_URL="https://hordu-ma.github.io"
fi

export NODE_ENV="production"

echo_success "环境变量配置完成"

# 3. 创建必要的目录
echo_info "3. 创建必要的目录..."
mkdir -p logs uploads/documents uploads/images uploads/videos
chmod 755 logs uploads uploads/documents uploads/images uploads/videos

# 4. 备份当前配置
echo_info "4. 备份当前频率限制配置..."
if [ -f "middleware/rateLimit.js" ]; then
    cp middleware/rateLimit.js middleware/rateLimit.js.backup.$(date +%Y%m%d_%H%M%S)
    echo_success "频率限制配置已备份"
fi

# 5. 清理可能的缓存问题
echo_info "5. 清理缓存..."
rm -rf node_modules/.cache 2>/dev/null
echo_success "缓存清理完成"

# 6. 测试MongoDB连接
echo_info "6. 测试MongoDB连接..."
if command -v mongosh &> /dev/null; then
    if mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')" --quiet; then
        echo_success "MongoDB连接正常"
    else
        echo_error "MongoDB连接失败！请检查连接字符串"
        exit 1
    fi
elif command -v mongo &> /dev/null; then
    if mongo "$MONGODB_URI" --eval "db.adminCommand('ping')" --quiet; then
        echo_success "MongoDB连接正常"
    else
        echo_error "MongoDB连接失败！请检查连接字符串"
        exit 1
    fi
else
    echo_warning "未找到MongoDB客户端，跳过连接测试"
fi

# 7. 安装PM2（如果未安装）
echo_info "7. 检查PM2..."
if ! command -v pm2 &> /dev/null; then
    echo_info "安装PM2..."
    npm install -g pm2
    echo_success "PM2安装完成"
else
    echo_success "PM2已安装"
fi

# 8. 创建PM2配置文件
echo_info "8. 创建PM2配置文件..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sdszk-backend',
    script: 'app.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
}
EOF
echo_success "PM2配置文件创建完成"

# 9. 启动服务
echo_info "9. 启动服务..."
pm2 delete sdszk-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
echo_success "服务启动完成"

# 10. 等待服务启动
echo_info "10. 等待服务启动..."
sleep 10

# 11. 测试服务
echo_info "11. 测试服务状态..."
for i in {1..5}; do
    echo "尝试 $i/5..."
    if curl -s http://localhost:3000/api/health > /dev/null; then
        echo_success "服务启动成功！"
        break
    fi
    if [ $i -eq 5 ]; then
        echo_error "服务启动失败，查看日志："
        pm2 logs sdszk-backend --lines 20
        exit 1
    fi
    sleep 5
done

# 12. 测试登录API
echo_info "12. 测试登录API..."
LOGIN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' \
    http://localhost:3000/api/auth/login)

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
echo "登录API状态码: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo_success "登录API测试成功"
elif [ "$HTTP_CODE" = "429" ]; then
    echo_warning "遇到频率限制，这是正常的保护机制"
elif [ "$HTTP_CODE" = "401" ]; then
    echo_warning "登录失败，可能需要重置admin密码"
else
    echo_error "登录API测试失败，状态码: $HTTP_CODE"
fi

# 13. 显示服务状态
echo_info "13. 服务状态总览..."
pm2 status
echo ""
echo_info "最近的日志:"
pm2 logs sdszk-backend --lines 10

echo_info "=== 修复脚本执行完成 ==="
echo_success "服务应该已经正常运行"
echo_info "如果仍有问题，请检查:"
echo "1. pm2 logs sdszk-backend"
echo "2. 浏览器开发者工具网络面板"
echo "3. 确保前端FRONTEND_URL配置正确"
