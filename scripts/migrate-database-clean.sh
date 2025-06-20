#!/bin/bash

# 改进的数据库迁移脚本 - 避免macOS扩展属性问题
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 配置
LOCAL_DB="sdszk"
REMOTE_DB="sdszk-db"
SERVER_USER="root"
SERVER_IP="60.205.124.67"
DUMP_DIR="./db-dump-clean"
BACKUP_FILE="sdszk-backup-clean-$(date +%Y%m%d-%H%M%S).tar.gz"

echo_info "🚀 开始清洁数据库迁移..."

# 1. 导出本地数据库
echo_success "步骤1: 导出本地数据库..."
rm -rf $DUMP_DIR
mkdir -p $DUMP_DIR

mongodump --db $LOCAL_DB --out $DUMP_DIR --quiet
if [ $? -eq 0 ]; then
    echo_success "本地数据库导出成功"
else
    echo_error "本地数据库导出失败"
    exit 1
fi

# 2. 清理macOS扩展属性并压缩
echo_success "步骤2: 清理扩展属性并压缩..."
# 移除macOS扩展属性文件
find $DUMP_DIR -name "._*" -delete
find $DUMP_DIR -name ".DS_Store" -delete

# 使用无扩展属性的tar命令压缩
COPYFILE_DISABLE=1 tar -czf $BACKUP_FILE -C $DUMP_DIR $LOCAL_DB
echo_success "压缩完成: $BACKUP_FILE"

# 3. 上传到服务器
echo_success "步骤3: 上传到阿里云服务器..."
scp $BACKUP_FILE $SERVER_USER@$SERVER_IP:/tmp/
if [ $? -eq 0 ]; then
    echo_success "文件上传成功"
else
    echo_error "文件上传失败"
    exit 1
fi

# 4. 在服务器上恢复数据库
echo_success "步骤4: 在服务器上恢复数据库..."
ssh $SERVER_USER@$SERVER_IP "
    cd /tmp
    
    # 解压文件
    echo '解压数据库文件...'
    tar -xzf $BACKUP_FILE
    
    # 检查解压后的文件
    echo '检查解压后的文件:'
    ls -la $LOCAL_DB/
    
    # 备份现有数据库（如果存在）
    echo '备份现有数据库...'
    mongodump --db $REMOTE_DB --out ./backup-before-migration-\$(date +%Y%m%d-%H%M%S) --quiet 2>/dev/null || echo '没有现有数据库需要备份'
    
    # 删除现有数据库
    echo '清理现有数据库...'
    mongosh $REMOTE_DB --quiet --eval 'db.dropDatabase()'
    
    # 恢复数据库 - 使用新的mongorestore语法
    echo '恢复数据库...'
    mongorestore --nsInclude='*' --db=$REMOTE_DB $LOCAL_DB/ --quiet
    
    # 验证恢复结果
    echo '验证数据库恢复...'
    mongosh $REMOTE_DB --quiet --eval '
        console.log(\"=== 数据库恢复验证 ===\");
        console.log(\"数据库名称:\", db.getName());
        console.log(\"集合列表:\", db.getCollectionNames());
        console.log(\"用户数量:\", db.users.countDocuments());
        console.log(\"新闻数量:\", db.news.countDocuments());
        console.log(\"资源数量:\", db.resources.countDocuments());
        
        // 检查管理员用户
        const adminUser = db.users.findOne({username: \"admin\"});
        console.log(\"管理员用户:\", adminUser ? \"存在\" : \"不存在\");
        if (adminUser) {
            console.log(\"管理员详情:\", {
                username: adminUser.username,
                email: adminUser.email,
                role: adminUser.role,
                isActive: adminUser.active
            });
        }
    '
    
    # 清理临时文件
    rm -rf ./$LOCAL_DB $BACKUP_FILE
    echo '清理临时文件完成'
"

if [ $? -eq 0 ]; then
    echo_success "数据库恢复成功！"
else
    echo_error "数据库恢复失败"
    exit 1
fi

# 5. 重启后端服务
echo_success "步骤5: 重启后端服务..."
ssh $SERVER_USER@$SERVER_IP "pm2 restart sdszk-backend"
echo_success "后端服务重启完成"

# 6. 测试数据库连接
echo_success "步骤6: 测试数据库连接..."
sleep 5
curl -f -s https://horsduroot.com/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo_success "API健康检查通过"
else
    echo_warning "API健康检查失败，请手动检查"
fi

# 清理本地临时文件
rm -rf $DUMP_DIR $BACKUP_FILE

echo_success "🎉 数据库迁移完成！"
echo_info "现在可以使用本地的管理员账号登录了"
echo_info "管理员账号: admin"
echo_info "管理员邮箱: admin@sdszk.edu.cn"
