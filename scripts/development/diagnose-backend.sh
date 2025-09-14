#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示带颜色的消息
echo_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo_section() {
    echo -e "\n${BLUE}==================== $1 ====================${NC}"
}

# 检查是否为root用户
if [[ $EUID -ne 0 ]]; then
   echo_error "此脚本需要root权限运行"
   exit 1
fi

echo_section "山东省思政课一体化中心 - 后端服务诊断工具"
echo_info "开始时间: $(date)"
echo_info "服务器: $(hostname) ($(hostname -I | awk '{print $1}'))"

# ==================== 第一步：基础状态检查 ====================
echo_section "第一步：基础状态检查"

echo_info "1.1 PM2进程状态:"
pm2 status
echo ""

echo_info "1.2 sdszk-backend进程详情:"
pm2 show sdszk-backend 2>/dev/null || echo_error "sdszk-backend进程不存在"
echo ""

echo_info "1.3 端口3000占用情况:"
netstat -tlnp | grep :3000 || echo_warning "端口3000未被占用"
echo ""

echo_info "1.4 所有Node.js进程:"
ps aux | grep node | grep -v grep || echo_warning "未发现Node.js进程"
echo ""

# ==================== 第二步：应用目录检查 ====================
echo_section "第二步：应用目录检查"

DEPLOY_PATH="/var/www/sdszk-backend"

echo_info "2.1 部署目录检查:"
if [ -d "$DEPLOY_PATH" ]; then
    echo_success "部署目录存在: $DEPLOY_PATH"
    ls -la $DEPLOY_PATH/
else
    echo_error "部署目录不存在: $DEPLOY_PATH"
fi
echo ""

echo_info "2.2 关键文件检查:"
for file in "app.js" ".env" "package.json"; do
    if [ -f "$DEPLOY_PATH/$file" ]; then
        echo_success "$file 存在"
        ls -la "$DEPLOY_PATH/$file"
    else
        echo_error "$file 缺失"
    fi
done
echo ""

echo_info "2.3 node_modules目录:"
if [ -d "$DEPLOY_PATH/node_modules" ]; then
    module_count=$(ls -1 "$DEPLOY_PATH/node_modules" | wc -l)
    echo_success "node_modules存在，包含 $module_count 个模块"
else
    echo_error "node_modules目录缺失"
fi
echo ""

# ==================== 第三步：环境配置验证 ====================
echo_section "第三步：环境配置验证"

echo_info "3.1 Node.js和npm版本:"
node --version
npm --version
echo ""

echo_info "3.2 环境配置文件检查:"
if [ -f "$DEPLOY_PATH/.env" ]; then
    echo_success ".env文件存在"
    echo_info "文件大小: $(stat -c%s "$DEPLOY_PATH/.env") bytes"
    echo_info "文件权限: $(stat -c%A "$DEPLOY_PATH/.env")"
    echo_info "环境变量行数: $(wc -l < "$DEPLOY_PATH/.env")"
    echo_warning "前5行内容预览 (隐藏敏感信息):"
    head -5 "$DEPLOY_PATH/.env" | sed 's/=.*/=***HIDDEN***/'
else
    echo_error ".env文件缺失"
fi
echo ""

echo_info "3.3 测试dotenv加载:"
cd $DEPLOY_PATH
node -e "
try {
    require('dotenv').config();
    console.log('✅ dotenv加载成功');
    console.log('PORT:', process.env.PORT || 'undefined');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
} catch(e) {
    console.log('❌ dotenv加载失败:', e.message);
}
" 2>/dev/null || echo_error "无法执行dotenv测试"
echo ""

# ==================== 第四步：日志分析 ====================
echo_section "第四步：日志分析"

echo_info "4.1 PM2日志 (最近50行):"
pm2 logs sdszk-backend --lines 50 --nostream 2>/dev/null || echo_warning "无法获取PM2日志"
echo ""

echo_info "4.2 PM2错误日志 (最近20行):"
pm2 logs sdszk-backend --err --lines 20 --nostream 2>/dev/null || echo_warning "无法获取PM2错误日志"
echo ""

echo_info "4.3 Nginx错误日志 (最近20行):"
if [ -f "/var/log/nginx/sdszk.error.log" ]; then
    tail -20 /var/log/nginx/sdszk.error.log
else
    echo_warning "Nginx错误日志文件不存在"
fi
echo ""

echo_info "4.4 系统日志中的PM2相关信息:"
journalctl -u pm2-root --since "1 hour ago" --no-pager -n 10 2>/dev/null || echo_warning "无法获取系统日志"
echo ""

# ==================== 第五步：数据库连接检查 ====================
echo_section "第五步：数据库连接检查"

echo_info "5.1 MongoDB服务状态:"
systemctl status mongod --no-pager -l
echo ""

echo_info "5.2 MongoDB进程:"
ps aux | grep mongod | grep -v grep || echo_warning "未找到MongoDB进程"
echo ""

echo_info "5.3 测试MongoDB连接:"
mongosh --quiet --eval "
try {
    var result = db.adminCommand('ismaster');
    print('✅ MongoDB连接成功');
    print('服务器版本:', db.version());
    print('当前数据库:', db.getName());
} catch(e) {
    print('❌ MongoDB连接失败:', e.message);
}
" 2>/dev/null || echo_error "无法连接到MongoDB"
echo ""

# ==================== 第六步：网络和服务检查 ====================
echo_section "第六步：网络和服务检查"

echo_info "6.1 本地API健康检查:"
curl -s -I http://localhost:3000/api/health 2>/dev/null || echo_error "本地API健康检查失败"
echo ""

echo_info "6.2 本地API数据测试:"
curl -s http://localhost:3000/api/news-categories 2>/dev/null | head -200 || echo_error "本地API数据测试失败"
echo ""

echo_info "6.3 Nginx服务状态:"
systemctl status nginx --no-pager -l
echo ""

echo_info "6.4 防火墙状态:"
ufw status 2>/dev/null || echo_info "UFW未安装或未启用"
echo ""

# ==================== 第七步：手动启动测试 ====================
echo_section "第七步：手动启动测试建议"

echo_warning "如果上述检查发现问题，建议执行以下手动测试:"
echo_info "1. 停止PM2进程: pm2 stop sdszk-backend"
echo_info "2. 进入应用目录: cd $DEPLOY_PATH"
echo_info "3. 手动启动应用: node app.js"
echo_info "4. 观察启动过程中的错误信息"
echo_info "5. 如果成功启动，按Ctrl+C停止，然后执行: pm2 restart sdszk-backend"
echo ""

# ==================== 诊断总结 ====================
echo_section "诊断总结"

echo_info "诊断完成时间: $(date)"
echo_warning "请将以上诊断结果提供给技术支持人员进行分析"

# 生成诊断报告文件
REPORT_FILE="/tmp/backend-diagnosis-$(date +%Y%m%d_%H%M%S).log"
echo_info "诊断报告已保存至: $REPORT_FILE"

# 将输出重定向到报告文件（重新执行一遍，但输出到文件）
$0 > "$REPORT_FILE" 2>&1 &
