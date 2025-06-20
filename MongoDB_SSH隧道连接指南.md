# MongoDB SSH隧道连接完整指南

## 🎯 背景说明

由于安全考虑，阿里云服务器的MongoDB没有直接暴露到公网，但通过SSH隧道可以安全地从本地连接到远程数据库。

## 🔧 准备工作

### 检查本地环境

```bash
# 检查本地是否有MongoDB服务运行
lsof -i :27017

# 如果有冲突，我们使用27018端口建立隧道
```

## 🚀 方法一：使用便捷脚本（推荐）

### 1. 启动隧道脚本

```bash
cd /Users/liguoma/my-devs/sdszk-redesign
./scripts/mongodb-tunnel.sh
```

### 2. 脚本功能

- ✅ 自动检查端口冲突
- ✅ 建立安全SSH隧道 (本地27018 → 远程27017)
- ✅ 提供详细连接信息
- ✅ 友好的状态提示

### 3. 在MongoDB Compass中连接

```
连接字符串: mongodb://localhost:27018/sdszk
```

## 🔧 方法二：手动命令

### 1. 建立SSH隧道

```bash
ssh -L 27018:localhost:27017 root@60.205.124.67 -N
```

### 2. 参数说明

- `-L 27018:localhost:27017`: 端口转发（本地27018 → 远程27017）
- `root@60.205.124.67`: 阿里云服务器
- `-N`: 不执行远程命令，仅建立隧道

### 3. 保持连接

- 保持终端窗口开启
- 按 Ctrl+C 断开连接

## 📱 MongoDB Compass 详细连接指南

### 🚀 第一步：启动SSH隧道

#### 方法1：使用便捷脚本（推荐）

```bash
cd /Users/liguoma/my-devs/sdszk-redesign
./scripts/mongodb-tunnel.sh
```

成功启动后会看到：

```
🚀 正在建立MongoDB SSH隧道...
📋 服务器信息：
   - 服务器IP: 60.205.124.67
   - 本地端口: 27018
   - 远程端口: 27017
   - 数据库: sdszk

💡 连接成功后，请在MongoDB Compass中使用以下连接字符串：
   mongodb://localhost:27018/sdszk

🔗 正在连接...
```

#### 方法2：手动命令

```bash
ssh -L 27018:localhost:27017 root@60.205.124.67 -N
```

⚠️ **重要**: 保持这个终端窗口开启！关闭后隧道会断开。

### 🔧 第二步：验证隧道连接

在新的终端窗口中验证：

```bash
# 检查27018端口是否在监听
lsof -i :27018

# 应该看到类似输出：
# COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
# ssh     12345  user    4u  IPv4 0x...              0t0  TCP localhost:27018 (LISTEN)
```

### 📱 第三步：打开MongoDB Compass并连接

#### 1. 启动MongoDB Compass应用

- 双击MongoDB Compass图标
- 等待应用启动完成

#### 2. 选择连接方式

**选项A：使用连接字符串（推荐）**

```
在连接字符串输入框中粘贴：
mongodb://localhost:27018/sdszk
```

**选项B：填写详细信息**

```
连接配置：
- Hostname or IP Address: localhost
- Port: 27018
- Database Name: sdszk
- Authentication Method: No Authentication
- SSL: No
- SSH Tunnel: No（我们已手动建立隧道）
```

#### 3. 高级设置（可选）

```
Connection Name: 阿里云SDSZK数据库
Read Preference: Primary
```

#### 4. 点击"Connect"按钮

- 如果一切正常，几秒钟后会连接成功
- 左侧会显示"sdszk"数据库

### ✅ 第四步：验证连接成功

连接成功后您会看到：

#### 数据库结构

```
sdszk/
├── users (用户信息)
├── news (新闻内容)
├── newscategories (新闻分类)
├── resources (资源文件)
├── resourcecategories (资源分类)
├── activities (活动信息)
├── activitylogs (活动日志)
├── favorites (收藏记录)
├── viewhistories (浏览历史)
└── sitesettings (站点设置)
```

#### 基本操作

- **查看集合**: 点击左侧集合名称
- **浏览数据**: 选择集合后查看文档
- **查询数据**: 使用查询栏进行筛选
- **编辑文档**: 双击文档进行编辑
- **导入导出**: 使用工具栏的导入/导出功能

### 🎯 常用操作示例

#### 查看用户数据

1. 点击左侧"users"集合
2. 可以看到所有用户记录
3. 使用过滤器查询特定用户：`{username: "admin"}`

#### 查看新闻分类

1. 点击"newscategories"集合
2. 查看所有新闻分类
3. 确认core分类数据完整性

#### 数据库统计

1. 选择"sdszk"数据库
2. 点击"Collections"标签页
3. 查看每个集合的文档数量和大小

### 详细配置

1. **连接方式**: 新建连接
2. **Host**: localhost
3. **Port**: 27018
4. **Database**: sdszk
5. **Authentication**: None（当前未开启认证）

### 连接字符串

```
mongodb://localhost:27018/sdszk
```

## 📊 数据库概况

连接成功后可以看到以下集合：

- `users` - 用户信息
- `news` - 新闻内容
- `newscategories` - 新闻分类
- `resources` - 资源文件
- `resourcecategories` - 资源分类
- `activities` - 活动信息
- `activitylogs` - 活动日志
- `favorites` - 收藏记录
- `viewhistories` - 浏览历史
- `sitesettings` - 站点设置

## ⚠️ 注意事项

### 安全性

1. **隧道连接**: 所有数据通过SSH加密传输
2. **端口转发**: 仅本地可访问，外部无法直接连接
3. **临时性**: 关闭终端后隧道自动断开

### 使用建议

1. **开发环境**: 可长期保持隧道连接
2. **生产维护**: 使用完毕后及时断开
3. **数据备份**: 重要操作前建议先备份

## 🛠️ 故障排除

### 常见问题

#### 1. 端口冲突

```bash
# 检查端口占用
lsof -i :27018

# 如果被占用，可使用其他端口
ssh -L 27019:localhost:27017 root@60.205.124.67 -N
```

#### 2. SSH连接失败

```bash
# 测试SSH连接
ssh root@60.205.124.67 "echo '连接正常'"

# 检查SSH密钥
ssh-add -l
```

#### 3. MongoDB Compass连接超时

- 确保SSH隧道正在运行
- 检查端口号是否正确（27018）
- 尝试重新建立隧道

### 验证连接

```bash
# 通过隧道测试MongoDB连接
mongosh mongodb://localhost:27018/sdszk --eval "db.stats()"
```

## 📞 技术支持

遇到问题时，请提供：

1. SSH隧道建立时的错误信息
2. MongoDB Compass的错误截图
3. 终端中的完整错误日志

---

_最后更新: 2025年6月20日_
