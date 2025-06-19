#!/bin/bash

# 前端构建和部署脚本 - 使用正确的生产环境配置

ALIYUN_HOST="60.205.124.67"
ALIYUN_USER="root"

echo "=== 前端构建和部署脚本 ==="

echo "1. 清理旧的构建文件..."
rm -rf dist

echo "2. 使用生产环境配置构建前端..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败！"
    exit 1
fi

echo "✅ 前端构建成功！"

echo -e "${GREEN}构建成功!${NC}"

# 打包前端文件
echo -e "${YELLOW}2. 打包前端文件...${NC}"
cd dist
zip -r ../frontend-deploy.zip *
cd ..

echo -e "${GREEN}前端打包完成: frontend-deploy.zip${NC}"

# 输出部署指南
echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}       部署指南       ${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo -e "${GREEN}1. 上传 frontend-deploy.zip 到阿里云服务器${NC}"
echo -e "${GREEN}2. 在阿里云服务器上解压: unzip frontend-deploy.zip -d /var/www/sdszk-frontend${NC}"
echo -e "${GREEN}3. 确保Nginx已配置正确指向此目录${NC}"
echo -e "${GREEN}4. 如需要，重启Nginx: systemctl restart nginx${NC}"
echo -e "${YELLOW}=========================================${NC}"

echo -e "${GREEN}前端部署包已准备就绪!${NC}"
