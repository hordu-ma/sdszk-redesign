#!/bin/bash

# 缓存清理脚本
# 用于清理服务器和CDN缓存，确保用户获取最新版本

echo "🧹 开始清理缓存..."

# 服务器信息
SERVER="root@60.205.124.67"
FRONTEND_PATH="/var/www/frontend"

echo "1/3: 清理服务器Nginx缓存..."

ssh $SERVER << 'EOF'
# 清理Nginx缓存（如果启用了缓存）
if [ -d "/var/cache/nginx" ]; then
    sudo rm -rf /var/cache/nginx/*
    echo "✅ Nginx缓存已清理"
else
    echo "ℹ️  未发现Nginx缓存目录"
fi

# 重载Nginx配置
sudo nginx -s reload
echo "✅ Nginx已重载"
EOF

echo "2/3: 更新静态文件时间戳..."

# 更新前端文件的修改时间，强制浏览器重新加载
ssh $SERVER "find $FRONTEND_PATH -name '*.js' -o -name '*.css' -o -name '*.html' | xargs touch"

echo "3/3: 验证缓存策略..."

# 检查缓存头
echo "检查主页缓存头:"
curl -s -I https://sdszk.cn/ | grep -E "(cache-control|expires)"

echo ""
echo "🎉 缓存清理完成！"
echo ""
echo "📋 建议用户操作:"
echo "1. 桌面端浏览器: 按 Ctrl+Shift+R (或 Cmd+Shift+R) 强制刷新"
echo "2. 移动端浏览器: 清除浏览器缓存"
echo "3. 如果问题仍存在，请等待1小时让新缓存策略完全生效"
