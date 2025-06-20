# MongoDB Compass 连接阿里云数据库详细指南

## 🎯 概述

本指南将帮您通过SSH隧道在MongoDB Compass中连接阿里云服务器上的MongoDB数据库。

## 📋 前提条件

- ✅ MongoDB Compass已安装
- ✅ 可以SSH连接到阿里云服务器 (60.205.124.67)
- ✅ 阿里云服务器上MongoDB容器正在运行

## 🚀 完整连接步骤

### 第一步：建立SSH隧道

#### 方法1：使用自动化脚本（推荐）

打开终端，执行：

```bash
cd /Users/liguoma/my-devs/sdszk-redesign
./scripts/mongodb-tunnel.sh
```

**成功提示：**

```
🚀 正在建立MongoDB SSH隧道...
📋 服务器信息：
   - 服务器IP: 60.205.124.67
   - 本地端口: 27018 (避免与本地MongoDB冲突)
   - 远程端口: 27017
   - 数据库: sdszk

💡 连接成功后，请在MongoDB Compass中使用以下连接字符串：
   mongodb://localhost:27018/sdszk

🔗 正在连接...
```

⚠️ **重要提示：** 保持此终端窗口开启，不要关闭！

#### 方法2：手动建立隧道

```bash
ssh -L 27018:localhost:27017 root@60.205.124.67 -N
```

### 第二步：验证隧道状态

在**新的终端窗口**中检查：

```bash
# 检查隧道端口是否正常监听
lsof -i :27018

# 正常输出示例：
# COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
# ssh     12345  user    4u  IPv4 0x...              0t0  TCP localhost:27018 (LISTEN)
```

如果没有输出，说明隧道未建立成功，请检查第一步。

### 第三步：打开MongoDB Compass

1. **启动应用**

   - 在应用程序中找到MongoDB Compass
   - 双击启动应用

2. **选择连接方式**
   - 如果是首次使用，会看到"New Connection"界面
   - 如果之前有连接，点击左上角"+"号添加新连接

### 第四步：配置连接信息

#### 方式A：使用连接字符串（简单快捷）

1. 在"URI"输入框中粘贴：

   ```
   mongodb://localhost:27018/sdszk
   ```

2. 点击"Connect"按钮

#### 方式B：填写详细参数（详细配置）

1. **Connection Details:**

   ```
   Hostname: localhost
   Port: 27018
   ```

2. **Authentication:**

   ```
   Authentication Method: No Authentication
   ```

3. **Advanced Options:**

   ```
   Database Name: sdszk
   Connection Name: 阿里云SDSZK数据库 (可选)
   ```

4. **SSL/TLS:**

   ```
   Use TLS/SSL: No (取消勾选)
   ```

5. **SSH Tunnel:**

   ```
   Use SSH Tunnel: No (我们已手动建立隧道)
   ```

6. 点击右下角"Connect"按钮

### 第五步：验证连接成功

#### 成功标志：

- 左侧显示"sdszk"数据库
- 可以看到数据库中的集合列表
- 状态栏显示"Connected to mongodb://localhost:27018/sdszk"

#### 数据库结构预览：

```
sdszk
├── 📄 users (用户管理)
├── 📄 news (新闻内容)
├── 📄 newscategories (新闻分类)
├── 📄 resources (资源文件)
├── 📄 resourcecategories (资源分类)
├── 📄 activities (活动信息)
├── 📄 activitylogs (活动日志)
├── 📄 favorites (收藏记录)
├── 📄 viewhistories (浏览历史)
└── 📄 sitesettings (站点设置)
```

## 📊 基本使用操作

### 查看集合数据

1. 点击左侧任意集合名称（如"users"）
2. 右侧会显示该集合中的所有文档
3. 可以浏览、搜索、编辑数据

### 执行查询

1. 在查询栏中输入MongoDB查询语法
2. 例如查找管理员用户：`{role: "admin"}`
3. 点击"Apply"执行查询

### 查看数据库统计

1. 选择"sdszk"数据库
2. 点击"Collections"标签
3. 查看每个集合的文档数量和存储大小

### 导入/导出数据

1. 选择集合后，点击工具栏的"..."按钮
2. 选择"Import Data"或"Export Collection"
3. 按照向导完成操作

## ⚠️ 常见问题解决

### 问题1：连接超时

**症状：** Compass显示"connection timeout"
**解决：**

```bash
# 检查SSH隧道是否还在运行
lsof -i :27018

# 如果没有输出，重新建立隧道
./scripts/mongodb-tunnel.sh
```

### 问题2：端口冲突

**症状：** 提示"端口27018已被占用"
**解决：**

```bash
# 查看端口占用
lsof -i :27018

# 杀死占用进程（替换PID为实际进程ID）
kill PID

# 或使用不同端口
ssh -L 27019:localhost:27017 root@60.205.124.67 -N
# 然后在Compass中连接 mongodb://localhost:27019/sdszk
```

### 问题3：SSH连接失败

**症状：** 隧道脚本报SSH连接错误
**解决：**

```bash
# 测试SSH连接
ssh root@60.205.124.67 "echo 'SSH连接正常'"

# 检查SSH密钥
ssh-add -l

# 如果提示密码，请联系管理员确认SSH配置
```

### 问题4：Compass无法启动

**症状：** MongoDB Compass应用无法打开
**解决：**

- 确认MongoDB Compass已正确安装
- 尝试重新启动应用
- 检查系统兼容性
- 如需要，重新下载安装最新版本

## 🔒 安全注意事项

### 1. 隧道管理

- ✅ 使用完毕后关闭隧道（Ctrl+C）
- ✅ 不要在公共网络环境下建立隧道
- ✅ 定期更换SSH密钥

### 2. 数据操作

- ⚠️ 重要操作前先备份数据
- ⚠️ 避免在生产环境直接修改核心数据
- ⚠️ 谨慎使用删除操作

### 3. 连接管理

- 💡 建议为生产环境创建只读用户
- 💡 定期检查连接日志
- 💡 限制同时连接数量

## 📞 获取帮助

如果遇到问题，请提供以下信息：

1. **SSH隧道日志：** 隧道建立时的完整输出
2. **Compass错误截图：** 包含错误信息的截图
3. **系统信息：** 操作系统版本和MongoDB Compass版本
4. **网络状态：** 是否使用VPN或代理

## 🚀 快速参考

### 常用连接信息

```
SSH服务器: 60.205.124.67
本地隧道端口: 27018
数据库名: sdszk
连接字符串: mongodb://localhost:27018/sdszk
```

### 快速命令

```bash
# 建立隧道
./scripts/mongodb-tunnel.sh

# 测试隧道
lsof -i :27018

# 测试连接
./scripts/test-mongodb-tunnel.sh
```

---

**文档版本:** 1.0  
**最后更新:** 2025年6月20日  
**适用环境:** macOS + MongoDB Compass + 阿里云服务器
