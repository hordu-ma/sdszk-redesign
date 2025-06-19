#!/bin/bash

# 阿里云服务器 - 重置admin密码脚本
# 用于快速修复登录问题

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

echo_info "=== 阿里云服务器 - 重置admin密码 ==="

# 检查环境变量
if [ -z "$MONGODB_URI" ]; then
    echo_error "MONGODB_URI环境变量未设置"
    echo_warning "请先设置环境变量: export MONGODB_URI='你的MongoDB连接字符串'"
    exit 1
fi

# 创建临时重置脚本
cat > reset_admin.js << 'EOF'
const bcrypt = require('bcrypt');

// MongoDB连接
const { MongoClient } = require('mongodb');

async function resetAdminPassword() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        console.log('连接到MongoDB...');
        await client.connect();
        
        const db = client.db();
        const usersCollection = db.collection('users');
        
        // 检查admin用户是否存在
        const existingAdmin = await usersCollection.findOne({ username: 'admin' });
        
        if (!existingAdmin) {
            console.log('创建新的admin用户...');
            const hashedPassword = await bcrypt.hash('admin123', 12);
            
            const adminUser = {
                username: 'admin',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'admin',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            const result = await usersCollection.insertOne(adminUser);
            console.log('✅ Admin用户创建成功, ID:', result.insertedId);
        } else {
            console.log('更新现有admin用户密码...');
            const hashedPassword = await bcrypt.hash('admin123', 12);
            
            const result = await usersCollection.updateOne(
                { username: 'admin' },
                { 
                    $set: { 
                        password: hashedPassword,
                        isActive: true,
                        updatedAt: new Date()
                    }
                }
            );
            
            if (result.modifiedCount > 0) {
                console.log('✅ Admin密码重置成功');
            } else {
                console.log('❌ 密码重置失败');
            }
        }
        
        // 验证更新后的用户
        const updatedAdmin = await usersCollection.findOne({ username: 'admin' });
        console.log('Admin用户信息:');
        console.log('- 用户名:', updatedAdmin.username);
        console.log('- 邮箱:', updatedAdmin.email);
        console.log('- 角色:', updatedAdmin.role);
        console.log('- 激活状态:', updatedAdmin.isActive);
        console.log('- 密码哈希:', updatedAdmin.password ? '已设置' : '未设置');
        
    } catch (error) {
        console.error('❌ 重置密码失败:', error.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

resetAdminPassword();
EOF

echo_info "开始重置admin密码..."

# 运行重置脚本
if node reset_admin.js; then
    echo_success "密码重置完成!"
    echo_info "admin用户登录信息:"
    echo "  用户名: admin"
    echo "  密码: admin123"
    echo ""
    echo_warning "建议立即登录后台修改为更安全的密码"
else
    echo_error "密码重置失败"
fi

# 清理临时文件
rm -f reset_admin.js

echo_info "脚本执行完成"
