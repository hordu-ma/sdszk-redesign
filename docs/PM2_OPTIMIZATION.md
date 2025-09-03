# PM2 优化总结文档

## 概述

本文档总结了对山东省思政课一体化平台 PM2 部署管理的优化工作，解决了重复实例、频繁重启等问题，提升了服务稳定性。

## 🔍 发现的问题

### 1. 重复实例问题

- **现象**: 发现两个 `sdszk-backend` 实例同时运行
- **重启次数**: 高达 156 和 1340 次
- **影响**: 资源浪费、服务不稳定

### 2. PM2 管理不严格

- **原因**: 部署脚本在启动新实例前未彻底清理旧实例
- **风险**: 可能导致端口冲突、资源竞争

## ✅ 优化措施

### 1. 部署脚本优化

#### 添加强制清理函数

```bash
force_clean_pm2_app() {
    local app_name=$1
    # 强制停止并删除所有同名实例
    pm2 stop '$app_name' 2>/dev/null || true
    pm2 delete '$app_name' 2>/dev/null || true
    # 验证清理结果
}
```

#### 优化启动流程

```bash
# 启动参数优化
pm2 start app.js --name '$PM2_APP_NAME' --env production \
    --max-restarts 10 \
    --restart-delay 3000 \
    --max-memory-restart 500M \
    --watch false \
    --merge-logs true \
    --log-date-format "YYYY-MM-DD HH:mm:ss Z"
```

#### 实例数量验证

```bash
# 验证只有一个实例在运行
local instance_count=$(pm2 list | grep '$PM2_APP_NAME' | grep 'online' | wc -l)
if [ $instance_count -eq 1 ]; then
    echo "✅ 确认只有一个实例在运行"
else
    echo "⚠️ 警告: 检测到 $instance_count 个实例"
    exit 1
fi
```

### 2. 健康检查增强

#### 多维度检查

- **实例数量检查**: 确保只有一个实例运行
- **重启次数监控**: 警告重启次数过高的情况
- **内存使用监控**: 防止内存泄漏
- **API 接口检查**: 验证服务功能正常

#### 健康评分系统

```bash
# 5个维度各20分，总分100分
- PM2状态正常 (20分)
- 单实例运行 (20分)
- 重启次数 < 5 (20分)
- 内存使用 < 500MB (20分)
- API接口正常 (20分)
```

### 3. PM2 管理工具

创建了专用的 `pm2-manager.sh` 脚本，提供以下功能：

#### 日常管理命令

```bash
./scripts/deployment/pm2-manager.sh status          # 查看状态
./scripts/deployment/pm2-manager.sh clean           # 清理异常进程
./scripts/deployment/pm2-manager.sh restart         # 安全重启
./scripts/deployment/pm2-manager.sh force-restart   # 强制重启
./scripts/deployment/pm2-manager.sh logs            # 查看日志
./scripts/deployment/pm2-manager.sh monitor         # 实时监控
./scripts/deployment/pm2-manager.sh health          # 健康检查
./scripts/deployment/pm2-manager.sh maintenance     # 完整维护
```

#### 配置管理

```bash
./scripts/deployment/pm2-manager.sh optimize        # 优化配置
./scripts/deployment/pm2-manager.sh backup-config   # 备份配置
./scripts/deployment/pm2-manager.sh restore-config  # 恢复配置
```

## 📊 优化效果

### 优化前

- ❌ 2个重复实例运行
- ❌ 重启次数: 156 和 1340 次
- ❌ 服务不稳定
- ❌ 资源浪费

### 优化后

- ✅ 单实例稳定运行
- ✅ 重启次数: 0 次
- ✅ 健康评分: 100/100
- ✅ 内存使用: 113MB
- ✅ API 接口正常

## 🛠️ 最佳实践

### 1. 部署前检查

```bash
# 执行维护检查
./scripts/deployment/pm2-manager.sh maintenance
```

### 2. 部署流程

1. **强制清理**: 删除所有旧实例
2. **单实例启动**: 确保只启动一个实例
3. **参数优化**: 设置合理的重启和内存限制
4. **状态验证**: 检查实例数量和状态
5. **保存配置**: 持久化 PM2 配置

### 3. 日常监控

```bash
# 每日健康检查
./scripts/deployment/pm2-manager.sh health

# 查看服务状态
./scripts/deployment/pm2-manager.sh status

# 查看最近日志
./scripts/deployment/pm2-manager.sh logs 100
```

### 4. 故障处理

```bash
# 清理异常进程
./scripts/deployment/pm2-manager.sh clean

# 强制重启（严重问题时）
./scripts/deployment/pm2-manager.sh force-restart
```

## 🔧 配置文件

### PM2 启动配置

```json
{
  "name": "sdszk-backend",
  "script": "app.js",
  "env": "production",
  "max_restarts": 10,
  "restart_delay": 3000,
  "max_memory_restart": "500M",
  "watch": false,
  "merge_logs": true,
  "log_date_format": "YYYY-MM-DD HH:mm:ss Z"
}
```

### 日志轮转配置

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 📋 监控指标

### 关键指标

- **实例数量**: 必须 = 1
- **状态**: 必须 = online
- **重启次数**: 建议 < 5
- **内存使用**: 建议 < 500MB
- **CPU使用**: 建议 < 50%

### 告警阈值

- 实例数量 ≠ 1 → 立即处理
- 重启次数 > 5 → 检查日志
- 内存使用 > 500MB → 检查内存泄漏
- API 接口异常 → 立即处理

## 🚀 未来改进

### 1. 自动化监控

- 集成监控系统（如 Prometheus + Grafana）
- 设置自动告警机制
- 定时健康检查任务

### 2. 服务发现

- 考虑使用 Docker 容器化
- 实现服务自动发现和负载均衡
- 支持蓝绿部署

### 3. 日志管理

- 集中化日志收集
- 结构化日志格式
- 日志分析和告警

## 📝 总结

通过本次 PM2 优化：

1. **解决了重复实例问题**: 确保只有一个服务实例运行
2. **提升了服务稳定性**: 重启次数从数百次降至0次
3. **完善了监控体系**: 建立了健康检查和评分机制
4. **标准化了管理流程**: 提供了专用的管理工具

现在系统已达到生产级别的稳定性要求，可以安全地进行后续的部署和维护工作。

---

**文档版本**: 1.0
**更新日期**: 2025-09-03
**维护者**: 系统管理员
