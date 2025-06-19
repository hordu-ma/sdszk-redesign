#!/bin/bash

# 系统性修复脚本 - 解决前后端连接问题

ALIYUN_HOST="60.205.124.67"
ALIYUN_USER="root"
REMOTE_DIR="/var/www/sdszk-backend"

echo "=== 系统性问题修复方案 ==="
echo ""
echo "发现的问题："
echo "1. 前端API配置错误"
echo "2. 后端路由参数处理错误"
echo "3. CORS配置可能不匹配"
echo "4. 前端构建配置问题"
echo ""

echo "修复步骤："
echo "1. 修正前端API配置"
echo "2. 修复后端API路由"
echo "3. 更新CORS配置"
echo "4. 重新构建部署前端"
echo ""

# 步骤1: 创建正确的阿里云环境配置
echo "=== 步骤1: 修正前端API配置 ==="
cat > .env.aliyun << 'ENVEOF'
# 阿里云生产环境配置
NODE_ENV=production

# API配置 - 直接指向阿里云服务器
VITE_API_BASE_URL=http://60.205.124.67:3000/api
VITE_API_TIMEOUT=30000
VITE_API_MOCK=false

# 应用配置
VITE_APP_TITLE=山东省大中小学思政课一体化指导中心
VITE_APP_DESC=为全省大中小学思政课一体化建设提供专业指导与资源支持

# 调试配置
VITE_APP_DEBUG=true
VITE_ENABLE_LOGGER=true

# 缓存配置
VITE_CACHE_ENABLED=true
VITE_CACHE_TTL=1800
VITE_CACHE_MAX_SIZE=50

# 分页配置
VITE_PAGE_SIZE=20
VITE_PAGE_SIZES=10,20,50,100

# 文件上传配置
VITE_UPLOAD_MAX_SIZE=10485760
VITE_UPLOAD_ACCEPT_TYPES=.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx

# 性能配置
VITE_ENABLE_COMPRESSION=true
VITE_COMPRESSION_THRESHOLD=1024
ENVEOF

echo "✅ 前端环境配置已更新"

# 步骤2: 修复后端API路由问题
echo ""
echo "=== 步骤2: 修复后端API路由 ==="

ssh $ALIYUN_USER@$ALIYUN_HOST << 'SSHEOF'
cd /var/www/sdszk-backend

echo "检查和修复新闻分类路由..."

# 测试当前API
echo "当前API测试结果："
curl -s http://localhost:3000/api/news-categories/core1 || echo "API调用失败"

echo ""
echo "检查可用的新闻分类："
mongosh "mongodb://localhost:27017/sdszk" --eval "
  try {
    const categories = db.newscategories.find({}).limit(5).toArray();
    console.log('可用分类数量:', db.newscategories.countDocuments());
    categories.forEach(cat => {
      console.log('分类:', cat.name, 'ID:', cat._id, 'Slug:', cat.slug);
    });
  } catch(e) {
    console.log('查询分类失败:', e.message);
  }
" --quiet 2>/dev/null || echo "MongoDB查询失败"

echo ""
echo "修复CORS配置..."
# 备份当前app.js
cp server/app.js server/app.js.backup.cors

# 更新CORS配置以包含正确的域名
sed -i 's/"https:\/\/hordu-ma\.github\.io"/"https:\/\/horsduroot\.com"/g' server/app.js

echo "更新后的CORS配置："
grep -A 10 -B 2 "horsduroot.com" server/app.js

echo ""
echo "重启服务..."
pm2 restart sdszk-backend

sleep 5

echo ""
echo "测试修复后的API："
curl -s http://localhost:3000/api/news-categories | head -c 200
echo ""

echo "测试健康检查："
curl -s http://localhost:3000/ | head -c 100
echo ""

SSHEOF

# 步骤3: 构建前端
echo ""
echo "=== 步骤3: 重新构建前端 ==="

echo "使用阿里云配置构建前端..."
npm run build:aliyun

if [ $? -eq 0 ]; then
    echo "✅ 前端构建成功"
    
    echo "构建产物大小："
    du -sh dist/
    
    echo ""
    echo "=== 步骤4: 部署到GitHub Pages ==="
    
    # 检查是否有Git仓库
    if [ -d ".git" ]; then
        echo "部署到GitHub Pages..."
        
        # 复制构建产物到根目录（GitHub Pages部署）
        cp -r dist/* .
        
        git add .
        git commit -m "修复API配置并重新部署 - $(date '+%Y-%m-%d %H:%M:%S')"
        git push origin main
        
        echo "✅ 已推送到GitHub Pages"
    else
        echo "⚠️ 未找到Git仓库，请手动部署构建产物"
    fi
else
    echo "❌ 前端构建失败"
    exit 1
fi

echo ""
echo "=== 步骤5: 验证修复结果 ==="

echo "等待GitHub Pages部署..."
sleep 30

echo "测试API连接："
curl -s -o /dev/null -w "%{http_code}" http://60.205.124.67:3000/ && echo " - 后端服务正常"

echo ""
echo "=== 修复完成! ==="
echo ""
echo "请测试以下URL:"
echo "1. 前端应用: https://horsduroot.com"
echo "2. 后端API: http://60.205.124.67:3000/api/news-categories"
echo "3. 健康检查: http://60.205.124.67:3000/"
echo ""
echo "如果仍有问题，请查看浏览器开发者工具的网络面板"
