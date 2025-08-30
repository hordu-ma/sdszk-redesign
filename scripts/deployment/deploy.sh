#!/bin/bash

# 前端自动化部署脚本
# 专门用于部署前端静态文件到生产服务器（阿里云环境）
# 使用 .env.aliyun 配置和 vite.config.aliyun.ts 构建配置

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示带颜色的消息
echo_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 确保脚本在错误时退出
set -e

echo_info "🚀 开始前端自动化部署..."

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo_warning "检测到未提交的更改，建议先提交代码再部署"
    read -p "是否继续部署? [y/N]: " CONTINUE_DEPLOY
    if [[ ! "$CONTINUE_DEPLOY" =~ ^[Yy]$ ]]; then
        echo_info "部署已取消"
        exit 0
    fi
fi

# 构建前端项目（使用阿里云生产环境配置）
echo_success "开始构建前端项目..."
echo_info "使用配置: .env.aliyun 和 vite.config.aliyun.ts"
npm install --legacy-peer-deps
npm run build:aliyun  # 使用阿里云生产环境配置

# 检查构建结果
DEPLOY_DIR="dist"
if [ ! -d "$DEPLOY_DIR" ]; then
    echo_error "构建失败！dist目录不存在"
    exit 1
fi

echo_success "构建完成，准备部署..."

# 服务器配置 - 使用现有的生产服务器
SERVER_USER="root"
SERVER_IP="60.205.124.67" 
DEPLOY_PATH="/var/www/frontend"  # 对应nginx配置中的root路径

echo_info "目标服务器: $SERVER_USER@$SERVER_IP"
echo_info "部署路径: $DEPLOY_PATH"

# 测试SSH连接
echo_info "测试SSH连接..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes $SERVER_USER@$SERVER_IP exit 2>/dev/null; then
    echo_error "无法连接到服务器，请检查SSH配置"
    exit 1
fi

# 确保远程目录存在
echo_success "确保远程目录存在..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $DEPLOY_PATH"

# 备份现有文件（可选）
echo_info "是否备份现有文件? [y/N]"
read -t 10 BACKUP_FILES || BACKUP_FILES="N"
if [[ "$BACKUP_FILES" =~ ^[Yy]$ ]]; then
    BACKUP_DIR="/tmp/frontend-backup-$(date +%Y%m%d-%H%M%S)"
    echo_success "备份现有文件到 $BACKUP_DIR..."
    ssh $SERVER_USER@$SERVER_IP "[ -d $DEPLOY_PATH ] && cp -r $DEPLOY_PATH $BACKUP_DIR || echo '无现有文件需要备份'"
fi

# 部署前端文件
echo_success "开始部署前端文件..."
rsync -avz --delete \
    --exclude='.git*' \
    --exclude='node_modules' \
    --exclude='*.log' \
    $DEPLOY_DIR/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/

# 设置正确的文件权限
echo_success "设置文件权限..."
ssh $SERVER_USER@$SERVER_IP "
    chmod -R 755 $DEPLOY_PATH
    chown -R www-data:www-data $DEPLOY_PATH
"

# 重载Nginx配置（不生成新配置，只重载现有配置）
echo_success "重载Nginx配置..."
ssh $SERVER_USER@$SERVER_IP "
    nginx -t && systemctl reload nginx || {
        echo '❌ Nginx配置测试失败'
        exit 1
    }
"

# 验证部署结果
echo_success "验证部署结果..."
HEALTH_CHECK_URL="https://horsduroot.com"
if curl -f -s --max-time 10 "$HEALTH_CHECK_URL" > /dev/null; then
    echo_success "✅ 网站访问正常: $HEALTH_CHECK_URL"
else
    echo_warning "⚠️  网站访问可能有问题，请手动检查"
fi

# 显示部署信息
echo_info "📊 部署摘要:"
echo_info "   • 构建时间: $(date)"
echo_info "   • 部署服务器: $SERVER_IP"
echo_info "   • 部署路径: $DEPLOY_PATH"
echo_info "   • 网站地址: https://horsduroot.com"
echo_info "   • 网站地址(www): https://www.horsduroot.com"

echo_success "🎉 前端部署完成！"
