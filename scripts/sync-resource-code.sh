#!/bin/bash

# 资源中心代码同步脚本
# 从生产环境同步资源中心相关代码到开发环境

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
PROD_BACKEND_PATH="/var/www/sdszk-backend"
PROD_FRONTEND_PATH="/var/www/sdszk-frontend"
LOCAL_PROJECT_PATH="$(pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./code-backups/resource-center-backup-${TIMESTAMP}"

echo_info "🚀 资源中心代码同步工具"
echo_info "📋 从生产环境同步资源中心相关代码到开发环境"
echo

# 检查依赖
echo_info "🔍 检查依赖工具..."
if ! command -v ssh &> /dev/null; then
    echo_error "ssh 未安装"
    exit 1
fi

if ! command -v rsync &> /dev/null; then
    echo_error "rsync 未安装，请先安装 rsync"
    echo_info "macOS 安装命令: brew install rsync"
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

# 验证生产环境项目路径
echo_info "📂 验证生产环境项目路径..."
if ! ssh "$PROD_USER@$PROD_SERVER" "[ -d '$PROD_BACKEND_PATH' ]"; then
    echo_error "❌ 生产环境后端路径不存在: $PROD_BACKEND_PATH"
    exit 1
fi
if ! ssh "$PROD_USER@$PROD_SERVER" "[ -d '$PROD_FRONTEND_PATH' ]"; then
    echo_error "❌ 生产环境前端路径不存在: $PROD_FRONTEND_PATH"
    exit 1
fi
echo_success "✅ 生产环境项目路径验证通过"

# 定义需要同步的文件列表
declare -a BACKEND_FILES=(
    "controllers/resourceController.js"
    "routes/resources.js"
    "models/Resource.js"
    "controllers/uploadController.js"
    "middleware/staticFiles.js"
)

declare -a FRONTEND_FILES=(
    "src/views/resources/"
    "src/api/modules/resources/"
    "src/views/Resources.vue"
    "src/config/index.ts"
)

# 确认操作
echo_warning "⚠️  此操作将覆盖本地的资源中心相关代码文件！"
echo_info "📊 将要同步的文件:"
echo "   后端文件:"
for file in "${BACKEND_FILES[@]}"; do
    echo "     - server/$file"
done
echo "   前端文件:"
for file in "${FRONTEND_FILES[@]}"; do
    echo "     - $file"
done
echo
echo_info "📁 本地备份目录: $BACKUP_DIR"
echo

# 检查是否提供了--force参数
if [[ "$1" == "--force" ]]; then
    echo_info "🚀 使用 --force 参数，跳过确认直接执行"
else
    echo_info "是否继续同步？[y/N]"
    read -r confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo_info "❌ 操作已取消"
        exit 0
    fi
fi

# 创建备份目录
echo_info "💾 创建本地备份目录..."
mkdir -p "$BACKUP_DIR"

# 备份本地文件
echo_info "📦 备份本地文件..."

# 备份后端文件
for file in "${BACKEND_FILES[@]}"; do
    local_file="server/$file"
    if [ -e "$LOCAL_PROJECT_PATH/$local_file" ]; then
        echo_info "  备份: $local_file"
        target_dir="$BACKUP_DIR/$(dirname "$local_file")"
        mkdir -p "$target_dir"

        if [ -d "$LOCAL_PROJECT_PATH/$local_file" ]; then
            cp -r "$LOCAL_PROJECT_PATH/$local_file" "$target_dir/"
        else
            cp "$LOCAL_PROJECT_PATH/$local_file" "$target_dir/"
        fi
    else
        echo_warning "  本地文件不存在，跳过备份: $local_file"
    fi
done

# 备份前端文件
for file in "${FRONTEND_FILES[@]}"; do
    if [ -e "$LOCAL_PROJECT_PATH/$file" ]; then
        echo_info "  备份: $file"
        target_dir="$BACKUP_DIR/$(dirname "$file")"
        mkdir -p "$target_dir"

        if [ -d "$LOCAL_PROJECT_PATH/$file" ]; then
            cp -r "$LOCAL_PROJECT_PATH/$file" "$target_dir/"
        else
            cp "$LOCAL_PROJECT_PATH/$file" "$target_dir/"
        fi
    else
        echo_warning "  本地文件不存在，跳过备份: $file"
    fi
done

echo_success "✅ 本地文件备份完成"

# 从生产环境同步文件
echo_info "📥 从生产环境同步文件..."

# 同步后端文件
echo_info "  📂 同步后端文件..."
for file in "${BACKEND_FILES[@]}"; do
    echo_info "    同步: server/$file"

    if ssh "$PROD_USER@$PROD_SERVER" "[ -e '$PROD_BACKEND_PATH/$file' ]"; then
        local_dir="$(dirname "$LOCAL_PROJECT_PATH/server/$file")"
        mkdir -p "$local_dir"

        if ssh "$PROD_USER@$PROD_SERVER" "[ -d '$PROD_BACKEND_PATH/$file' ]"; then
            rsync -avz --delete "$PROD_USER@$PROD_SERVER:$PROD_BACKEND_PATH/$file/" "$LOCAL_PROJECT_PATH/server/$file/"
        else
            rsync -avz "$PROD_USER@$PROD_SERVER:$PROD_BACKEND_PATH/$file" "$LOCAL_PROJECT_PATH/server/$file"
        fi
        echo_success "      ✅ 同步完成: server/$file"
    else
        echo_warning "      ⚠️  生产环境文件不存在，跳过: $file"
    fi
done

# 同步前端文件
echo_info "  📂 同步前端文件..."
for file in "${FRONTEND_FILES[@]}"; do
    echo_info "    同步: $file"

    if ssh "$PROD_USER@$PROD_SERVER" "[ -e '$PROD_FRONTEND_PATH/$file' ]"; then
        local_dir="$(dirname "$LOCAL_PROJECT_PATH/$file")"
        mkdir -p "$local_dir"

        if ssh "$PROD_USER@$PROD_SERVER" "[ -d '$PROD_FRONTEND_PATH/$file' ]"; then
            rsync -avz --delete "$PROD_USER@$PROD_SERVER:$PROD_FRONTEND_PATH/$file/" "$LOCAL_PROJECT_PATH/$file/"
        else
            rsync -avz "$PROD_USER@$PROD_SERVER:$PROD_FRONTEND_PATH/$file" "$LOCAL_PROJECT_PATH/$file"
        fi
        echo_success "      ✅ 同步完成: $file"
    else
        echo_warning "      ⚠️  生产环境文件不存在，跳过: $file"
    fi
done

echo_success "🎉 代码同步完成！"

# 检查关键文件是否存在
echo_info "🔍 验证关键文件..."
missing_files=()
critical_files=(
    "server/controllers/resourceController.js"
    "server/routes/resources.js"
    "server/models/Resource.js"
    "src/views/resources/ResourcesByCategory.vue"
    "src/views/resources/ResourceDetail.vue"
    "src/api/modules/resources/index.ts"
)

for file in "${critical_files[@]}"; do
    if [ ! -e "$LOCAL_PROJECT_PATH/$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    echo_success "✅ 所有关键文件验证通过"
else
    echo_warning "⚠️  以下关键文件缺失:"
    for file in "${missing_files[@]}"; do
        echo "    - $file"
    done
fi

# 安装依赖（如果需要）
echo_info "📦 检查是否需要重新安装依赖..."
if [ -f "package.json" ]; then
    echo_info "🔄 重新安装前端依赖..."
    npm install || echo_warning "前端依赖安装失败，请手动执行 npm install"
fi

if [ -f "server/package.json" ]; then
    echo_info "🔄 重新安装后端依赖..."
    cd server && npm install && cd .. || echo_warning "后端依赖安装失败，请手动执行 cd server && npm install"
fi

echo_info "📝 同步摘要:"
echo "   - 时间: $(date)"
echo "   - 后端源: $PROD_SERVER:$PROD_BACKEND_PATH"
echo "   - 前端源: $PROD_SERVER:$PROD_FRONTEND_PATH"
echo "   - 目标: $LOCAL_PROJECT_PATH"
echo "   - 备份位置: $BACKUP_DIR"
echo
echo_info "💡 建议后续操作:"
echo "   1. 检查同步的代码是否有语法错误"
echo "   2. 重启开发服务器"
echo "   3. 测试资源中心功能是否正常"
echo "   4. 如果有问题，可使用备份文件恢复"
echo

# 恢复说明
echo_info "🔄 如需恢复备份，可执行:"
echo "   cp -r $BACKUP_DIR/* ./"
echo

# 询问是否重启开发服务器
if [[ "$1" != "--force" ]]; then
    echo_info "🔄 要重启开发服务器吗？[y/N]"
    read -r restart_confirm
    if [[ "$restart_confirm" =~ ^[Yy]$ ]]; then
        echo_info "🔄 正在重启开发服务器..."
        # 尝试找到并执行重启脚本
        if [ -f "scripts/dev-restart.sh" ]; then
            ./scripts/dev-restart.sh
        elif [ -f "dev-restart.sh" ]; then
            ./dev-restart.sh
        else
            echo_info "请手动重启开发服务器"
            echo "  前端: npm run dev"
            echo "  后端: npm run server:dev"
        fi
    fi
else
    echo_info "💡 提示: 请记得重启开发服务器以应用更改"
fi

echo_success "🎯 资源中心代码同步完成！"
