# 🚀 MongoDB Compass 快速连接卡片

## 一分钟连接指南

### 📋 准备工作

```bash
# 确保你在项目目录中
cd /Users/liguoma/my-devs/sdszk-redesign
```

### 🔗 第1步：建立隧道（30秒）

```bash
./scripts/mongodb-tunnel.sh
```

看到"🔗 正在连接..."就成功了，**保持这个终端开启**！

### 📱 第2步：打开MongoDB Compass（30秒）

1. 启动MongoDB Compass应用
2. 在连接字符串框中粘贴：
   ```
   mongodb://localhost:27018/sdszk
   ```
3. 点击"Connect"

### ✅ 连接成功标志

- 左侧显示"sdszk"数据库
- 可以看到10个集合（users, news, resources等）

## 📞 遇到问题？

### 隧道问题

```bash
# 检查隧道状态
lsof -i :27018

# 重新测试
./scripts/test-mongodb-tunnel.sh
```

### 连接问题

- 确认隧道终端还在运行
- 检查端口号是27018（不是27017）
- 尝试重新启动Compass

## 🎯 连接信息速查

| 项目       | 值                                |
| ---------- | --------------------------------- |
| 服务器     | 60.205.124.67                     |
| 隧道端口   | 27018                             |
| 数据库名   | sdszk                             |
| 认证       | 无需认证                          |
| 连接字符串 | `mongodb://localhost:27018/sdszk` |

---

💡 **提示**: 隧道脚本会自动处理端口冲突，无需手动配置！
