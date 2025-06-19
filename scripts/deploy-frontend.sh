#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}       前端部署到阿里云ECS服务器        ${NC}"
echo -e "${YELLOW}=========================================${NC}"

# 本地构建
echo -e "${YELLOW}1. 开始构建前端应用...${NC}"
npm run build -- --mode aliyun

if [ $? -ne 0 ]; then
  echo -e "${RED}构建失败，请检查错误信息${NC}"
  exit 1
fi

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
