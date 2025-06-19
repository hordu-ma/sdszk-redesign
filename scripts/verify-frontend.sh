#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 显示带颜色的消息
echo_success() {
    echo -e "${GREEN}$1${NC}"
}

echo_error() {
    echo -e "${RED}$1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}$1${NC}"
}

# 服务器信息
read -p "请输入服务器用户名 [root]: " SERVER_USER
SERVER_USER=${SERVER_USER:-root}

read -p "请输入服务器IP: " SERVER_IP
while [ -z "$SERVER_IP" ]; do
    echo_error "服务器IP不能为空!"
    read -p "请输入服务器IP: " SERVER_IP
done

echo_success "====== 全面检查前端渲染状态 ======"

# 1. 检查前端HTML和资源加载
echo_success "\n[1. 检查前端HTML和资源]"
curl -s http://$SERVER_IP/ | grep -o "<title>.*</title>" || echo_error "未找到页面标题"
curl -s http://$SERVER_IP/ | grep -o "assets/js/.*\.js" | head -1 || echo_error "未找到JS资源"
curl -s http://$SERVER_IP/ | grep -o "assets/css/.*\.css" | head -1 || echo_error "未找到CSS资源"

# 2. 检查API响应
echo_success "\n[2. 检查API响应]"
echo "新闻分类API:"
curl -s http://$SERVER_IP/api/news-categories | grep -o '"name":"[^"]*"' || echo_error "未找到新闻分类数据"

echo "新闻列表API:"
curl -s http://$SERVER_IP/api/news | grep -o '"title":"[^"]*"' | head -3 || echo_error "未找到新闻数据"

# 3. 使用无头浏览器检查页面渲染 (如果服务器上安装了Puppeteer/Playwright)
echo_success "\n[3. 页面渲染检查]"
echo_warning "注意: 这部分需要在浏览器中手动验证。请访问 http://$SERVER_IP/ 并检查:"
echo_warning "  - 页面布局是否正确"
echo_warning "  - 导航菜单是否显示"
echo_warning "  - 新闻列表是否加载"
echo_warning "  - 点击新闻是否能正常跳转到详情页"

# 4. 检查浏览器控制台错误（需要手动）
echo_success "\n[4. 浏览器控制台检查]"
echo_warning "请在浏览器中打开开发者工具(F12)，检查控制台是否有错误。"

# 5. 总结
echo_success "\n====== 检查总结 ======"
echo "以上自动检查只能验证基本功能，完整的前端体验需要通过浏览器访问 http://$SERVER_IP/ 进行人工确认。"
echo "建议检查的内容:"
echo "1. 首页新闻列表加载"
echo "2. 分类导航正常工作"
echo "3. 新闻详情页正常显示"
echo "4. 搜索功能正常工作"
echo "5. 资源下载正常工作"
echo "6. 响应式布局在不同设备上的表现"
