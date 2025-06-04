#!/bin/bash

# 性能监控和健康检查脚本
set -e

LOG_FILE="/tmp/sdszk-monitor.log"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90

echo "🔍 山东省思政教育平台 - 系统监控报告" | tee $LOG_FILE
echo "监控时间: $(date)" | tee -a $LOG_FILE
echo "================================================" | tee -a $LOG_FILE

# 检查Docker服务状态
echo "📦 Docker服务状态:" | tee -a $LOG_FILE
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Docker服务运行正常" | tee -a $LOG_FILE
    docker-compose -f docker-compose.prod.yml ps | tee -a $LOG_FILE
else
    echo "❌ Docker服务异常" | tee -a $LOG_FILE
    exit 1
fi

# 应用健康检查
echo -e "\n🏥 应用健康检查:" | tee -a $LOG_FILE
if curl -s -f http://localhost:3000/api/health > /dev/null; then
    echo "✅ 应用服务健康" | tee -a $LOG_FILE
    
    # API响应时间测试
    api_response_time=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:3000/api/health)
    echo "📊 API响应时间: ${api_response_time}s" | tee -a $LOG_FILE
    
    if (( $(echo "$api_response_time > 2.0" | bc -l) )); then
        echo "⚠️  API响应时间较慢" | tee -a $LOG_FILE
    fi
else
    echo "❌ 应用服务不可用" | tee -a $LOG_FILE
    exit 1
fi

# 系统资源监控
echo -e "\n💻 系统资源使用情况:" | tee -a $LOG_FILE

# CPU使用率
cpu_usage=$(top -l 1 | awk '/CPU usage/ {print $3}' | sed 's/%//')
echo "🔥 CPU使用率: ${cpu_usage}%" | tee -a $LOG_FILE
if (( $(echo "$cpu_usage > $ALERT_THRESHOLD_CPU" | bc -l) )); then
    echo "⚠️  CPU使用率过高!" | tee -a $LOG_FILE
fi

# 内存使用率
memory_info=$(vm_stat | perl -ne '/page size of (\d+)/ and $size=$1; /Pages\s+([^:]+):\s+(\d+)/ and printf("%-16s % 16.2f Mi\n", "$1:", $2 * $size / 1048576);')
echo "💾 内存使用情况:" | tee -a $LOG_FILE
echo "$memory_info" | tee -a $LOG_FILE

# 磁盘使用率
echo "💿 磁盘使用情况:" | tee -a $LOG_FILE
disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
echo "磁盘使用率: ${disk_usage}%" | tee -a $LOG_FILE
if [ "$disk_usage" -gt "$ALERT_THRESHOLD_DISK" ]; then
    echo "⚠️  磁盘空间不足!" | tee -a $LOG_FILE
fi

# Docker容器资源使用
echo -e "\n🐳 容器资源使用:" | tee -a $LOG_FILE
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" | tee -a $LOG_FILE

# 数据库连接测试
echo -e "\n🗄️  数据库连接测试:" | tee -a $LOG_FILE
if docker exec sdszk-mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB连接正常" | tee -a $LOG_FILE
else
    echo "❌ MongoDB连接失败" | tee -a $LOG_FILE
fi

if docker exec sdszk-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis连接正常" | tee -a $LOG_FILE
else
    echo "❌ Redis连接失败" | tee -a $LOG_FILE
fi

# 日志分析
echo -e "\n📝 最近错误日志:" | tee -a $LOG_FILE
docker-compose -f docker-compose.prod.yml logs --tail=50 | grep -i error | tail -10 | tee -a $LOG_FILE || echo "无错误日志" | tee -a $LOG_FILE

# 访问量统计
echo -e "\n📈 今日访问统计:" | tee -a $LOG_FILE
if [ -f "/var/log/nginx/access.log" ]; then
    today=$(date +%d/%b/%Y)
    total_requests=$(grep "$today" /var/log/nginx/access.log | wc -l)
    unique_ips=$(grep "$today" /var/log/nginx/access.log | awk '{print $1}' | sort | uniq | wc -l)
    echo "总请求数: $total_requests" | tee -a $LOG_FILE
    echo "独立访客: $unique_ips" | tee -a $LOG_FILE
else
    echo "无访问日志文件" | tee -a $LOG_FILE
fi

echo -e "\n================================================" | tee -a $LOG_FILE
echo "监控完成时间: $(date)" | tee -a $LOG_FILE

# 发送报告到指定邮箱（可选）
if [ -n "$ALERT_EMAIL" ]; then
    mail -s "山东省思政教育平台监控报告" "$ALERT_EMAIL" < $LOG_FILE
fi

echo "📊 监控报告已生成: $LOG_FILE"
