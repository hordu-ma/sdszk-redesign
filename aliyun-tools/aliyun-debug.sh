#!/bin/bash

# 阿里云服务器调试脚本
# 用于收集登录401问题的调试信息

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo_info "=== 阿里云服务器登录问题调试脚本 ==="
echo_info "当前时间: $(date)"

# 1. 检查Node.js和npm版本
echo_info "1. 检查Node.js环境..."
echo "Node.js版本: $(node --version 2>/dev/null || echo '未安装')"
echo "npm版本: $(npm --version 2>/dev/null || echo '未安装')"

# 2. 检查服务器运行状态
echo_info "2. 检查服务器运行状态..."
if pgrep -f "node.*app.js" > /dev/null; then
    echo_success "后端服务正在运行"
    echo "进程信息:"
    ps aux | grep "node.*app.js" | grep -v grep
else
    echo_error "后端服务未运行"
fi

# 3. 检查端口占用
echo_info "3. 检查端口占用..."
netstat -tlnp | grep ":3000" || echo "端口3000未被占用"

# 4. 检查环境变量
echo_info "4. 检查环境变量..."
echo "MONGODB_URI: ${MONGODB_URI:-'未设置'}"
echo "JWT_SECRET: ${JWT_SECRET:-'未设置'}"
echo "FRONTEND_URL: ${FRONTEND_URL:-'未设置'}"
echo "NODE_ENV: ${NODE_ENV:-'未设置'}"

# 5. 检查MongoDB连接
echo_info "5. 检查MongoDB连接..."
if command -v mongosh &> /dev/null; then
    echo "使用mongosh测试连接..."
    mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')" 2>/dev/null && echo_success "MongoDB连接正常" || echo_error "MongoDB连接失败"
elif command -v mongo &> /dev/null; then
    echo "使用mongo测试连接..."
    mongo "$MONGODB_URI" --eval "db.adminCommand('ping')" 2>/dev/null && echo_success "MongoDB连接正常" || echo_error "MongoDB连接失败"
else
    echo_warning "未找到MongoDB客户端工具"
fi

# 6. 检查admin用户
echo_info "6. 检查admin用户数据..."
if command -v mongosh &> /dev/null; then
    mongosh "$MONGODB_URI" --eval "
        const adminUser = db.users.findOne({username: 'admin'});
        if (adminUser) {
            console.log('Admin用户存在:');
            console.log('ID:', adminUser._id);
            console.log('用户名:', adminUser.username);
            console.log('邮箱:', adminUser.email);
            console.log('角色:', adminUser.role);
            console.log('激活状态:', adminUser.isActive);
            console.log('密码哈希:', adminUser.password ? '已设置' : '未设置');
        } else {
            console.log('ERROR: 未找到admin用户');
        }
    " 2>/dev/null || echo_error "无法查询admin用户"
elif command -v mongo &> /dev/null; then
    mongo "$MONGODB_URI" --eval "
        var adminUser = db.users.findOne({username: 'admin'});
        if (adminUser) {
            print('Admin用户存在:');
            print('ID:', adminUser._id);
            print('用户名:', adminUser.username);
            print('邮箱:', adminUser.email);
            print('角色:', adminUser.role);
            print('激活状态:', adminUser.isActive);
            print('密码哈希:', adminUser.password ? '已设置' : '未设置');
        } else {
            print('ERROR: 未找到admin用户');
        }
    " 2>/dev/null || echo_error "无法查询admin用户"
fi

# 7. 测试登录API
echo_info "7. 测试登录API..."
API_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' \
    http://localhost:3000/api/auth/login 2>/dev/null)

if [ $? -eq 0 ]; then
    HTTP_CODE=$(echo "$API_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    RESPONSE_BODY=$(echo "$API_RESPONSE" | sed '/HTTP_CODE/d')
    
    echo "HTTP状态码: $HTTP_CODE"
    echo "响应内容: $RESPONSE_BODY"
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo_success "登录API测试成功"
    else
        echo_error "登录API返回错误状态码: $HTTP_CODE"
    fi
else
    echo_error "无法连接到登录API"
fi

# 8. 检查日志文件
echo_info "8. 检查应用日志..."
if [ -f "logs/app.log" ]; then
    echo "最近的应用日志:"
    tail -20 logs/app.log
elif [ -f "app.log" ]; then
    echo "最近的应用日志:"
    tail -20 app.log
else
    echo_warning "未找到日志文件"
fi

# 9. 检查错误日志
echo_info "9. 检查错误日志..."
if [ -f "logs/error.log" ]; then
    echo "最近的错误日志:"
    tail -20 logs/error.log
elif [ -f "error.log" ]; then
    echo "最近的错误日志:"
    tail -20 error.log
else
    echo_warning "未找到错误日志文件"
fi

# 10. 系统资源检查
echo_info "10. 检查系统资源..."
echo "内存使用情况:"
free -h
echo ""
echo "磁盘使用情况:"
df -h
echo ""
echo "CPU负载:"
uptime

echo_info "=== 调试信息收集完成 ==="
echo_warning "请将以上信息发送给开发人员进行分析"
