#!/bin/bash

# 完整的Nginx代理方案自动化执行脚本

echo "=== 🚀 完整Nginx代理方案执行脚本 ==="
echo "这将执行以下步骤："
echo "1. ✅ 修正前端生产环境配置 (已完成)"
echo "2. 🔧 配置Nginx完整代理"
echo "3. 🛠️ 修正后端CORS配置"
echo "4. 📦 构建和部署前端"
echo "5. ✅ 测试完整功能"
echo ""

read -p "确认执行完整方案？(y/n): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "操作已取消"
    exit 0
fi

echo ""
echo "🔧 步骤1: 配置Nginx完整代理..."
chmod +x scripts/setup-nginx-complete.sh
./scripts/setup-nginx-complete.sh

if [ $? -ne 0 ]; then
    echo "❌ Nginx配置失败"
    exit 1
fi

echo ""
echo "🛠️ 步骤2: 修正后端CORS配置..."
chmod +x scripts/fix-backend-cors.sh
./scripts/fix-backend-cors.sh

if [ $? -ne 0 ]; then
    echo "❌ 后端CORS配置失败"
    exit 1
fi

echo ""
echo "📦 步骤3: 构建和部署前端..."
chmod +x scripts/deploy-frontend.sh
./scripts/deploy-frontend.sh

if [ $? -ne 0 ]; then
    echo "❌ 前端部署失败"
    exit 1
fi

echo ""
echo "✅ 步骤4: 测试完整功能..."

echo "测试后端健康检查..."
ssh root@60.205.124.67 "curl -s http://localhost:3000/ | head -c 100"

echo ""
echo "测试Nginx配置..."
ssh root@60.205.124.67 "curl -s http://localhost/health | head -c 100"

echo ""
echo "🎉 === 部署完成 ==="
echo ""
echo "📱 现在可以访问："
echo "• 前端应用: https://horsduroot.com"
echo "• API接口: https://horsduroot.com/api"
echo "• 健康检查: https://horsduroot.com/health"
echo ""
echo "🔍 如果有问题，请检查："
echo "• Nginx日志: ssh root@60.205.124.67 'tail -f /var/log/nginx/sdszk.error.log'"
echo "• 后端日志: ssh root@60.205.124.67 'pm2 logs sdszk-backend'"
echo "• 服务状态: ssh root@60.205.124.67 'pm2 status && systemctl status nginx'"
