# 域名迁移部署指南

## 📋 迁移概述

**旧域名**: `horsduroot.com` → **新域名**: `www.sdszk.cn`  
**迁移时间**: 2025年10月11日  
**影响范围**: 前端、后端、Nginx、部署脚本

## ✅ 已完成的代码修改

所有代码修改已完成,包括:

1. ✅ `server/config/cors.js` - CORS 白名单配置
2. ✅ `server/.env.production` - 环境变量配置
3. ✅ `nginx-ssl.conf` - Nginx SSL 配置
4. ✅ 部署脚本 (deploy-aliyun.sh, quick-deploy.sh, check-deployment.sh, deploy-nginx.sh)
5. ✅ README.md 和相关文档

## 🚀 服务器端部署步骤

### 步骤 1: 在服务器上申请新域名的 SSL 证书

在阿里云服务器上执行:

```bash
# 1. 停止 nginx (避免端口占用)
sudo systemctl stop nginx

# 2. 使用 certbot 申请新域名证书
sudo certbot certonly --standalone -d www.sdszk.cn -d www.www.sdszk.cn

# 3. 验证证书是否成功生成
ls -la /etc/letsencrypt/live/www.sdszk.cn/

# 应该看到以下文件:
# - fullchain.pem
# - privkey.pem
# - cert.pem
# - chain.pem
```

### 步骤 2: 部署更新的配置文件

在本地项目目录执行:

```bash
# 1. 确保在项目根目录
cd /Users/liguoma/my-devs/javascript/sdszk-redesign

# 2. 使用部署脚本更新 Nginx 配置
./scripts/deployment/deploy-nginx.sh

# 或者手动部署:
scp nginx-ssl.conf root@8.141.113.21:/etc/nginx/sites-available/sdszk
```

### 步骤 3: 更新服务器端环境变量

在阿里云服务器上:

```bash
# SSH 登录服务器
ssh root@8.141.113.21

# 进入后端目录
cd /var/www/sdszk-backend

# 备份旧的环境变量
cp .env .env.backup.$(date +%Y%m%d)

# 编辑环境变量文件
nano .env

# 确保以下配置正确:
FRONTEND_URL=https://www.sdszk.cn,https://www.www.sdszk.cn
ALLOWED_ORIGINS=https://www.sdszk.cn,https://www.www.sdszk.cn
SERVER_PUBLIC_URL=https://www.sdszk.cn
BASE_URL=https://www.sdszk.cn
```

### 步骤 4: 重启服务

在服务器上执行:

```bash
# 1. 测试 nginx 配置
sudo nginx -t

# 2. 如果测试通过,重启 nginx
sudo systemctl restart nginx

# 3. 重启后端服务
pm2 restart sdszk-backend

# 4. 查看后端日志,确认没有 CORS 错误
pm2 logs sdszk-backend --lines 50
```

### 步骤 5: 验证部署

```bash
# 1. 检查网站可访问性
curl -I https://www.sdszk.cn
curl -I https://www.www.sdszk.cn

# 2. 检查 API 健康状态
curl https://www.sdszk.cn/api/health

# 3. 检查 SSL 证书
openssl s_client -connect www.sdszk.cn:443 -servername www.sdszk.cn < /dev/null 2>/dev/null | openssl x509 -noout -dates

# 4. 在浏览器测试登录
# 访问: https://www.sdszk.cn/admin/login
```

## 🔍 问题排查

### 问题 1: 401 登录错误

**原因**: CORS 配置未生效或环境变量未更新

**解决方案**:

```bash
# 检查后端日志中的 CORS 警告
pm2 logs sdszk-backend | grep CORS

# 确认环境变量已加载
pm2 restart sdszk-backend --update-env
```

### 问题 2: SSL 证书错误

**原因**: 证书路径不正确或证书未成功申请

**解决方案**:

```bash
# 检查证书文件是否存在
ls -la /etc/letsencrypt/live/www.sdszk.cn/

# 重新申请证书
sudo certbot certonly --standalone -d www.sdszk.cn -d www.www.sdszk.cn --force-renewal
```

### 问题 3: Nginx 配置测试失败

**原因**: 配置文件语法错误

**解决方案**:

```bash
# 查看详细错误信息
sudo nginx -t

# 检查配置文件
cat /etc/nginx/sites-available/sdszk
```

## 📊 检查清单

在完成部署后,使用以下清单确认所有功能正常:

- [ ] SSL 证书正确安装 (有效期 90 天)
- [ ] HTTPS 自动重定向工作正常
- [ ] 前端页面可正常访问 (`https://www.sdszk.cn`)
- [ ] API 健康检查通过 (`https://www.sdszk.cn/api/health`)
- [ ] CMS 登录功能正常 (`https://www.sdszk.cn/admin/login`)
- [ ] 静态资源 (图片/CSS/JS) 正常加载
- [ ] 没有 CORS 相关错误 (检查浏览器控制台)
- [ ] 后端日志无异常 (`pm2 logs sdszk-backend`)

## 🔄 回滚方案

如果新域名出现问题,可以快速回滚:

```bash
# 1. 恢复旧的 Nginx 配置
sudo cp /etc/nginx/sites-available/sdszk.backup /etc/nginx/sites-available/sdszk

# 2. 恢复旧的环境变量
cd /var/www/sdszk-backend
cp .env.backup.YYYYMMDD .env

# 3. 重启服务
sudo systemctl restart nginx
pm2 restart sdszk-backend
```

## 📝 注意事项

1. **DNS 解析**: 确保 `www.sdszk.cn` 和 `www.www.sdszk.cn` 的 DNS A 记录都指向服务器 IP `8.141.113.21`
2. **证书更新**: Let's Encrypt 证书有效期 90 天,建议设置自动续期
3. **旧域名**: 如需保留旧域名访问,可以配置 301 重定向到新域名
4. **缓存清理**: 部署后建议清理浏览器缓存和 CDN 缓存 (如有)

## 🆘 紧急联系

如遇到无法解决的问题:

1. 查看实时日志: `pm2 logs sdszk-backend --lines 100`
2. 查看 Nginx 错误日志: `tail -f /var/log/nginx/sdszk.error.log`
3. 使用健康检查脚本: `./scripts/deployment/check-deployment.sh`

---

**文档版本**: v1.0  
**更新时间**: 2025-10-11  
**维护人**: 开发团队
