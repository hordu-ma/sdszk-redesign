# MongoDB Compass 远程数据库连接操作指南

> 本指南用于通过SSH隧道安全连接阿里云服务器上的MongoDB数据库

## 📋 环境信息

- **服务器IP**: 60.205.124.67
- **服务器MongoDB端口**: 27017
- **本地隧道端口**: 27018
- **数据库名**: `sdszk`（开发和生产环境统一）
- **开发数据库名**: `sdszk`

## 🚀 快速连接步骤

### 步骤1：建立SSH隧道

打开终端，执行以下命令：

```bash
# 进入项目目录
cd /Users/liguoma/my-devs/sdszk-redesign

# 运行SSH隧道脚本（保持此终端窗口开启）
./scripts/mongodb-tunnel.sh
```

**重要提醒**：

- ⚠️ 保持运行隧道脚本的终端窗口**开启状态**
- ⚠️ 关闭此终端窗口将断开数据库连接
- 💡 按 `Ctrl+C` 可手动断开隧道

### 步骤2：在MongoDB Compass中连接

1. **打开MongoDB Compass应用**

2. **选择连接方式**：
   - 点击 "New Connection" 或 "Add new connection"

3. **输入连接信息**：

   **方式A：使用连接字符串（推荐）**

   ```
   mongodb://localhost:27018/sdszk
   ```

   **方式B：手动填写连接参数**
   - **Hostname**: `localhost`
   - **Port**: `27018`
   - **Database Name**: `sdszk`
   - **Authentication**: 通常选择 "None"（通过SSH隧道已经认证）

4. **测试连接**：
   - 点击 "Connect" 按钮
   - 如果连接成功，您将看到数据库列表

## 🔧 故障排除

### 问题1：连接被拒绝 (ECONNREFUSED)

**原因**：SSH隧道未正确建立

**解决方案**：

```bash
# 1. 检查SSH隧道是否运行
ps aux | grep "ssh -L 27018" | grep -v grep

# 2. 如果没有运行，重新建立隧道
ssh -L 27018:127.0.0.1:27017 root@60.205.124.67 -N

# 3. 验证端口是否可访问
nc -z localhost 27018 && echo "端口27018可访问" || echo "端口27018不可访问"
```

### 问题2：SSH连接失败

**检查步骤**：

```bash
# 测试SSH连接
ssh -o ConnectTimeout=10 root@60.205.124.67 "echo 'SSH连接正常'"

# 如果失败，检查：
# 1. 网络连接是否正常
# 2. SSH密钥是否配置正确
# 3. 服务器是否可访问
```

### 问题3：服务器MongoDB服务异常

**检查服务器状态**：

```bash
# 检查MongoDB容器状态
ssh root@60.205.124.67 "docker ps | grep mongo"

# 检查MongoDB服务
ssh root@60.205.124.67 "docker exec mongodb mongosh --eval 'db.runCommand({ping: 1})'"
```

## 🛠 手动操作命令

### 建立SSH隧道（手动方式）

如果脚本不工作，可以手动执行：

```bash
# 前台运行（占用终端）
ssh -L 27018:127.0.0.1:27017 root@60.205.124.67 -N

# 后台运行
ssh -L 27018:127.0.0.1:27017 root@60.205.124.67 -N &
```

### 断开SSH隧道

```bash
# 查找SSH隧道进程
ps aux | grep "ssh -L 27018"

# 终止SSH隧道进程
pkill -f "ssh -L 27018:127.0.0.1:27017"

# 或者使用进程ID
kill <进程ID>
```

### 验证连接状态

```bash
# 检查端口占用
lsof -i :27018

# 测试端口连通性
nc -z localhost 27018

# 测试MongoDB连接
mongosh "mongodb://localhost:27018/sdszk" --eval "db.runCommand({ping: 1})"
```

## 📊 数据库信息

### 生产环境数据库结构

- **数据库名**: `sdszk`
- **主要集合（Collections）**:
  - `users` - 用户信息
  - `news` - 新闻文章
  - `resources` - 教学资源
  - `newscategories` - 新闻分类
  - `resourcecategories` - 资源分类
  - `activities` - 活动信息
  - `favorites` - 用户收藏
  - `viewhistories` - 浏览历史

### 开发环境数据库

- **数据库名**: `sdszk`
- **端口**: `27017`（本地MongoDB实例）

## ⚡ 常用连接字符串

### 远程生产数据库

```
mongodb://localhost:27018/sdszk
```

### 本地开发数据库

```
mongodb://localhost:27017/sdszk
```

## 📝 操作日志

记录您的操作，便于问题追踪：

```bash
# 记录连接时间
echo "$(date): 建立MongoDB远程连接" >> ~/.mongodb_connection.log

# 记录断开时间
echo "$(date): 断开MongoDB远程连接" >> ~/.mongodb_connection.log
```

## 🔐 安全注意事项

1. **SSH密钥管理**：
   - 确保SSH私钥安全存储
   - 定期更新SSH密钥

2. **网络安全**：
   - 仅在受信任的网络环境下建立连接
   - 使用VPN（如有必要）

3. **数据操作**：
   - 在生产数据库上操作时要格外小心
   - 建议先在开发环境测试

## 📞 技术支持

如果遇到无法解决的问题：

1. 检查 `辅助开发上下文指南.md` 中的相关说明
2. 查看服务器日志：`ssh root@60.205.124.67 "docker logs mongodb"`
3. 联系系统管理员

---

**文档版本**: v1.0
**最后更新**: 2025-06-30
**适用项目**: 山东省思政课一体化中心
**维护者**: 项目开发团队

---

## 💡 小贴士

- 建议将此文档加入浏览器书签，便于快速查阅
- 可以创建桌面快捷方式指向SSH隧道脚本
- 定期备份重要数据，避免意外丢失
