# SSH 新服务器配置指南

> 基于现有 ~/.ssh/config 的安全最佳实践

## 📋 当前配置概览

```ssh-config
# 现有服务器 (请勿修改)
Host *
    AddKeysToAgent yes
    UseKeychain yes

Host aliyun-ecs          # 霍斯杜鲁特 ECS
Host wuhao-tutor         # 五好学堂项目
```

---

## 🚀 添加新服务器 - 完整流程

### 步骤 1: 生成独立密钥对

```bash
# 为新项目生成专用密钥 (推荐 ED25519)
ssh-keygen -t ed25519 \
  -C "sdszk-redesign-aliyun" \
  -f ~/.ssh/sdszk_aliyun_key \
  -N ""

# 或者使用 RSA (兼容性更好)
ssh-keygen -t rsa -b 4096 \
  -C "sdszk-redesign-aliyun" \
  -f ~/.ssh/sdszk_aliyun_key
```

**为什么用独立密钥?**

- ✅ 隔离风险: 一个密钥泄露不影响其他服务器
- ✅ 权限管理: 不同项目/团队使用不同密钥
- ✅ 审计追踪: 清晰知道哪个密钥用于哪个服务器

---

### 步骤 2: 配置 SSH Config (追加模式)

**在 `~/.ssh/config` 末尾添加** (不修改现有配置):

```ssh-config
# ========================================
# 山东省思政课一体化中心 - 新阿里云 ECS
# ========================================
Host sdszk-new
    HostName 你的新服务器IP          # 例如: 47.98.123.45
    User root                       # 或 deploy
    Port 22
    IdentityFile ~/.ssh/sdszk_aliyun_key

    # 保持连接活跃 (防止超时断开)
    ServerAliveInterval 60
    ServerAliveCountMax 3

    # 启用连接复用 (加速后续连接)
    ControlMaster auto
    ControlPath ~/.ssh/sockets/%r@%h:%p
    ControlPersist 10m

    # 严格主机密钥检查 (生产环境推荐)
    StrictHostKeyChecking ask

    # 日志级别 (调试时可改为 DEBUG)
    LogLevel INFO
```

**进阶配置** (针对山东省思政课项目):

```ssh-config
# 生产环境服务器
Host sdszk-prod
    HostName 生产服务器IP
    User deploy                     # 使用非 root 用户
    Port 22
    IdentityFile ~/.ssh/sdszk_aliyun_key
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ControlMaster auto
    ControlPath ~/.ssh/sockets/%r@%h:%p
    ControlPersist 10m

    # 额外安全措施
    ForwardAgent no                 # 禁用代理转发
    ForwardX11 no                   # 禁用 X11 转发

# 测试/开发环境服务器
Host sdszk-dev
    HostName 测试服务器IP
    User root
    Port 22
    IdentityFile ~/.ssh/sdszk_aliyun_key
    ServerAliveInterval 60
    StrictHostKeyChecking no        # 开发环境可放宽
    UserKnownHostsFile /dev/null    # 不保存 known_hosts

# 通配符配置 (应用到所有 sdszk 服务器)
Host sdszk-*
    Compression yes                 # 启用压缩
    TCPKeepAlive yes
```

---

### 步骤 3: 创建连接复用目录

```bash
# 创建 socket 目录 (用于 ControlPath)
mkdir -p ~/.ssh/sockets
chmod 700 ~/.ssh/sockets
```

---

### 步骤 4: 上传公钥到新服务器

**方式 A: 使用 ssh-copy-id (推荐)**

```bash
# 自动上传公钥
ssh-copy-id -i ~/.ssh/sdszk_aliyun_key.pub root@新服务器IP

# 如果修改了端口
ssh-copy-id -i ~/.ssh/sdszk_aliyun_key.pub -p 2222 root@新服务器IP
```

**方式 B: 手动上传** (当 ssh-copy-id 不可用时)

```bash
# 1. 复制公钥到剪贴板
cat ~/.ssh/sdszk_aliyun_key.pub | pbcopy

# 2. 首次使用密码登录服务器
ssh root@新服务器IP

# 3. 在服务器上添加公钥
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys  # 粘贴公钥内容
chmod 600 ~/.ssh/authorized_keys
```

**方式 C: 通过阿里云控制台** (最安全)

```bash
# 1. 显示公钥内容
cat ~/.ssh/sdszk_aliyun_key.pub

# 2. 登录阿里云控制台
#    ECS → 网络与安全 → 密钥对 → 导入密钥对
#    粘贴公钥内容 → 绑定到实例 → 重启实例
```

---

### 步骤 5: 服务器端安全加固

**登录新服务器后执行**:

```bash
# 备份原配置
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# 编辑 SSH 配置
sudo nano /etc/ssh/sshd_config
```

**推荐安全配置**:

```bash
# ============ 核心安全设置 ============
# 禁用密码登录 (仅密钥认证)
PasswordAuthentication no
ChallengeResponseAuthentication no

# 禁用空密码
PermitEmptyPasswords no

# 禁用 root 密码登录 (但允许密钥登录)
PermitRootLogin prohibit-password

# 启用公钥认证
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# 限制认证尝试次数
MaxAuthTries 3
MaxSessions 5

# ============ 网络安全 ============
# 限制登录用户 (推荐)
AllowUsers root deploy

# 或限制用户组
# AllowGroups ssh-users

# 监听地址 (可选: 仅监听内网)
# ListenAddress 172.16.0.10

# 禁用不安全的功能
X11Forwarding no
PermitTunnel no
AllowAgentForwarding no
AllowTcpForwarding no

# ============ 性能优化 ============
# 启用压缩
Compression yes

# 加速连接
UseDNS no

# 保持连接
ClientAliveInterval 60
ClientAliveCountMax 3

# ============ 日志审计 ============
# 详细日志
LogLevel VERBOSE
SyslogFacility AUTH
```

**应用配置**:

```bash
# 验证配置语法
sudo sshd -t

# 重启 SSH 服务
sudo systemctl restart sshd
# 或
sudo service ssh restart
```

---

### 步骤 6: 配置阿里云安全组

**精细化 IP 白名单** (生产环境强烈推荐):

```bash
# 1. 获取你的公网 IP
curl -4 ifconfig.me

# 2. 在阿里云控制台配置:
#    ECS → 安全组 → 配置规则 → 添加入方向规则
```

| 字段     | 配置              |
| -------- | ----------------- |
| 授权策略 | 允许              |
| 协议类型 | SSH(22)           |
| 端口范围 | 22/22             |
| 授权对象 | `你的公网IP/32`   |
| 描述     | 办公网络 SSH 访问 |

**多 IP 白名单配置**:

```
# 办公室
123.45.67.89/32

# 家庭网络
98.76.54.32/32

# VPN 网关 (如果使用)
10.0.1.0/24
```

---

### 步骤 7: 测试连接

```bash
# 基础连接测试
ssh sdszk-new

# 详细调试模式
ssh -vvv sdszk-new

# 验证密钥认证
ssh -o PreferredAuthentications=publickey sdszk-new

# 测试连接复用
ssh sdszk-new 'uptime'
ssh sdszk-new 'hostname'  # 第二次连接会更快
```

---

## 🔧 完整配置脚本

创建 `~/bin/setup-sdszk-ssh.sh`:

```bash
#!/bin/bash
set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔐 山东省思政课项目 - SSH 配置工具${NC}\n"

# 配置变量
KEY_NAME="sdszk_aliyun_key"
KEY_PATH="$HOME/.ssh/$KEY_NAME"
SERVER_IP=""
SERVER_USER="root"

# 读取服务器信息
read -p "请输入新服务器 IP 地址: " SERVER_IP
read -p "请输入登录用户名 [root]: " input_user
SERVER_USER=${input_user:-root}

echo -e "\n${YELLOW}步骤 1/5: 生成 SSH 密钥对${NC}"
if [ -f "$KEY_PATH" ]; then
  echo "⚠️  密钥已存在: $KEY_PATH"
  read -p "是否覆盖? (y/N): " overwrite
  if [[ $overwrite =~ ^[Yy]$ ]]; then
    rm -f "$KEY_PATH" "${KEY_PATH}.pub"
  else
    echo "使用现有密钥"
  fi
fi

if [ ! -f "$KEY_PATH" ]; then
  ssh-keygen -t ed25519 \
    -C "sdszk-redesign@aliyun" \
    -f "$KEY_PATH" \
    -N ""
  echo -e "${GREEN}✓ 密钥生成成功${NC}"
fi

echo -e "\n${YELLOW}步骤 2/5: 配置 SSH Config${NC}"
mkdir -p ~/.ssh/sockets
chmod 700 ~/.ssh/sockets

CONFIG_BLOCK="
# ========================================
# 山东省思政课一体化中心 - 阿里云 ECS
# ========================================
Host sdszk-new
    HostName $SERVER_IP
    User $SERVER_USER
    Port 22
    IdentityFile $KEY_PATH
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ControlMaster auto
    ControlPath ~/.ssh/sockets/%r@%h:%p
    ControlPersist 10m
"

if ! grep -q "Host sdszk-new" ~/.ssh/config 2>/dev/null; then
  echo "$CONFIG_BLOCK" >> ~/.ssh/config
  chmod 600 ~/.ssh/config
  echo -e "${GREEN}✓ SSH Config 配置完成${NC}"
else
  echo "⚠️  配置已存在,跳过"
fi

echo -e "\n${YELLOW}步骤 3/5: 显示公钥${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cat "${KEY_PATH}.pub"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 复制到剪贴板
cat "${KEY_PATH}.pub" | pbcopy
echo -e "📋 ${GREEN}公钥已复制到剪贴板${NC}"

echo -e "\n${YELLOW}步骤 4/5: 上传公钥到服务器${NC}"
echo "请选择上传方式:"
echo "  1) 自动上传 (ssh-copy-id)"
echo "  2) 手动上传 (使用密码登录)"
echo "  3) 阿里云控制台导入 (最安全)"
echo "  4) 跳过此步骤"
read -p "请选择 [1-4]: " upload_method

case $upload_method in
  1)
    ssh-copy-id -i "${KEY_PATH}.pub" "$SERVER_USER@$SERVER_IP" && \
      echo -e "${GREEN}✓ 公钥上传成功${NC}"
    ;;
  2)
    echo -e "\n请执行以下命令:"
    echo -e "${YELLOW}ssh $SERVER_USER@$SERVER_IP${NC}"
    echo -e "${YELLOW}mkdir -p ~/.ssh && chmod 700 ~/.ssh${NC}"
    echo -e "${YELLOW}nano ~/.ssh/authorized_keys  # 粘贴公钥${NC}"
    echo -e "${YELLOW}chmod 600 ~/.ssh/authorized_keys${NC}"
    ;;
  3)
    echo -e "\n请访问阿里云控制台:"
    echo "  ECS → 网络与安全 → 密钥对 → 导入密钥对"
    echo "  粘贴剪贴板中的公钥 → 绑定到实例 → 重启实例"
    ;;
  *)
    echo "跳过公钥上传"
    ;;
esac

echo -e "\n${YELLOW}步骤 5/5: 测试连接${NC}"
read -p "是否现在测试连接? (y/N): " test_conn

if [[ $test_conn =~ ^[Yy]$ ]]; then
  echo "正在连接到 sdszk-new..."
  ssh -o ConnectTimeout=10 sdszk-new 'echo "✓ SSH 连接成功!" && uptime'
fi

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 配置完成!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n使用方式:"
echo -e "  ${YELLOW}ssh sdszk-new${NC}  # 连接到新服务器"
echo -e "\n后续步骤:"
echo -e "  1. 配置服务器端 SSH 安全设置"
echo -e "  2. 配置阿里云安全组规则"
echo -e "  3. 创建非 root 部署用户"
echo -e "\n详细文档: docs/deployment/ssh-setup-guide.md"
```

**使用方式**:

```bash
chmod +x ~/bin/setup-sdszk-ssh.sh
~/bin/setup-sdszk-ssh.sh
```

---

## 📝 完整 SSH Config 示例

**你的最终配置应该是这样**:

```ssh-config
# ========================================
# 全局默认配置
# ========================================
Host *
    AddKeysToAgent yes
    UseKeychain yes

# ========================================
# 霍斯杜鲁特 ECS (现有配置 - 保持不变)
# ========================================
Host aliyun-ecs
    HostName 60.205.124.67
    User root
    IdentityFile /Users/liguoma/aliyun/keys/key4vscode.pem
    Port 22
    TCPKeepAlive yes
    ServerAliveInterval 60

# ========================================
# 五好学堂项目 ECS (现有配置 - 保持不变)
# ========================================
Host wuhao-tutor
    HostName 121.199.173.244
    User root
    IdentityFile ~/.ssh/id_ed25519
    AddKeysToAgent yes
    UseKeychain yes
    TCPKeepAlive yes
    ServerAliveInterval 60

# ========================================
# 山东省思政课一体化中心 - 新阿里云 ECS
# ========================================
Host sdszk-prod
    HostName 新服务器IP
    User deploy
    Port 22
    IdentityFile ~/.ssh/sdszk_aliyun_key
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ControlMaster auto
    ControlPath ~/.ssh/sockets/%r@%h:%p
    ControlPersist 10m
    ForwardAgent no
    ForwardX11 no
    StrictHostKeyChecking ask

# 开发/测试环境 (可选)
Host sdszk-dev
    HostName 测试服务器IP
    User root
    Port 22
    IdentityFile ~/.ssh/sdszk_aliyun_key
    ServerAliveInterval 60
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null

# 通配符配置
Host sdszk-*
    Compression yes
    TCPKeepAlive yes
```

---

## 🎯 部署工作流集成

### 在项目中使用新 SSH 配置

**更新部署脚本** (`scripts/deployment/deploy-aliyun.sh`):

```bash
# 在脚本开头添加
SSH_HOST="${SSH_HOST:-sdszk-prod}"  # 默认使用生产环境

# 替换原来的 SSH 命令
ssh "$SSH_HOST" "command"

# 或者通过环境变量指定
export SSH_HOST=sdszk-dev  # 切换到开发环境
npm run deploy:aliyun
```

### 快速切换环境

创建 `~/.zshrc` 别名:

```bash
# SSH 快捷命令
alias ssh-sdszk='ssh sdszk-prod'
alias ssh-sdszk-dev='ssh sdszk-dev'
alias ssh-wuhao='ssh wuhao-tutor'
alias ssh-hordu='ssh aliyun-ecs'

# 部署快捷命令
alias deploy-sdszk='cd ~/my-devs/javascript/sdszk-redesign && npm run deploy:aliyun'
alias deploy-sdszk-quick='cd ~/my-devs/javascript/sdszk-redesign && npm run deploy:quick'
```

---

## 🔒 安全检查清单

### 配置完成后验证:

```bash
# ✅ 1. 验证密钥权限
ls -la ~/.ssh/sdszk_aliyun_key*
# 应该显示: -rw------- (600)

# ✅ 2. 验证 config 权限
ls -la ~/.ssh/config
# 应该显示: -rw------- (600)

# ✅ 3. 测试密钥认证
ssh -o PreferredAuthentications=publickey sdszk-prod 'whoami'

# ✅ 4. 验证服务器 SSH 配置
ssh sdszk-prod 'sudo sshd -T | grep -E "(PasswordAuthentication|PubkeyAuthentication|PermitRootLogin)"'

# ✅ 5. 检查安全组规则
# 在阿里云控制台验证只有你的 IP 可访问 22 端口

# ✅ 6. 测试连接复用
time ssh sdszk-prod 'uptime'  # 第一次
time ssh sdszk-prod 'uptime'  # 第二次应该更快
```

---

## 🚨 故障排除

### 常见问题速查

| 错误信息                           | 原因                   | 解决方案                                          |
| ---------------------------------- | ---------------------- | ------------------------------------------------- |
| `Permission denied (publickey)`    | 公钥未上传或权限错误   | 检查 `authorized_keys` 和密钥权限                 |
| `Connection refused`               | 端口未开放或服务未启动 | 检查安全组和 sshd 状态                            |
| `Too many authentication failures` | 尝试了过多密钥         | 在 config 中明确指定 `IdentitiesOnly yes`         |
| `Bad owner or permissions`         | config 或密钥权限错误  | `chmod 600 ~/.ssh/config ~/.ssh/sdszk_aliyun_key` |
| 连接频繁断开                       | 网络不稳定或超时       | 增加 `ServerAliveInterval` 和 `TCPKeepAlive`      |

### 调试命令

```bash
# 超详细调试输出
ssh -vvv sdszk-prod

# 仅测试密钥认证
ssh -o PreferredAuthentications=publickey -o IdentitiesOnly=yes sdszk-prod

# 测试特定密钥
ssh -i ~/.ssh/sdszk_aliyun_key root@服务器IP

# 查看服务器端日志
ssh sdszk-prod 'sudo tail -f /var/log/auth.log'  # Ubuntu/Debian
ssh sdszk-prod 'sudo tail -f /var/log/secure'     # CentOS/RHEL
```

---

## 📚 相关文档

- [阿里云部署指南](../deployment-guide.md)
- [环境变量配置](../environment-variables.md)
- [PM2 进程管理](../../scripts/deployment/pm2-manager.sh)

---

**更新日期**: 2025-10-14  
**维护者**: liguoma  
**版本**: v1.0
