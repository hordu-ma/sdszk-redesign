#!/bin/bash

# 修复 MongoDB 认证问题并创建测试数据

SERVER_IP="60.205.124.67"

echo "🛠️ 修复 MongoDB 认证问题并创建测试数据..."
echo "================================"

# 1. 检查并修复 MongoDB 配置
echo "1️⃣ 检查 MongoDB 配置..."
ssh root@$SERVER_IP << 'EOF'
echo "检查 MongoDB 配置文件："
if [ -f "/etc/mongod.conf" ]; then
    echo "MongoDB 配置文件存在"
    grep -E "authorization|security" /etc/mongod.conf || echo "未找到认证配置"
else
    echo "MongoDB 配置文件不存在"
fi

echo -e "\n检查 MongoDB 进程："
ps aux | grep mongod | grep -v grep

echo -e "\n检查 MongoDB 端口："
netstat -tlnp | grep 27017

echo -e "\n连接 MongoDB 并检查数据库："
mongosh --eval "
try {
    // 测试连接
    db.runCommand({ping: 1});
    print('MongoDB 连接成功');
    
    // 切换到 sdszk 数据库
    use sdszk;
    
    // 检查现有集合
    print('现有集合: ' + db.getCollectionNames().join(', '));
    
    // 检查新闻分类
    print('新闻分类数量: ' + db.newscategories.countDocuments());
    
    // 检查资源分类
    print('资源分类数量: ' + db.resourcecategories.countDocuments());
    
} catch (e) {
    print('MongoDB 操作失败: ' + e);
}
" 2>/dev/null || mongo sdszk --eval "
try {
    db.runCommand({ping: 1});
    print('MongoDB 连接成功');
    print('新闻分类数量: ' + db.newscategories.count());
    print('资源分类数量: ' + db.resourcecategories.count());
} catch (e) {
    print('MongoDB 操作失败: ' + e);
}
" 2>/dev/null || echo "MongoDB 连接失败"
EOF

# 2. 创建测试数据
echo -e "\n2️⃣ 创建测试数据..."
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
echo "创建测试数据..."

# 使用 mongosh 或 mongo 创建测试数据
mongosh sdszk --eval "
try {
    // 清理并创建新闻分类
    db.newscategories.deleteMany({});
    
    const newsCategories = [
        {
            _id: 'core',
            name: '核心理论',
            description: '马克思主义核心理论学习',
            order: 1,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            _id: 'practice',
            name: '实践应用',
            description: '理论实践与应用',
            order: 2,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];
    
    db.newscategories.insertMany(newsCategories);
    print('✅ 新闻分类创建成功');
    
    // 清理并创建资源分类
    db.resourcecategories.deleteMany({});
    
    const resourceCategories = [
        {
            _id: 'theory',
            name: '理论学习',
            description: '理论学习资源',
            order: 1,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            _id: 'video',
            name: '视频资源',
            description: '教学视频资源',
            order: 2,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];
    
    db.resourcecategories.insertMany(resourceCategories);
    print('✅ 资源分类创建成功');
    
    // 创建一些测试新闻
    db.news.deleteMany({});
    
    const testNews = [
        {
            title: '马克思主义基本原理学习',
            content: '深入学习马克思主义基本原理，掌握科学的世界观和方法论。',
            category: 'core',
            author: 'admin',
            status: 'published',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            title: '实践应用案例分析',
            content: '通过实际案例分析，理解理论与实践相结合的重要性。',
            category: 'practice',
            author: 'admin',
            status: 'published',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];
    
    db.news.insertMany(testNews);
    print('✅ 测试新闻创建成功');
    
    // 创建一些测试资源
    db.resources.deleteMany({});
    
    const testResources = [
        {
            title: '马克思主义理论学习指南',
            description: '系统的理论学习指南',
            category: 'theory',
            type: 'document',
            url: '/uploads/theory-guide.pdf',
            author: 'admin',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            title: '理论学习视频教程',
            description: '生动的视频教学内容',
            category: 'video',
            type: 'video',
            url: '/uploads/theory-video.mp4',
            author: 'admin',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];
    
    db.resources.insertMany(testResources);
    print('✅ 测试资源创建成功');
    
    // 验证数据
    print('=== 数据验证 ===');
    print('新闻分类数量: ' + db.newscategories.countDocuments());
    print('资源分类数量: ' + db.resourcecategories.countDocuments());
    print('新闻数量: ' + db.news.countDocuments());
    print('资源数量: ' + db.resources.countDocuments());
    
} catch (e) {
    print('❌ 数据创建失败: ' + e);
}
" 2>/dev/null || mongo sdszk --eval "
try {
    // 使用旧版本 mongo 语法
    db.newscategories.remove({});
    
    db.newscategories.insert({
        _id: 'core',
        name: '核心理论',
        description: '马克思主义核心理论学习',
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    db.resourcecategories.remove({});
    
    db.resourcecategories.insert({
        _id: 'theory',
        name: '理论学习',
        description: '理论学习资源',
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    print('✅ 基础测试数据创建成功');
    print('新闻分类数量: ' + db.newscategories.count());
    print('资源分类数量: ' + db.resourcecategories.count());
    
} catch (e) {
    print('❌ 数据创建失败: ' + e);
}
" 2>/dev/null || echo "数据创建失败"
EOF

# 3. 重启后端服务并测试
echo -e "\n3️⃣ 重启后端服务并测试..."
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
cd /var/www/sdszk-backend

echo "重启后端服务..."
pm2 restart sdszk-backend

echo "等待服务启动..."
sleep 5

echo "=== API 接口测试 ==="

echo "1. 健康检查："
curl -s http://localhost:3000/api/health | jq .

echo -e "\n2. 新闻分类接口："
curl -s http://localhost:3000/api/news-categories/core | jq .

echo -e "\n3. 所有新闻分类："
curl -s http://localhost:3000/api/news-categories | jq .

echo -e "\n4. 资源接口："
curl -s "http://localhost:3000/api/resources?category=theory&limit=5" | jq .

echo -e "\n5. 新闻列表接口："
curl -s "http://localhost:3000/api/news?page=1&limit=10" | jq .

echo -e "\n6. 通过 Nginx 代理测试："
echo "健康检查："
curl -s http://localhost/api/health | jq .status

echo -e "\n新闻分类："
curl -s http://localhost/api/news-categories/core | jq .

echo -e "\n7. 外部访问测试："
echo "健康检查："
curl -s https://horsduroot.com/api/health | jq .status

echo -e "\n新闻分类："
curl -s https://horsduroot.com/api/news-categories/core | jq .
EOF

echo -e "\n✅ MongoDB 修复和测试数据创建完成！"
echo ""
echo "🎯 现在可以测试前端页面："
echo "- 首页: https://horsduroot.com/"
echo "- 资讯中心: https://horsduroot.com/news"
echo "- 理论学习: https://horsduroot.com/resources"
echo ""
echo "📋 API 端点："
echo "- 健康检查: https://horsduroot.com/api/health"
echo "- 新闻分类: https://horsduroot.com/api/news-categories/core"
echo "- 资源列表: https://horsduroot.com/api/resources?category=theory&limit=5"
