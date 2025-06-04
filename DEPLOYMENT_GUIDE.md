# 山东省思想政治理论课平台 - 生产环境部署指南

## 🚀 部署概览

本指南将指导您完成山东省思想政治理论课平台的生产环境部署。

### 系统要求

- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Docker支持的系统
- **CPU**: 4核心以上
- **内存**: 8GB以上
- **存储**: 100GB以上可用空间
- **网络**: 公网IP和域名（用于SSL）

### 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **后端**: Node.js + Express + MongoDB
- **缓存**: Redis
- **容器**: Docker + Docker Compose
- **代理**: Nginx
- **SSL**: Let's Encrypt (推荐)

## 📋 部署前准备

### 1. 服务器环境准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 将用户添加到docker组
sudo usermod -aG docker $USER
```

### 2. 域名和SSL证书

```bash
# 使用Certbot获取SSL证书
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# 证书将保存在 /etc/letsencrypt/live/yourdomain.com/
```

### 3. 环境变量配置

复制 `.env.production` 文件并修改以下重要配置：

```bash
# 复制环境配置文件
cp .env.production .env.prod

# 编辑配置文件
nano .env.prod
```

**必须修改的配置项**:

```bash
# 数据库密码（必须修改）
MONGO_ROOT_PASSWORD=your_very_secure_root_password
MONGO_PASSWORD=your_very_secure_user_password

# Redis密码（必须修改）
REDIS_PASSWORD=your_very_secure_redis_password

# JWT密钥（必须修改，推荐使用64位随机字符串）
JWT_SECRET=your_super_secure_64_character_jwt_secret_key_here_change_this

# 域名配置
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# 邮件配置（可选）
SMTP_HOST=smtp.your-provider.com
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_email_password
```

### 4. SSL证书配置

```bash
# 创建SSL目录
mkdir -p ssl

# 复制SSL证书（替换yourdomain.com为您的域名）
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/certificate.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/private.key

# 设置证书权限
sudo chown $USER:$USER ssl/*
chmod 600 ssl/private.key
chmod 644 ssl/certificate.crt
```

### 5. Nginx配置更新

编辑 `nginx.conf` 文件，将 `yourdomain.com` 替换为您的实际域名。

## 🏗️ 部署步骤

### 1. 克隆代码库

```bash
git clone <repository-url> sdszk-platform
cd sdszk-platform
```

### 2. 配置环境

```bash
# 加载环境变量
source .env.prod

# 或者导出环境变量
export MONGO_PASSWORD="your_password"
export REDIS_PASSWORD="your_password"
export JWT_SECRET="your_jwt_secret"
```

### 3. 执行部署

```bash
# 使用部署脚本
./scripts/deploy-prod.sh

# 或者手动部署
docker-compose -f docker-compose.prod.yml up -d --build
```

### 4. 验证部署

```bash
# 检查服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看服务日志
docker-compose -f docker-compose.prod.yml logs

# 健康检查
curl http://localhost:3000/api/health
```

## 🔧 部署后配置

### 1. 数据库初始化

数据库会自动初始化，默认管理员账号：

- **用户名**: admin
- **密码**: password

**⚠️ 重要**: 请立即登录系统修改默认密码！

### 2. 访问系统

- **前台访问**: https://yourdomain.com
- **管理后台**: https://yourdomain.com/admin
- **API文档**: https://yourdomain.com/api/docs

### 3. 系统配置

登录管理后台后，请配置：

1. **网站信息**: 修改网站标题、描述等基本信息
2. **用户管理**: 创建其他管理员账号
3. **内容分类**: 根据需要调整新闻和资源分类
4. **系统设置**: 配置上传限制、缓存策略等

## 📊 监控和维护

### 1. 系统监控

```bash
# 运行监控脚本
./scripts/monitor.sh

# 设置定时监控（每小时执行一次）
echo "0 * * * * /path/to/sdszk-platform/scripts/monitor.sh" | crontab -
```

### 2. 日志管理

```bash
# 查看应用日志
docker-compose -f docker-compose.prod.yml logs -f app

# 查看数据库日志
docker-compose -f docker-compose.prod.yml logs -f mongodb

# 查看Nginx日志
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 3. 备份策略

```bash
# 数据库备份
docker exec sdszk-mongodb mongodump --out /backup --db sdszk

# 文件备份
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz server/uploads/
```

### 4. 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新构建和部署
docker-compose -f docker-compose.prod.yml up -d --build

# 清理旧镜像
docker system prune -f
```

## 🔒 安全配置

### 1. 防火墙设置

```bash
# 只开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. SSL证书自动更新

```bash
# 添加证书自动更新任务
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 3. 定期安全更新

```bash
# 系统安全更新
sudo apt update && sudo apt upgrade -y

# Docker镜像更新
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 🚨 故障排除

### 常见问题

1. **服务无法启动**

   ```bash
   # 检查端口占用
   sudo netstat -tlnp | grep :3000

   # 检查Docker日志
   docker-compose -f docker-compose.prod.yml logs
   ```

2. **数据库连接失败**

   ```bash
   # 检查数据库状态
   docker exec sdszk-mongodb mongosh --eval "db.runCommand('ping')"

   # 重启数据库服务
   docker-compose -f docker-compose.prod.yml restart mongodb
   ```

3. **SSL证书问题**

   ```bash
   # 检查证书有效期
   openssl x509 -in ssl/certificate.crt -text -noout | grep "Not After"

   # 重新申请证书
   sudo certbot renew --force-renewal
   ```

### 性能优化

1. **启用HTTP/2和压缩**（已在nginx.conf中配置）
2. **数据库索引优化**（已在初始化脚本中配置）
3. **Redis缓存策略**（根据实际使用情况调整）

## 📞 技术支持

如遇到部署问题，请：

1. 查看系统日志和错误信息
2. 检查环境配置是否正确
3. 参考故障排除指南
4. 联系技术支持团队

---

**注意**: 请在生产环境中定期备份数据，并建立完善的监控和报警机制。
