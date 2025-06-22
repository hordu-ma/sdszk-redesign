#!/bin/bash

# Nginx 配置部署脚本
#
# 功能:
# 1. 将本地的 nginx-ssl.conf 安全地复制到生产服务器。
# 2. 在服务器上执行 Nginx 配置语法检查。
# 3. 如果语法正确，则平滑重载 Nginx 服务以应用新配置。
#
# 使用方法:
# 确保此脚本有执行权限: chmod +x ./scripts/deploy-nginx.sh
# 然后运行: ./scripts/deploy-nginx.sh

# --- 配置 ---
# 服务器信息 (从 辅助开发上下文指南.md 获取)
SERVER_USER="root"
SERVER_IP="60.205.124.67"

# 本地配置文件路径
LOCAL_CONFIG_PATH="./nginx-ssl.conf"

# 服务器端配置文件路径 (根据服务器实际情况确认)
# 经过 `ssh` 验证，正确的路径是 /etc/nginx/sites-available/sdszk
REMOTE_CONFIG_PATH="/etc/nginx/sites-available/sdszk"

# --- 脚本开始 ---
set -e # 任何命令失败则立即退出

echo "🚀 开始部署 Nginx 配置..."

# 步骤 1: 复制配置文件到服务器
echo "1/3: 正在将本地配置 ${LOCAL_CONFIG_PATH} 复制到 ${SERVER_USER}@${SERVER_IP}:${REMOTE_CONFIG_PATH}..."
scp "${LOCAL_CONFIG_PATH}" "${SERVER_USER}@${SERVER_IP}:${REMOTE_CONFIG_PATH}"
echo "✅ 复制完成。"

# 步骤 2: 在服务器上测试 Nginx 配置
echo "2/3: 正在服务器上执行 'nginx -t' 进行语法检查..."
ssh "${SERVER_USER}@${SERVER_IP}" "nginx -t"
echo "✅ 语法检查通过。"

# 步骤 3: 平滑重载 Nginx 服务
echo "3/3: 正在执行 'sudo systemctl reload nginx' 以应用新配置..."
ssh "${SERVER_USER}@${SERVER_IP}" "sudo systemctl reload nginx"
echo "🎉 Nginx 配置部署成功！"

exit 0
