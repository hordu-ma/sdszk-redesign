#!/bin/bash

# 数据库状态验证脚本
# 用于验证数据库清理和同步后的状态

set -e

# 颜色输出函数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_info "🔍 数据库状态验证工具"
echo_info "📋 检查数据库清理和同步后的状态"
echo

# 检查MongoDB服务状态
echo_info "🔌 检查MongoDB服务状态..."
if ! mongosh --eval "db.runCommand('ping')" --quiet > /dev/null 2>&1; then
    echo_error "❌ MongoDB服务未运行"
    exit 1
fi
echo_success "✅ MongoDB服务运行正常"

# 检查数据库列表
echo_info "📊 检查数据库列表..."
echo "当前数据库:"
mongosh --eval "
    const dbs = db.adminCommand('listDatabases');
    dbs.databases.forEach(db => {
        const sizeGB = (db.sizeOnDisk / (1024*1024*1024)).toFixed(2);
        const sizeMB = (db.sizeOnDisk / (1024*1024)).toFixed(2);
        const sizeKB = (db.sizeOnDisk / 1024).toFixed(2);
        let displaySize;
        if (db.sizeOnDisk >= 1024*1024*1024) {
            displaySize = sizeGB + ' GB';
        } else if (db.sizeOnDisk >= 1024*1024) {
            displaySize = sizeMB + ' MB';
        } else {
            displaySize = sizeKB + ' KB';
        }
        console.log('   - ' + db.name + ' (' + displaySize + ')');
    });
" --quiet

echo

# 验证主数据库
echo_info "🗄️ 验证主数据库 (sdszk)..."
if ! mongosh sdszk --eval "db" --quiet > /dev/null 2>&1; then
    echo_error "❌ 主数据库 'sdszk' 不存在"
    exit 1
fi

# 检查集合
echo_info "📋 检查主数据库集合..."
mongosh sdszk --eval "
    const collections = db.getCollectionNames();
    console.log('集合数量: ' + collections.length);
    console.log('集合列表:');
    collections.forEach(col => {
        const count = db.getCollection(col).countDocuments();
        console.log('   - ' + col + ' (' + count + ' documents)');
    });
" --quiet

echo

# 检查关键数据
echo_info "📈 验证关键数据..."
USERS_COUNT=$(mongosh sdszk --eval "db.users.countDocuments()" --quiet)
NEWS_COUNT=$(mongosh sdszk --eval "db.news.countDocuments()" --quiet)
RESOURCES_COUNT=$(mongosh sdszk --eval "db.resources.countDocuments()" --quiet)
SETTINGS_COUNT=$(mongosh sdszk --eval "db.sitesettings.countDocuments()" --quiet)

echo "关键数据统计:"
echo "   - 用户: $USERS_COUNT"
echo "   - 新闻: $NEWS_COUNT"
echo "   - 资源: $RESOURCES_COUNT"
echo "   - 系统设置: $SETTINGS_COUNT"

# 验证数据完整性
echo_info "🔍 验证数据完整性..."
if [ "$USERS_COUNT" -eq 0 ]; then
    echo_warning "⚠️  用户数据为空，可能需要重新同步"
fi

if [ "$SETTINGS_COUNT" -eq 0 ]; then
    echo_warning "⚠️  系统设置为空，可能需要重新同步"
fi

# 检查冗余数据库是否已清理
echo_info "🧹 验证冗余数据库清理状态..."
REDUNDANT_DBS=$(mongosh --eval "
    const dbs = db.adminCommand('listDatabases');
    const redundant = dbs.databases.filter(db =>
        db.name === 'sdszk-redesign' ||
        db.name === 'sdszk_test' ||
        db.name === 'lb'
    );
    redundant.forEach(db => console.log(db.name));
" --quiet)

if [ -z "$REDUNDANT_DBS" ]; then
    echo_success "✅ 冗余数据库已成功清理"
else
    echo_warning "⚠️  发现残留的冗余数据库:"
    echo "$REDUNDANT_DBS"
fi

# 检查应用配置
echo_info "⚙️ 验证应用配置..."
if [ -f "server/app.js" ]; then
    DB_CONFIG=$(grep -o "mongodb://[^\"]*" server/app.js | head -1)
    if [[ "$DB_CONFIG" == *"sdszk"* ]]; then
        echo_success "✅ 应用配置指向正确的数据库"
        echo "   数据库连接: $DB_CONFIG"
    else
        echo_warning "⚠️  应用配置可能需要检查"
        echo "   数据库连接: $DB_CONFIG"
    fi
else
    echo_warning "⚠️  未找到应用配置文件"
fi

# 检查备份文件
echo_info "💾 检查备份文件..."
if [ -d "database-backups" ] && [ "$(ls -A database-backups/)" ]; then
    BACKUP_COUNT=$(ls -1 database-backups/ | wc -l)
    echo_success "✅ 发现 $BACKUP_COUNT 个备份文件"
    echo "最新备份:"
    ls -lt database-backups/ | head -3 | tail -2 | awk '{print "   - " $9 " (" $6 " " $7 " " $8 ")"}'
else
    echo_warning "⚠️  未找到备份文件"
fi

echo

# 生成验证报告
echo_info "📋 验证报告摘要:"
echo "=========================================="
echo_success "✅ MongoDB 服务状态: 正常"

if [ "$USERS_COUNT" -gt 0 ] && [ "$SETTINGS_COUNT" -gt 0 ]; then
    echo_success "✅ 数据完整性: 正常"
else
    echo_warning "⚠️  数据完整性: 需要检查"
fi

if [ -z "$REDUNDANT_DBS" ]; then
    echo_success "✅ 数据库清理: 完成"
else
    echo_warning "⚠️  数据库清理: 未完全清理"
fi

echo "=========================================="
echo_info "验证时间: $(date)"
echo

# 提供建议
echo_info "💡 建议操作:"
if [ "$USERS_COUNT" -eq 0 ] || [ "$SETTINGS_COUNT" -eq 0 ]; then
    echo "   1. 考虑重新同步生产数据: npm run db:sync"
fi
echo "   2. 重启开发服务器以确保缓存清除"
echo "   3. 测试前端应用功能是否正常"
if [ -n "$REDUNDANT_DBS" ]; then
    echo "   4. 手动清理剩余的冗余数据库"
fi

echo
echo_info "🎉 数据库状态验证完成！"
