#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 确保脚本在错误时退出
set -e

# 显示部署信息
echo_warning "准备部署到GitHub Pages..."
echo_warning "注意：此脚本将使用CORS代理解决跨域问题"

# 确保环境变量文件存在
if [ ! -f ".env.github-pages" ]; then
    echo_error "找不到GitHub Pages环境配置文件 .env.github-pages"
    exit 1
fi

# 显示环境变量配置
echo_warning "GitHub Pages环境配置:"
cat .env.github-pages

# 使用GitHub Pages特定的环境变量构建前端项目
echo_success "开始构建GitHub Pages专用版本..."
npx vite build --config vite.config.gh-pages.ts --mode github-pages

# 创建部署目录
DEPLOY_DIR="dist"
if [ ! -d "$DEPLOY_DIR" ]; then
    echo_error "构建目录不存在！"
    exit 1
fi

# 进入构建目录
cd $DEPLOY_DIR

# 创建.nojekyll文件（避免GitHub Pages忽略以下划线开头的文件）
touch .nojekyll

# 创建404.html（解决GitHub Pages单页应用刷新问题）
cp index.html 404.html

# 初始化git仓库
git init
git checkout -b gh-pages || git checkout gh-pages
git rm -rf . || true  # 清空现有内容（如果有）

# 添加所有文件
git add .

# 提交更改
git commit -m "Deploy to GitHub Pages"

# 推送到GitHub Pages
echo_warning "即将推送到GitHub Pages..."
# 添加或更新远程仓库
git remote remove origin 2>/dev/null || true
git remote add origin git@github.com:hordu-ma/sdszk-redesign.git

# 强制推送到gh-pages分支
git push -f origin gh-pages

echo_success "成功部署到GitHub Pages!"
echo_success "网站应该很快就能在 https://hordu-ma.github.io/sdszk-redesign/ 访问"
echo_warning "注意：如果API请求仍有问题，请检查CORS代理服务是否正常工作"
