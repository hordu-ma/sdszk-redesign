#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示带颜色的消息
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

echo_section() {
    echo -e "\n${BLUE}==================== $1 ====================${NC}"
}

# 检查是否在项目根目录
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo_error "请在项目根目录运行此脚本"
    exit 1
fi

echo_section "山东省思政课一体化中心 - 项目清理脚本"
echo_info "开始时间: $(date)"

# 显示清理前的磁盘使用情况
echo_section "清理前磁盘使用情况"
du -sh * | sort -hr | head -10

# 备份重要文件
echo_section "备份重要文件"
if [ ! -d ".cleanup-backup" ]; then
    mkdir -p .cleanup-backup
    echo_success "创建备份目录: .cleanup-backup"
fi

# 1. 清理构建输出和临时文件
echo_section "清理构建输出和临时文件"

echo_info "清理前端构建输出..."
if [ -d "dist" ]; then
    rm -rf dist
    echo_success "删除 dist/ 目录"
else
    echo_warning "dist/ 目录不存在，跳过"
fi

echo_info "清理后端构建输出..."
if [ -d "server-dist" ]; then
    rm -rf server-dist
    echo_success "删除 server-dist/ 目录"
else
    echo_warning "server-dist/ 目录不存在，跳过"
fi

echo_info "清理部署包..."
if [ -f "server-deploy.zip" ]; then
    rm -f server-deploy.zip
    echo_success "删除 server-deploy.zip"
else
    echo_warning "server-deploy.zip 不存在，跳过"
fi

# 2. 清理测试覆盖率报告
echo_section "清理测试相关文件"

if [ -d "coverage" ]; then
    rm -rf coverage
    echo_success "删除 coverage/ 目录"
fi

if [ -d ".nyc_output" ]; then
    rm -rf .nyc_output
    echo_success "删除 .nyc_output/ 目录"
fi

if [ -d "playwright-report" ]; then
    echo_warning "保留 playwright-report/ (可能包含重要测试结果)"
fi

# 3. 清理备份文件
echo_section "清理备份文件"

echo_info "清理 .backup 文件..."
find . -name "*.backup" -type f -delete 2>/dev/null && echo_success "删除 *.backup 文件"

echo_info "清理 .bak 文件..."
find . -name "*.bak" -type f -delete 2>/dev/null && echo_success "删除 *.bak 文件"
find . -name "*.bak[0-9]" -type f -delete 2>/dev/null && echo_success "删除 *.bak[0-9] 文件"

echo_info "清理 .orig 文件..."
find . -name "*.orig" -type f -delete 2>/dev/null && echo_success "删除 *.orig 文件"

echo_info "清理临时编辑器文件..."
find . -name "*~" -type f -delete 2>/dev/null && echo_success "删除编辑器临时文件"
find . -name "*.tmp" -type f -delete 2>/dev/null && echo_success "删除 *.tmp 文件"
find . -name "*.temp" -type f -delete 2>/dev/null && echo_success "删除 *.temp 文件"

# 4. 清理系统文件
echo_section "清理系统文件"

echo_info "清理 macOS 系统文件..."
find . -name ".DS_Store" -type f -delete 2>/dev/null && echo_success "删除 .DS_Store 文件"
find . -name "._*" -type f -delete 2>/dev/null && echo_success "删除 ._* 文件"

echo_info "清理 Windows 系统文件..."
find . -name "Thumbs.db" -type f -delete 2>/dev/null && echo_success "删除 Thumbs.db 文件"

# 5. 清理日志文件
echo_section "清理日志文件"

echo_info "清理诊断日志..."
find . -name "backend-diagnosis-*.log" -type f -delete 2>/dev/null && echo_success "删除诊断日志文件"

echo_info "清理性能报告..."
find . -name "performance-report.txt" -type f -delete 2>/dev/null && echo_success "删除性能报告"
find . -name "pinia-persistence-report.json" -type f -delete 2>/dev/null && echo_success "删除Pinia持久化报告"

echo_info "清理Redis dump文件..."
find . -name "dump.rdb" -type f -delete 2>/dev/null && echo_success "删除Redis dump文件"

# 6. 清理数据库备份（保留最新3个）
echo_section "清理数据库备份"

if [ -d "database-backups" ]; then
    echo_info "清理旧的数据库备份（保留最新3个）..."
    cd database-backups

    # 清理生产备份
    ls -t production-backup-* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null
    ls -t production-full-backup-* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null

    # 清理本地导出
    ls -t local-export-* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null
    ls -t local-full-export-* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null

    # 清理同步备份
    ls -t sync-* 2>/dev/null | grep -v "sync-current" | tail -n +4 | xargs rm -rf 2>/dev/null

    cd ..
    echo_success "数据库备份清理完成"
else
    echo_warning "database-backups/ 目录不存在，跳过"
fi

# 7. 清理缓存目录
echo_section "清理缓存目录"

if [ -d ".cache" ]; then
    rm -rf .cache
    echo_success "删除 .cache/ 目录"
fi

if [ -d ".temp" ]; then
    rm -rf .temp
    echo_success "删除 .temp/ 目录"
fi

if [ -d ".tmp" ]; then
    rm -rf .tmp
    echo_success "删除 .tmp/ 目录"
fi

# 8. 清理 node_modules 中的缓存（可选）
echo_section "清理依赖缓存"

echo_warning "是否清理 node_modules 缓存？这将重新安装所有依赖 (y/N)"
read -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "node_modules" ]; then
        rm -rf node_modules package-lock.json
        echo_success "删除 node_modules/ 和 package-lock.json"
        echo_info "请运行 'npm install' 重新安装依赖"
    fi

    if [ -d "server/node_modules" ]; then
        rm -rf server/node_modules server/package-lock.json
        echo_success "删除 server/node_modules/ 和 server/package-lock.json"
        echo_info "请运行 'cd server && npm install' 重新安装后端依赖"
    fi
else
    echo_info "跳过 node_modules 清理"
fi

# 9. 验证 .gitignore
echo_section "验证 .gitignore 配置"

if [ -f ".gitignore" ]; then
    echo_success ".gitignore 文件存在"

    # 检查关键忽略项
    missing_patterns=()

    if ! grep -q "node_modules" .gitignore; then
        missing_patterns+=("node_modules")
    fi

    if ! grep -q "dist/" .gitignore; then
        missing_patterns+=("dist/")
    fi

    if ! grep -q "server-dist/" .gitignore; then
        missing_patterns+=("server-dist/")
    fi

    if ! grep -q "*.backup" .gitignore; then
        missing_patterns+=("*.backup")
    fi

    if [ ${#missing_patterns[@]} -gt 0 ]; then
        echo_warning "建议在 .gitignore 中添加以下模式："
        printf '%s\n' "${missing_patterns[@]}"
    else
        echo_success ".gitignore 配置完整"
    fi
else
    echo_error ".gitignore 文件不存在，建议创建"
fi

# 10. 显示清理结果
echo_section "清理完成 - 磁盘使用情况"
du -sh * | sort -hr | head -10

# 11. 统计清理效果
echo_section "清理统计"

echo_info "清理的文件类型统计："
echo "- 构建输出: dist/, server-dist/, *.zip"
echo "- 备份文件: *.backup, *.bak*, *.orig"
echo "- 临时文件: *.tmp, *.temp, *~"
echo "- 系统文件: .DS_Store, Thumbs.db, ._*"
echo "- 日志文件: *.log, dump.rdb"
echo "- 缓存目录: .cache/, .temp/, .tmp/"

echo_section "建议的后续操作"

echo_info "1. 提交 .gitignore 更新:"
echo "   git add .gitignore"
echo "   git commit -m 'chore: 更新.gitignore，忽略临时文件和构建输出'"

echo_info "2. 如果清理了 node_modules，重新安装依赖:"
echo "   npm install"
echo "   cd server && npm install"

echo_info "3. 运行测试确保项目正常:"
echo "   npm run dev"
echo "   npm run server:dev"

echo_info "4. 定期运行此脚本保持项目整洁"

echo_success "项目清理完成！ 🎉"
echo_info "完成时间: $(date)"

# 清理备份目录（如果为空）
if [ -d ".cleanup-backup" ] && [ -z "$(ls -A .cleanup-backup)" ]; then
    rmdir .cleanup-backup
    echo_info "删除空的备份目录"
fi
