#!/bin/bash

echo "🧹 CMS项目文件清理工具"
echo "========================="
echo "清理测试过程中产生的临时文件，保留重要文档和配置"
echo ""

# 进入项目根目录
cd "$(dirname "$0")"

# 要删除的文件列表
TO_DELETE=(
    # 临时调试脚本和页面
    "debug-admin-complete.js"
    "debug-frontend.js"
    "debug-news-api.html"
    "test-api.js"
    "test-auth.js"
    "test-fix.js"
    "test-news-structure.js"
    "verify-news-fix.html"
    
    # 网络诊断工具（问题已解决）
    "cms-network-diagnostic.html"
    "cms-network-monitor.html"
    
    # 已完成的过程报告
    "FIELD_MAPPING_FIX_REPORT.md"
    "NEWS_LIST_DEBUG_REPORT.md"
    "NEWS_LIST_FIX_VERIFICATION_REPORT.md"
    "ADMIN_NEWS_LIST_DEBUG_GUIDE.md"
    "CMS_NEWS_LIST_FINAL_VERIFICATION_GUIDE.md"
    "NEWS_DRAFT_DISPLAY_FIX_REPORT.md"
    "FRONTEND_FIX_REPORT.md"
    "SYNTAX_FIXES_REPORT.md"
    
    # 重复或临时的测试报告
    "CMS_BROWSER_TEST_GUIDE.md"
    "CMS_QUICK_TEST_GUIDE.md"
    "CMS_TESTING_EXECUTION_REPORT.md"
    "test-execution-report.md"
    "testing-guide.md"
    "FRONTEND_TEST_CHECKLIST.md"
    "CLEANUP_REPORT.md"
)

echo "📋 将要删除的文件："
echo "==================="

# 检查文件是否存在并显示
deleted_count=0
for file in "${TO_DELETE[@]}"; do
    if [ -f "$file" ]; then
        echo "  ❌ $file"
        deleted_count=$((deleted_count + 1))
    else
        echo "  ⚠️  $file (不存在)"
    fi
done

echo ""
echo "📊 统计信息："
echo "  - 计划删除: ${#TO_DELETE[@]} 个文件"
echo "  - 实际存在: $deleted_count 个文件"
echo ""

# 询问用户确认
read -p "❓ 确认删除这些文件吗？(y/N): " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    echo ""
    echo "🗑️  开始删除文件..."
    
    actual_deleted=0
    for file in "${TO_DELETE[@]}"; do
        if [ -f "$file" ]; then
            rm "$file"
            echo "  ✅ 已删除: $file"
            actual_deleted=$((actual_deleted + 1))
        fi
    done
    
    echo ""
    echo "✨ 清理完成！"
    echo "  - 成功删除: $actual_deleted 个文件"
    
    # 显示保留的重要文件
    echo ""
    echo "📝 保留的重要文件："
    echo "=================="
    echo "  📚 项目文档:"
    echo "    - README.md"
    echo "    - PROJECT_ANALYSIS_AND_PLAN.md"
    echo "    - PROJECT_DOCS_INDEX.md"
    echo "    - DEPLOYMENT_GUIDE.md"
    echo ""
    echo "  🔧 重要报告:"
    echo "    - API_FIXES_REPORT.md"
    echo "    - CMS_NETWORK_ERROR_FIX_REPORT.md"
    echo "    - OPTIMIZATION_COMPLETE_REPORT.md"
    echo ""
    echo "  📋 测试计划:"
    echo "    - CMS_TESTING_PLAN.md"
    echo "    - CMS_FUNCTIONAL_TEST_CHECKLIST.md"
    echo ""
    echo "  ⚙️  配置文件:"
    echo "    - package.json"
    echo "    - vite.config.ts"
    echo "    - tsconfig.json"
    echo "    - docker-compose.prod.yml"
    echo "    - nginx.conf"
    echo ""
    echo "  🚀 部署脚本:"
    echo "    - scripts/deploy.sh"
    echo "    - scripts/deploy-prod.sh"
    echo "    - scripts/monitor.sh"
    
else
    echo ""
    echo "❌ 取消清理操作"
    echo ""
fi

echo ""
echo "📁 下一步建议："
echo "==============="
echo "1. 使用 CMS_FUNCTIONAL_TEST_CHECKLIST.md 进行全面功能测试"
echo "2. 查看 CMS_TESTING_PLAN.md 了解测试策略"
echo "3. 参考 DEPLOYMENT_GUIDE.md 进行生产部署"
echo "4. 使用保留的监控脚本进行系统监控"
echo ""
