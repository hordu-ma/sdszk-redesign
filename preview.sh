#!/bin/sh

# sdszk-redesign项目的预览脚本
# 此脚本会使用正确的基础路径构建和预览项目

# 清空之前的构建
rm -rf dist

# 使用预览模式进行构建
echo "使用预览模式构建项目..."
npm run build:preview

# 启动预览服务器
echo "启动预览服务器..."
npm run preview

# 完成后提示
echo "预览服务已启动，请打开浏览器访问 http://localhost:4173"
