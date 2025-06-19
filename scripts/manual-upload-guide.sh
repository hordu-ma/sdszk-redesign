#!/bin/bash

# 手动上传文件到阿里云的简化脚本
# 如果SSH密钥未配置，可以使用此脚本生成上传命令

ALIYUN_HOST="60.205.124.67"
ALIYUN_USER="root"
REMOTE_DIR="/var/www/sdszk-backend"

echo "=== 阿里云文件上传指南 ==="
echo "目标服务器: $ALIYUN_USER@$ALIYUN_HOST"
echo "远程目录: $REMOTE_DIR"
echo ""

echo "如果您的SSH密钥未配置，请按以下步骤手动执行："
echo ""

echo "1. 连接到服务器并创建目录："
echo "ssh $ALIYUN_USER@$ALIYUN_HOST"
echo "mkdir -p $REMOTE_DIR/scripts $REMOTE_DIR/server/middleware $REMOTE_DIR/server/routes"
echo "exit"
echo ""

echo "2. 上传脚本文件："
echo "scp scripts/fix-production-issues.sh $ALIYUN_USER@$ALIYUN_HOST:$REMOTE_DIR/scripts/"
echo "scp scripts/comprehensive-check.sh $ALIYUN_USER@$ALIYUN_HOST:$REMOTE_DIR/scripts/"
echo "scp scripts/test-api.sh $ALIYUN_USER@$ALIYUN_HOST:$REMOTE_DIR/scripts/"
echo ""

echo "3. 上传服务器配置文件："
echo "scp server/middleware/rateLimit.js $ALIYUN_USER@$ALIYUN_HOST:$REMOTE_DIR/server/middleware/"
echo "scp server/middleware/errorMiddleware.js $ALIYUN_USER@$ALIYUN_HOST:$REMOTE_DIR/server/middleware/"
echo "scp server/routes/health.js $ALIYUN_USER@$ALIYUN_HOST:$REMOTE_DIR/server/routes/"
echo "scp server/app.js $ALIYUN_USER@$ALIYUN_HOST:$REMOTE_DIR/server/"
echo ""

echo "4. 连接到服务器并执行修复："
echo "ssh $ALIYUN_USER@$ALIYUN_HOST"
echo "cd $REMOTE_DIR"
echo "chmod +x scripts/*.sh"
echo "./scripts/comprehensive-check.sh"
echo "./scripts/fix-production-issues.sh"
echo "./scripts/test-api.sh"
echo ""

echo "5. 检查服务状态："
echo "pm2 status"
echo "pm2 logs sdszk-backend"
echo ""

echo "=== 或者运行自动化脚本 ==="
echo "./scripts/auto-deploy-fix.sh"
echo ""

# 检查SSH连接
echo "正在测试SSH连接..."
if ssh -o ConnectTimeout=5 -o BatchMode=yes $ALIYUN_USER@$ALIYUN_HOST exit 2>/dev/null; then
    echo "✓ SSH连接正常，可以运行自动化脚本"
    echo ""
    echo "是否立即运行自动化部署？(y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "运行自动化部署脚本..."
        ./scripts/auto-deploy-fix.sh
    fi
else
    echo "✗ SSH连接需要密码或密钥未配置"
    echo "请手动执行上述命令"
fi
