#!/bin/bash

# 阿里云部署完整检查脚本
# 用于诊断所有可能的问题

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

echo_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

echo_info "=== 阿里云部署完整检查脚本 ==="
echo_info "当前时间: $(date)"
echo_info "服务器信息: $(uname -a)"

# 1. 系统环境检查
echo_info "1. 系统环境检查..."
echo "操作系统: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'=' -f2 | tr -d '\"')"
echo "内核版本: $(uname -r)"
echo "CPU信息: $(nproc) 核心"
echo "内存信息: $(free -h | grep Mem | awk '{print $2}')"
echo "磁盘空间: $(df -h / | tail -1 | awk '{print $4}') 可用"

# 2. Node.js和npm检查
echo_info "2. Node.js环境检查..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo_success "Node.js版本: $NODE_VERSION"
    if [[ $NODE_VERSION < "v16" ]]; then
        echo_warning "建议使用Node.js 16或更高版本"
    fi
else
    echo_error "Node.js未安装！"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo_success "npm版本: $NPM_VERSION"
else
    echo_error "npm未安装！"
fi

# 3. 环境变量检查
echo_info "3. 环境变量检查..."
ENV_VARS=("MONGODB_URI" "JWT_SECRET" "FRONTEND_URL" "NODE_ENV")
for var in "${ENV_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        if [ "$var" = "MONGODB_URI" ] || [ "$var" = "JWT_SECRET" ]; then
            echo_success "$var: [已设置，长度：${#!var}]"
        else
            echo_success "$var: ${!var}"
        fi
    else
        echo_error "$var: 未设置"
    fi
done

# 4. 防火墙和端口检查
echo_info "4. 防火墙和端口检查..."
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(ufw status | head -1)
    echo "UFW状态: $UFW_STATUS"
fi

echo "端口3000监听状态:"
netstat -tlnp | grep ":3000" || echo "端口3000未被监听"

echo "所有监听端口:"
netstat -tlnp | grep LISTEN | head -10

# 5. 进程检查
echo_info "5. 进程检查..."
echo "Node.js进程:"
ps aux | grep node | grep -v grep || echo "没有运行中的Node.js进程"

if command -v pm2 &> /dev/null; then
    echo "PM2状态:"
    pm2 status
else
    echo_warning "PM2未安装"
fi

# 6. 项目文件检查
echo_info "6. 项目文件检查..."
if [ -f "app.js" ]; then
    echo_success "找到app.js"
else
    echo_error "未找到app.js文件"
fi

if [ -f "package.json" ]; then
    echo_success "找到package.json"
    echo "项目依赖："
    cat package.json | grep -A 10 '"dependencies"' | head -10
else
    echo_error "未找到package.json文件"
fi

# 7. 日志文件检查
echo_info "7. 日志文件检查..."
if [ -d "logs" ]; then
    echo_success "日志目录存在"
    echo "日志文件："
    ls -la logs/ 2>/dev/null || echo "日志目录为空"
else
    echo_warning "日志目录不存在，将创建"
    mkdir -p logs
fi

# 8. 上传目录检查
echo_info "8. 上传目录检查..."
if [ -d "uploads" ]; then
    echo_success "上传目录存在"
    echo "上传目录大小："
    du -sh uploads/ 2>/dev/null || echo "上传目录为空"
else
    echo_warning "上传目录不存在，将创建"
    mkdir -p uploads/documents uploads/images uploads/videos
fi

# 9. MongoDB连接测试
echo_info "9. MongoDB连接测试..."
if [ -n "$MONGODB_URI" ]; then
    if command -v mongosh &> /dev/null; then
        echo "使用mongosh测试连接..."
        timeout 10 mongosh "$MONGODB_URI" --eval "
            try {
                var result = db.adminCommand('ping');
                if (result.ok === 1) {
                    console.log('✓ MongoDB连接成功');
                    console.log('数据库名称:', db.getName());
                    console.log('用户集合统计:', db.users.countDocuments());
                } else {
                    console.log('✗ MongoDB ping失败');
                }
            } catch (e) {
                console.log('✗ MongoDB连接错误:', e.message);
            }
        " --quiet 2>/dev/null || echo_error "MongoDB连接超时或失败"
    elif command -v mongo &> /dev/null; then
        echo "使用mongo客户端测试连接..."
        timeout 10 mongo "$MONGODB_URI" --eval "
            try {
                var result = db.adminCommand('ping');
                if (result.ok === 1) {
                    print('✓ MongoDB连接成功');
                    print('数据库名称:', db.getName());
                } else {
                    print('✗ MongoDB ping失败');
                }
            } catch (e) {
                print('✗ MongoDB连接错误:', e.message);
            }
        " --quiet 2>/dev/null || echo_error "MongoDB连接超时或失败"
    else
        echo_warning "未找到MongoDB客户端工具，跳过连接测试"
    fi
else
    echo_error "MONGODB_URI未设置，无法测试连接"
fi

# 10. API健康检查
echo_info "10. API健康检查..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)
    echo_success "健康检查API响应："
    echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo_error "健康检查API无响应"
fi

# 11. 系统资源使用情况
echo_info "11. 系统资源使用情况..."
echo "CPU使用率："
top -bn1 | grep "Cpu(s)" || echo "无法获取CPU使用率"

echo "内存使用情况："
free -h

echo "磁盘使用情况："
df -h

echo "负载平均值："
uptime

# 12. 网络连接检查
echo_info "12. 网络连接检查..."
echo "活动的网络连接："
netstat -an | grep ESTABLISHED | wc -l
echo "等待连接："
netstat -an | grep LISTEN | wc -l

# 13. 安全检查
echo_info "13. 安全检查..."
echo "开放端口："
netstat -tlnp | grep LISTEN | awk '{print $4}' | cut -d: -f2 | sort -n | uniq

# 14. 服务重启建议
echo_info "14. 服务管理建议..."
echo "如需重启服务，请执行："
echo "1. pm2 restart sdszk-backend  # 如果使用PM2"
echo "2. 或者: pkill -f 'node.*app.js' && npm start"
echo "3. 检查日志: pm2 logs sdszk-backend"

echo_info "=== 检查完成 ==="
echo_warning "如果发现问题，请根据上述输出进行相应修复"
