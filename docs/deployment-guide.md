# 阿里云部署指南

> 山东省思政课一体化中心 - 完整部署解决方案

## 📋 目录

- [概述](#概述)
- [部署工具介绍](#部署工具介绍)
- [快速开始](#快速开始)
- [详细部署流程](#详细部署流程)
- [部署脚本详解](#部署脚本详解)
- [监控与维护](#监控与维护)
- [故障排除](#故障排除)
- [最佳实践](#最佳实践)

## 概述

本项目提供了完整的阿里云部署解决方案，包含前端、后端的自动化部署和监控工具。所有脚本都遵循 Unix 哲学，专一、简洁、可组合。

### 🎯 部署目标

- **前端**: Vue3 + TypeScript 静态文件部署到 Nginx
- **后端**: Node.js + Express API 服务通过 PM2 管理
- **数据库**: MongoDB 数据持久化
- **反向代理**: Nginx + SSL 证书
- **进程管理**: PM2 守护进程

### 🏗️ 服务器架构

```
阿里云服务器 (60.205.124.67)
├── Nginx (80/443) → 前端静态文件 + API反向代理
├── PM2 → Node.js 后端服务 (3000端口)
├── MongoDB → 数据库服务
└── SSL证书 → HTTPS支持
```

## 部署工具介绍

### 🚀 核心部署脚本

| 脚本文件              | 用途           | 特点                         |
| --------------------- | -------------- | ---------------------------- |
| `deploy-aliyun.sh`    | 统一部署管理器 | 功能完整、错误处理、回滚支持 |
| `quick-deploy.sh`     | 快速部署工具   | 简化操作、快速迭代           |
| `check-deployment.sh` | 部署状态检查   | 全面诊断、健康评分           |
| `pm2-manager.sh`      | PM2 服务管理   | 进程维护、日志监控           |

### 📦 npm 命令快捷方式

```bash
# 统一部署管理器
npm run deploy:aliyun              # 全栈部署
npm run deploy:aliyun:frontend     # 仅前端部署
npm run deploy:aliyun:backend      # 仅后端部署

# 快速部署工具
npm run deploy:quick               # 快速全栈部署
npm run deploy:quick:frontend      # 快速前端部署
npm run deploy:quick:backend       # 快速后端部署

# PM2 服务管理
npm run pm2:status                 # 查看服务状态
npm run pm2:restart                # 重启服务
npm run pm2:logs                   # 查看日志
npm run pm2:health                 # 健康检查
```

## 快速开始

### 🔥 一键部署（推荐新手）

```bash
# 1. 全栈快速部署
npm run deploy:quick

# 2. 检查部署状态
./scripts/deployment/check-deployment.sh

# 3. 查看服务状态
npm run pm2:status
```

### ⚡ 日常更新部署

```bash
# 仅更新前端
npm run deploy:quick:frontend

# 仅更新后端
npm run deploy:quick:backend

# 重启后端服务
npm run pm2:restart
```

## 详细部署流程

### 🎨 前端部署流程

1. **环境检查**: Node.js版本、必要工具、SSH连接
2. **代码构建**: 使用 `vite build --config vite.config.aliyun.ts`
3. **文件验证**: 检查构建产物完整性
4. **服务器备份**: 自动备份现有前端文件
5. **文件上传**: 使用 rsync 同步到服务器
6. **权限设置**: 设置正确的文件权限
7. **Nginx重载**: 应用新配置
8. **健康检查**: 验证网站访问

### 🔧 后端部署流程

1. **环境检查**: Node.js、PM2、生产配置文件
2. **依赖构建**: 安装生产环境依赖
3. **代码打包**: 创建部署包，排除开发文件
4. **服务器备份**: PM2服务停止并备份
5. **文件部署**: 上传并解压部署包
6. **目录初始化**: 创建必要的运行目录
7. **服务启动**: PM2启动新服务实例
8. **状态验证**: 确认服务正常运行

### 📊 部署验证流程

1. **连接测试**: SSH连接、基础工具
2. **文件检查**: 关键文件存在性、权限
3. **服务状态**: PM2、Nginx、数据库
4. **网络访问**: HTTP/HTTPS、API接口
5. **SSL证书**: 证书有效性、过期时间
6. **日志分析**: 错误日志、异常检测

## 部署脚本详解

### 🌟 统一部署管理器 (`deploy-aliyun.sh`)

**特点**: 功能最完善，适合生产环境

```bash
# 使用方法
./scripts/deployment/deploy-aliyun.sh [frontend|backend|fullstack]

# 功能特性
✅ 完整的错误处理和回滚机制
✅ 详细的部署日志和进度显示
✅ 自动备份和恢复功能
✅ 多层次的健康检查
✅ 部署锁防止并发冲突
```

**适用场景**:

- 生产环境正式部署
- 需要完整回滚机制
- 要求详细部署日志

### ⚡ 快速部署工具 (`quick-deploy.sh`)

**特点**: 操作简化，适合快速迭代

```bash
# 使用方法
./scripts/deployment/quick-deploy.sh [f|b|a|restart|status|logs]

# 功能特性
✅ 简化的部署流程
✅ 快速构建和上传
✅ 基础的错误处理
✅ 实时状态反馈
```

**适用场景**:

- 开发阶段频繁部署
- 小修改快速上线
- 紧急修复部署

### 🔍 部署状态检查 (`check-deployment.sh`)

**特点**: 全面的系统诊断工具

```bash
# 使用方法
./scripts/deployment/check-deployment.sh [--quick|--verbose]

# 检查项目 (共10大类)
🔍 服务器连接检查
🔍 前端服务检查
🔍 后端服务检查
🔍 PM2服务检查
🔍 Nginx服务检查
🔍 网站访问检查
🔍 API接口检查
🔍 SSL证书检查
🔍 数据库连接检查
🔍 日志检查
```

**健康评分系统**:

- 90-100分: 系统状态优秀 🎉
- 80-89分: 系统状态良好 👍
- 70-79分: 系统状态一般 ⚠️
- 60-69分: 系统状态较差 🔧
- <60分: 系统状态严重 🚨

### 🛠️ PM2 管理器 (`pm2-manager.sh`)

**特点**: 专业的 PM2 服务管理

```bash
# 主要功能
./scripts/deployment/pm2-manager.sh status        # 服务状态
./scripts/deployment/pm2-manager.sh restart       # 安全重启
./scripts/deployment/pm2-manager.sh logs         # 查看日志
./scripts/deployment/pm2-manager.sh health       # 健康检查
./scripts/deployment/pm2-manager.sh maintenance  # 完整维护
```

## 监控与维护

### 📈 日常监控命令

```bash
# 快速状态检查
npm run pm2:status

# 查看实时日志
npm run pm2:logs

# 完整健康检查
./scripts/deployment/check-deployment.sh

# 查看服务器资源
ssh root@60.205.124.67 "htop"
```

### 🔧 维护任务

#### 每日维护

```bash
# 检查服务状态
npm run pm2:health

# 查看错误日志
npm run pm2:logs | grep -i error
```

#### 每周维护

```bash
# 完整系统检查
./scripts/deployment/check-deployment.sh

# 清理旧备份
ssh root@60.205.124.67 "find /var/www -name '*backup*' -mtime +7 -delete"
```

#### 每月维护

```bash
# PM2 优化
./scripts/deployment/pm2-manager.sh optimize

# SSL 证书检查
./scripts/deployment/check-deployment.sh | grep -i ssl

# 完整维护
./scripts/deployment/pm2-manager.sh maintenance
```

## 故障排除

### 🚨 常见问题解决

#### 1. 前端部署失败

**症状**: 构建失败或文件上传错误

```bash
# 解决步骤
1. 检查 Node.js 版本: node --version
2. 清理依赖重装: rm -rf node_modules && npm install --legacy-peer-deps
3. 手动构建测试: npm run build:aliyun
4. 检查磁盘空间: df -h
5. 重新部署: npm run deploy:quick:frontend
```

#### 2. 后端服务异常

**症状**: PM2 显示 stopped 或 errored

```bash
# 诊断步骤
1. 查看详细状态: npm run pm2:status
2. 查看错误日志: npm run pm2:logs
3. 检查配置文件: ssh root@60.205.124.67 "cat /var/www/sdszk-backend/.env"
4. 手动重启: npm run pm2:restart
5. 强制重启: ./scripts/deployment/pm2-manager.sh force-restart
```

#### 3. 数据库连接问题

**症状**: API 接口返回数据库错误

```bash
# 解决方案
1. 检查 MongoDB 状态: ssh root@60.205.124.67 "systemctl status mongod"
2. 重启数据库: ssh root@60.205.124.67 "systemctl restart mongod"
3. 检查连接配置: 确认 .env.production 中的 MONGODB_URI
4. 测试连接: ./scripts/deployment/check-deployment.sh
```

#### 4. SSL 证书问题

**症状**: HTTPS 访问失败或证书过期

```bash
# 处理步骤
1. 检查证书状态: ./scripts/deployment/check-deployment.sh | grep -i ssl
2. 更新证书: ssh root@60.205.124.67 "certbot renew"
3. 重载 Nginx: ssh root@60.205.124.67 "systemctl reload nginx"
4. 验证访问: curl -I https://sdszk.cn
```

### 🆘 紧急恢复流程

#### 完全服务失效

```bash
# 1. 立即检查
./scripts/deployment/check-deployment.sh --quick

# 2. 服务重启
npm run pm2:restart
ssh root@60.205.124.67 "systemctl restart nginx"

# 3. 如仍有问题，回滚到备份
ssh root@60.205.124.67 "
  cd /var/www
  ls -la *backup* | tail -1  # 找到最新备份
  # 手动恢复备份
"

# 4. 重新部署
npm run deploy:quick
```

## 最佳实践

### ✅ 部署前检查清单

- [ ] 代码已提交到 Git
- [ ] 通过了本地测试
- [ ] 生产配置文件完整
- [ ] SSH 密钥配置正确
- [ ] 服务器磁盘空间充足
- [ ] 数据库连接正常

### 🔒 安全最佳实践

1. **环境隔离**: 严格分离开发、测试、生产环境
2. **配置安全**: 敏感信息只存放在 `.env.production`
3. **权限控制**: 文件权限设置合理（644/755）
4. **SSL 强制**: 所有 HTTP 请求重定向到 HTTPS
5. **定期更新**: 及时更新依赖包和系统补丁

### 📝 部署日志管理

```bash
# 查看部署历史
ls -la /tmp/*deploy* /tmp/*backup*

# 保存部署日志
npm run deploy:aliyun 2>&1 | tee deployment-$(date +%Y%m%d_%H%M%S).log

# 定期清理日志
find /tmp -name "*deploy*" -mtime +30 -delete
```

### 🔄 版本管理策略

```bash
# 标记版本
git tag -a v1.0.0 -m "Production deployment v1.0.0"
git push origin v1.0.0

# 部署特定版本
git checkout v1.0.0
npm run deploy:aliyun
```

### 📊 性能监控

```bash
# 监控服务器资源
ssh root@60.205.124.67 "
  echo '=== CPU和内存 ==='
  htop -n 1
  echo '=== 磁盘使用 ==='
  df -h
  echo '=== 网络连接 ==='
  netstat -tln
"

# 监控应用性能
npm run pm2:status
./scripts/deployment/check-deployment.sh --verbose
```

### 🚀 持续集成建议

```bash
# CI/CD 流水线示例
1. 代码提交触发
2. 自动运行测试: npm test
3. 构建检查: npm run build:aliyun
4. 部署到测试环境
5. 自动化测试验证
6. 手动审批后部署生产
7. 部署后自动检查: ./scripts/deployment/check-deployment.sh
```

## 📞 技术支持

### 🔗 相关链接

- **项目仓库**: Git 仓库地址
- **生产地址**: https://sdszk.cn
- **管理后台**: https://sdszk.cn/admin
- **API文档**: https://sdszk.cn/api/docs

### 📋 故障报告模板

```
## 故障报告

**时间**: 2024-01-01 10:00:00
**影响范围**: [前端/后端/全站]
**故障现象**: 详细描述问题
**错误信息**: 相关错误日志
**已尝试方案**: 列出已尝试的解决方法
**当前状态**: [已解决/进行中/待处理]

## 检查结果
```

./scripts/deployment/check-deployment.sh

```

## 解决方案
详细的解决步骤...
```

---

## 📚 参考文档

- [Vue3 官方文档](https://vuejs.org/)
- [Node.js 部署指南](https://nodejs.org/en/docs/guides/)
- [PM2 官方文档](https://pm2.keymetrics.io/)
- [Nginx 配置指南](https://nginx.org/en/docs/)
- [MongoDB 运维手册](https://docs.mongodb.com/)

---

**最后更新**: 2024-01-01
**文档版本**: v3.0
**维护者**: 开发团队
