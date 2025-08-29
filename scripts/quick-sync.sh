#!/bin/bash

# 快速数据库同步脚本
# 快速从生产环境同步数据到本地开发环境

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

# 配置变量
PROD_SERVER="60.205.124.67"
PROD_USER="root"
PROD_DB="sdszk"
LOCAL_DB="sdszk"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo_info "🚀 快速数据库同步工具"
echo_info "📋 从生产环境 ($PROD_SERVER) 同步数据到本地开发环境"
echo

# 检查依赖
echo_info "🔍 检查依赖工具..."
if ! command -v mongodump &> /dev/null; then
    echo_error "mongodump 未安装，请先安装 MongoDB Tools"
    echo_info "安装命令: brew install mongodb/brew/mongodb-database-tools"
    exit 1
fi

if ! command -v mongorestore &> /dev/null; then
    echo_error "mongorestore 未安装，请先安装 MongoDB Tools"
    exit 1
fi

if ! command -v ssh &> /dev/null; then
    echo_error "ssh 未安装"
    exit 1
fi

echo_success "✅ 依赖工具检查通过"

# 测试SSH连接
echo_info "🔗 测试SSH连接..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$PROD_USER@$PROD_SERVER" "echo 'SSH连接测试成功'" 2>/dev/null; then
    echo_error "❌ SSH连接失败，请检查："
    echo "  1. SSH密钥是否已配置"
    echo "  2. 网络连接是否正常"
    echo "  3. 服务器地址是否正确"
    exit 1
fi
echo_success "✅ SSH连接正常"

# 确认操作
echo_warning "⚠️  此操作将完全替换本地数据库内容！"
echo_info "📊 当前配置:"
echo "   - 生产服务器: $PROD_SERVER"
echo "   - 生产数据库: $PROD_DB"
echo "   - 本地数据库: $LOCAL_DB"
echo

# 检查是否提供了--force参数
if [[ "$1" == "--force" ]]; then
    echo_info "🚀 使用 --force 参数，跳过确认直接执行"
else
    echo_info "是否继续？[y/N]"
    read -r confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo_info "❌ 操作已取消"
        exit 0
    fi
fi

# 创建临时目录
TEMP_DIR="/tmp/quick-sync-${TIMESTAMP}"
mkdir -p "$TEMP_DIR"

# 备份本地数据（以防万一）
echo_info "💾 正在备份本地数据（安全措施）..."
mkdir -p database-backups
mongodump --db "$LOCAL_DB" --out "database-backups/local-backup-before-sync-${TIMESTAMP}" 2>/dev/null || {
    echo_warning "⚠️  本地数据备份失败，但继续同步..."
}

# 从生产环境导出数据
echo_info "📤 正在从生产环境导出数据..."
ssh "$PROD_USER@$PROD_SERVER" "mongodump --db $PROD_DB --out /tmp/quick-sync-${TIMESTAMP}" || {
    echo_error "❌ 生产环境数据导出失败"
    rm -rf "$TEMP_DIR"
    exit 1
}

# 压缩数据
echo_info "🗜️  正在压缩数据..."
ssh "$PROD_USER@$PROD_SERVER" "cd /tmp && tar czf quick-sync-${TIMESTAMP}.tar.gz quick-sync-${TIMESTAMP}/" || {
    echo_error "❌ 数据压缩失败"
    rm -rf "$TEMP_DIR"
    exit 1
}

# 下载数据
echo_info "⬇️  正在下载数据..."
scp "$PROD_USER@$PROD_SERVER:/tmp/quick-sync-${TIMESTAMP}.tar.gz" "${TEMP_DIR}/" || {
    echo_error "❌ 数据下载失败"
    rm -rf "$TEMP_DIR"
    exit 1
}

# 清理远程临时文件
echo_info "🧹 清理远程临时文件..."
ssh "$PROD_USER@$PROD_SERVER" "rm -rf /tmp/quick-sync-${TIMESTAMP} /tmp/quick-sync-${TIMESTAMP}.tar.gz"

# 解压数据
echo_info "📦 正在解压数据..."
cd "$TEMP_DIR"
tar xzf "quick-sync-${TIMESTAMP}.tar.gz" || {
    echo_error "❌ 数据解压失败"
    rm -rf "$TEMP_DIR"
    exit 1
}

# 清空本地数据库
echo_info "🗑️  正在清空本地数据库..."
mongosh "$LOCAL_DB" --eval "db.dropDatabase()" || {
    echo_error "❌ 清空本地数据库失败"
    rm -rf "$TEMP_DIR"
    exit 1
}

# 恢复数据到本地
echo_info "📥 正在恢复数据到本地数据库..."
mongorestore --db "$LOCAL_DB" "quick-sync-${TIMESTAMP}/${PROD_DB}/" || {
    echo_error "❌ 数据恢复失败"
    rm -rf "$TEMP_DIR"
    exit 1
}

# 清理临时文件
echo_info "🧹 清理临时文件..."
rm -rf "$TEMP_DIR"

# 清除Redis缓存（如果Redis正在运行）
if command -v redis-cli &> /dev/null && redis-cli ping &> /dev/null; then
    echo_info "🔄 清除Redis缓存..."
    redis-cli FLUSHALL &> /dev/null || true
    echo_success "✅ Redis缓存已清除"
fi

echo_success "🎉 数据同步完成！"
echo_info "📝 同步摘要:"
echo "   - 时间: $(date)"
echo "   - 源: $PROD_SERVER:$PROD_DB"
echo "   - 目标: localhost:$LOCAL_DB"
echo "   - 本地备份: database-backups/local-backup-before-sync-${TIMESTAMP}/"
echo
echo_info "💡 建议操作:"
echo "   1. 重启开发服务器以确保缓存清除"
echo "   2. 检查前端页面是否正常显示数据"
echo "   3. 如有问题，可使用备份恢复本地数据"
echo
# 只在非强制模式下询问是否重启
if [[ "$1" != "--force" ]]; then
    echo_info "🔄 要重启开发服务器吗？[y/N]"
    read -r restart_confirm
    if [[ "$restart_confirm" =~ ^[Yy]$ ]]; then
        echo_info "🔄 重启开发服务器..."
        if [ -f "dev-start.sh" ]; then
            ./dev-start.sh
        elif [ -f "scripts/dev-start.sh" ]; then
            ./scripts/dev-start.sh
        else
            echo_info "请手动重启开发服务器"
        fi
    fi
else
    echo_info "💡 提示: 请记得重启开发服务器以清除缓存"
fi
