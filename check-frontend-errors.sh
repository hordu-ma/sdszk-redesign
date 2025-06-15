#!/bin/bash

echo "🔍 检查资源中心前端错误..."
echo ""

# 检查API是否能正常响应
echo "1️⃣ API响应测试:"
api_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173/api/resources?status=published&page=1&limit=1")
echo "   • API状态码: $api_status"

if [ "$api_status" = "200" ]; then
    echo "   ✅ API响应正常"
    
    # 检查API数据结构
    api_response=$(curl -s "http://localhost:5173/api/resources?status=published&page=1&limit=1")
    has_data=$(echo "$api_response" | jq -r '.data | length')
    has_success=$(echo "$api_response" | jq -r '.status')
    
    echo "   • 数据条数: $has_data"
    echo "   • 响应状态: $has_success"
    
    if [ "$has_data" -gt 0 ] && [ "$has_success" = "success" ]; then
        echo "   ✅ API数据格式正确"
    else
        echo "   ❌ API数据格式异常"
    fi
else
    echo "   ❌ API响应异常"
fi

echo ""
echo "2️⃣ 前端页面测试:"
page_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173/resources")
echo "   • 页面状态码: $page_status"

if [ "$page_status" = "200" ]; then
    echo "   ✅ 前端页面正常"
else
    echo "   ❌ 前端页面异常"
fi

echo ""
echo "3️⃣ 分类页面测试:"
categories=("theory" "teaching" "video")
for category in "${categories[@]}"; do
    cat_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173/resources/$category")
    echo "   • /resources/$category: $cat_status"
done

echo ""
echo "📋 总结:"
echo "   如果API和页面状态码都是200，说明基础功能正常"
echo "   具体的JavaScript错误需要在浏览器开发者工具中查看"
echo ""
echo "💡 推荐操作:"
echo "   1. 打开 http://localhost:5173/resources"
echo "   2. 按F12打开开发者工具"
echo "   3. 查看Console面板的错误信息"
echo "   4. 查看Network面板的API请求状态"
