#!/bin/bash

# 生产环境URL修复脚本
# 修复资源中心数据库中包含 localhost:3000 的URL

set -e

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装或不在 PATH 中"
        exit 1
    fi

    # 检查生产环境配置文件
    if [[ ! -f "$PROJECT_ROOT/server/.env.production" ]]; then
        log_error "生产环境配置文件不存在: $PROJECT_ROOT/server/.env.production"
        exit 1
    fi

    log_success "依赖检查通过"
}

# 确认操作
confirm_operation() {
    echo
    log_warning "⚠️  警告: 即将修复生产环境数据库"
    log_warning "这将直接修改生产数据库中的资源URL"
    log_warning "请确保已经了解操作风险"
    echo

    read -p "确认要继续吗？(输入 'yes' 确认): " -r
    if [[ ! $REPLY == "yes" ]]; then
        log_info "操作已取消"
        exit 0
    fi
}

# 备份提醒
backup_reminder() {
    echo
    log_warning "📋 修复前检查清单:"
    log_warning "1. 已经通知相关人员此次维护"
    log_warning "2. 已经确认当前没有用户在上传资源"
    log_warning "3. 已经准备好回滚方案"
    echo

    read -p "确认已完成上述检查？(输入 'ready' 继续): " -r
    if [[ ! $REPLY == "ready" ]]; then
        log_info "请完成检查后再执行修复"
        exit 0
    fi
}

# 执行修复
run_fix() {
    log_info "开始执行URL修复..."

    cd "$PROJECT_ROOT"

    # 执行修复脚本
    if node scripts/database/fix-production-urls.js; then
        log_success "修复脚本执行完成"
        return 0
    else
        log_error "修复脚本执行失败"
        return 1
    fi
}

# 验证修复结果
verify_fix() {
    log_info "验证修复结果..."

    # 这里可以添加额外的验证逻辑
    # 比如通过API检查一些关键资源的URL

    log_info "建议手动验证以下内容:"
    echo "1. 访问 https://horsduroot.com/resources?category=theory"
    echo "2. 点击任意理论前沿资源详情页"
    echo "3. 检查右上角下载按钮是否正常工作"
    echo "4. 检查资源文件是否可以正常下载"
}

# 主函数
main() {
    echo "========================================"
    echo "    生产环境URL修复脚本"
    echo "========================================"
    echo

    # 检查依赖
    check_dependencies

    # 确认操作
    confirm_operation

    # 备份提醒
    backup_reminder

    # 执行修复
    if run_fix; then
        echo
        log_success "🎉 生产环境URL修复完成！"

        # 验证提醒
        verify_fix

        echo
        log_info "下一步: 执行开发环境修复"
        log_info "运行: ./scripts/database/fix-development-urls.sh"

    else
        echo
        log_error "修复失败，请查看错误信息并联系开发团队"
        exit 1
    fi
}

# 错误处理
trap 'log_error "脚本执行过程中发生错误，退出码: $?"' ERR

# 执行主函数
main "$@"
