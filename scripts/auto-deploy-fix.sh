#!/bin/bash

# 阿里云自动部署修复脚本
# 自动上传文件并执行修复流程

# 配置信息
ALIYUN_HOST="60.205.124.67"
ALIYUN_USER="root"
REMOTE_DIR="/var/www/sdszk-backend"
LOCAL_PROJECT_DIR="/Users/liguoma/my-devs/sdszk-redesign"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

echo_info "=== 阿里云自动部署修复脚本 ==="
echo_info "目标服务器: $ALIYUN_USER@$ALIYUN_HOST"
echo_info "远程目录: $REMOTE_DIR"
echo_info "开始时间: $(date)"

# 检查本地文件
echo_info "1. 检查本地文件..."
required_files=(
    "scripts/fix-production-issues.sh"
    "scripts/comprehensive-check.sh"
    "scripts/test-api.sh"
    "server/middleware/rateLimit.js"
    "server/middleware/errorMiddleware.js"
    "server/routes/health.js"
    "server/app.js"
)

for file in "${required_files[@]}"; do
    if [ -f "$LOCAL_PROJECT_DIR/$file" ]; then
        echo_success "  ✓ $file"
    else
        echo_error "  ✗ $file 不存在"
        exit 1
    fi
done

# 测试SSH连接
echo_info "2. 测试SSH连接..."
if ssh -o ConnectTimeout=10 -o BatchMode=yes $ALIYUN_USER@$ALIYUN_HOST exit 2>/dev/null; then
    echo_success "SSH连接正常"
else
    echo_error "SSH连接失败，请检查："
    echo "1. 服务器地址是否正确"
    echo "2. SSH密钥是否配置"
    echo "3. 网络连接是否正常"
    echo ""
    echo "如果需要输入密码，请手动执行："
    echo "ssh $ALIYUN_USER@$ALIYUN_HOST"
    exit 1
fi

# 备份远程文件
echo_info "3. 备份远程文件..."
ssh $ALIYUN_USER@$ALIYUN_HOST "
    if [ -d '$REMOTE_DIR' ]; then
        echo '备份当前配置文件...'
        cd $REMOTE_DIR
        backup_dir=\"backup_\$(date +%Y%m%d_%H%M%S)\"
        mkdir -p \$backup_dir
        [ -f server/middleware/rateLimit.js ] && cp server/middleware/rateLimit.js \$backup_dir/
        [ -f server/middleware/errorMiddleware.js ] && cp server/middleware/errorMiddleware.js \$backup_dir/
        [ -f server/app.js ] && cp server/app.js \$backup_dir/
        echo '备份完成: '\$backup_dir
    else
        echo '远程目录不存在，将创建...'
        mkdir -p $REMOTE_DIR
    fi
"

# 上传脚本文件
echo_info "4. 上传脚本文件..."
ssh $ALIYUN_USER@$ALIYUN_HOST "mkdir -p $REMOTE_DIR/scripts"

scripts_to_upload=(
    "scripts/fix-production-issues.sh"
    "scripts/comprehensive-check.sh"
    "scripts/test-api.sh"
)

for script in "${scripts_to_upload[@]}"; do
    echo "  上传 $script..."
    scp "$LOCAL_PROJECT_DIR/$script" $ALIYUN_USER@$ALIYUN_HOST:$REMOTE_DIR/$script
    if [ $? -eq 0 ]; then
        echo_success "    ✓ $script 上传成功"
    else
        echo_error "    ✗ $script 上传失败"
        exit 1
    fi
done

# 给脚本添加执行权限
echo_info "5. 设置脚本执行权限..."
ssh $ALIYUN_USER@$ALIYUN_HOST "
    cd $REMOTE_DIR
    chmod +x scripts/*.sh
    echo '脚本权限设置完成'
"

# 上传服务器配置文件
echo_info "6. 上传服务器配置文件..."
ssh $ALIYUN_USER@$ALIYUN_HOST "mkdir -p $REMOTE_DIR/server/middleware $REMOTE_DIR/server/routes"

server_files=(
    "server/middleware/rateLimit.js"
    "server/middleware/errorMiddleware.js"
    "server/routes/health.js"
    "server/app.js"
)

for file in "${server_files[@]}"; do
    echo "  上传 $file..."
    scp "$LOCAL_PROJECT_DIR/$file" $ALIYUN_USER@$ALIYUN_HOST:$REMOTE_DIR/$file
    if [ $? -eq 0 ]; then
        echo_success "    ✓ $file 上传成功"
    else
        echo_error "    ✗ $file 上传失败"
        exit 1
    fi
done

echo_success "所有文件上传完成！"

# 执行远程检查
echo_info "7. 执行系统检查..."
ssh $ALIYUN_USER@$ALIYUN_HOST "
    cd $REMOTE_DIR
    echo '=== 执行系统检查 ==='
    ./scripts/comprehensive-check.sh
"

# 询问是否继续执行修复
echo ""
echo_warning "检查完成。是否继续执行自动修复？(y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo_info "8. 执行自动修复..."
    ssh $ALIYUN_USER@$ALIYUN_HOST "
        cd $REMOTE_DIR
        echo '=== 执行自动修复 ==='
        ./scripts/fix-production-issues.sh
    "
    
    echo_info "9. 测试API连接..."
    ssh $ALIYUN_USER@$ALIYUN_HOST "
        cd $REMOTE_DIR
        echo '=== 测试API连接 ==='
        ./scripts/test-api.sh
    "
    
    echo_info "10. 显示服务状态..."
    ssh $ALIYUN_USER@$ALIYUN_HOST "
        echo '=== PM2服务状态 ==='
        pm2 status 2>/dev/null || echo 'PM2未运行或未安装'
        
        echo ''
        echo '=== 端口监听状态 ==='
        netstat -tlnp | grep ':3000' || echo '端口3000未被监听'
        
        echo ''
        echo '=== 最近的日志 ==='
        if [ -f '$REMOTE_DIR/logs/pm2-combined.log' ]; then
            tail -10 '$REMOTE_DIR/logs/pm2-combined.log'
        else
            echo '日志文件不存在'
        fi
    "
else
    echo_warning "跳过自动修复。您可以稍后手动执行："
    echo "ssh $ALIYUN_USER@$ALIYUN_HOST"
    echo "cd $REMOTE_DIR"
    echo "./scripts/fix-production-issues.sh"
fi

echo ""
echo_success "=== 部署流程完成 ==="
echo_info "接下来您可以："
echo "1. 在浏览器中访问: http://$ALIYUN_HOST:3000/api/health"
echo "2. 测试前端应用是否正常"
echo "3. 如有问题，查看服务器日志: ssh $ALIYUN_USER@$ALIYUN_HOST 'pm2 logs sdszk-backend'"

# 提供快速访问命令
echo ""
echo_info "快速命令："
echo "连接服务器: ssh $ALIYUN_USER@$ALIYUN_HOST"
echo "查看日志: ssh $ALIYUN_USER@$ALIYUN_HOST 'cd $REMOTE_DIR && pm2 logs sdszk-backend'"
echo "重启服务: ssh $ALIYUN_USER@$ALIYUN_HOST 'cd $REMOTE_DIR && pm2 restart sdszk-backend'"
echo "健康检查: curl http://$ALIYUN_HOST:3000/api/health"
