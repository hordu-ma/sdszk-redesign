# 功能测试手册

## 🧪 核心功能测试指南

### 测试准备

1. 确保开发环境正常运行
2. 准备测试数据
3. 清空测试数据库（如需要）

---

## 1. 用户认证系统测试

### 1.1 用户注册测试

**测试步骤**:

```bash
# 测试API - 用户注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "123456",
    "email": "test@example.com",
    "name": "测试用户"
  }'
```

**预期结果**:

- ✅ 返回状态码 201
- ✅ 返回用户信息（不含密码）
- ✅ 生成 JWT Token

**测试边界情况**:

- [ ] 用户名重复注册
- [ ] 密码长度不足
- [ ] 邮箱格式错误
- [ ] 必填字段缺失

### 1.2 用户登录测试

**测试步骤**:

```bash
# 测试API - 用户登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "123456"
  }'
```

**预期结果**:

- ✅ 返回状态码 200
- ✅ 返回 JWT Token
- ✅ 设置 HTTP-only Cookie

**测试边界情况**:

- [ ] 错误的用户名
- [ ] 错误的密码
- [ ] 禁用的账户
- [ ] 空用户名或密码

### 1.3 权限验证测试

**测试步骤**:

```bash
# 测试受保护的路由
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**预期结果**:

- ✅ 有效Token返回用户信息
- ✅ 无效Token返回401错误
- ✅ 过期Token返回401错误

---

## 2. 资讯中心系统测试

### 2.1 获取新闻列表

**测试步骤**:

```bash
# 获取新闻列表
curl -X GET "http://localhost:3000/api/news?page=1&limit=10"

# 按分类筛选
curl -X GET "http://localhost:3000/api/news?category=center&page=1&limit=5"
```

**验证要点**:

- [ ] 分页功能正常
- [ ] 分类筛选有效
- [ ] 排序按发布时间倒序
- [ ] 返回正确的分页信息

### 2.2 新闻详情查看

**测试步骤**:

```bash
# 获取单个新闻
curl -X GET http://localhost:3000/api/news/NEWS_ID
```

**验证要点**:

- [ ] 返回完整新闻内容
- [ ] 浏览量自动增加
- [ ] 不存在的ID返回404
- [ ] 包含相关字段信息

### 2.3 新闻管理功能（需管理员权限）

**测试步骤**:

```bash
# 创建新闻
curl -X POST http://localhost:3000/api/admin/news \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试新闻标题",
    "content": "这是测试新闻内容...",
    "category": "center",
    "author": "测试作者"
  }'

# 更新新闻
curl -X PUT http://localhost:3000/api/admin/news/NEWS_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新后的标题"
  }'

# 删除新闻
curl -X DELETE http://localhost:3000/api/admin/news/NEWS_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**验证要点**:

- [ ] 非管理员无法创建/编辑
- [ ] 输入验证正常工作
- [ ] 操作日志记录正确
- [ ] 软删除功能正常

---

## 3. 资源中心系统测试

### 3.1 资源列表获取

**测试步骤**:

```bash
# 获取资源列表
curl -X GET "http://localhost:3000/api/resources?page=1&limit=10"

# 搜索资源
curl -X GET "http://localhost:3000/api/resources?search=PPT&page=1"

# 按类别筛选
curl -X GET "http://localhost:3000/api/resources?category=pdf&page=1"
```

**验证要点**:

- [ ] 分页功能正常
- [ ] 搜索功能有效
- [ ] 分类筛选准确
- [ ] 只显示已发布资源

### 3.2 文件上传测试

**测试步骤**:

```bash
# 上传文件
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer USER_TOKEN" \
  -F "file=@test.pdf" \
  -F "type=resource"
```

**验证要点**:

- [ ] 支持的文件类型正常上传
- [ ] 不支持的文件类型被拒绝
- [ ] 文件大小限制生效
- [ ] 上传进度反馈正常

### 3.3 资源下载测试

**测试步骤**:

```bash
# 下载资源
curl -X GET http://localhost:3000/api/resources/RESOURCE_ID/download \
  -H "Authorization: Bearer USER_TOKEN" \
  -O
```

**验证要点**:

- [ ] 权限验证正常
- [ ] 下载次数统计正确
- [ ] 文件完整性验证
- [ ] 下载历史记录

---

## 4. 后台管理系统测试

### 4.1 用户管理

**测试步骤**:
访问管理后台: `http://localhost:5173/admin/users`

**测试项目**:

- [ ] 用户列表显示正常
- [ ] 用户搜索功能
- [ ] 用户权限编辑
- [ ] 用户状态切换（启用/禁用）
- [ ] 用户删除功能

### 4.2 内容管理

**测试步骤**:
访问内容管理: `http://localhost:5173/admin/news`

**测试项目**:

- [ ] 新闻列表管理
- [ ] 新闻编辑器功能
- [ ] 图片上传功能
- [ ] 发布/撤回功能
- [ ] 批量操作功能

### 4.3 数据统计

**测试步骤**:
访问数据面板: `http://localhost:5173/admin/dashboard`

**测试项目**:

- [ ] 用户统计图表
- [ ] 内容统计数据
- [ ] 访问量统计
- [ ] 下载量统计
- [ ] 实时数据更新

---

## 5. 前端功能测试

### 5.1 首页功能

**测试步骤**:
访问首页: `http://localhost:5173/`

**测试项目**:

- [ ] 页面加载速度
- [ ] 轮播图功能
- [ ] 最新资讯显示
- [ ] 快速链接功能
- [ ] 响应式布局

### 5.2 用户中心

**测试步骤**:
访问用户中心: `http://localhost:5173/user`

**测试项目**:

- [ ] 个人信息编辑
- [ ] 头像上传功能
- [ ] 密码修改
- [ ] 收藏列表（待实现）
- [ ] 浏览历史（待实现）

### 5.3 搜索功能

**测试步骤**:
使用全站搜索功能

**测试项目**:

- [ ] 关键词搜索
- [ ] 搜索结果分类
- [ ] 搜索历史记录
- [ ] 高级搜索选项
- [ ] 搜索结果分页

---

## 6. 性能测试

### 6.1 加载性能测试

**测试工具**: Chrome DevTools

**测试指标**:

- [ ] 首页加载时间 < 3秒
- [ ] API 响应时间 < 500ms
- [ ] 图片优化加载
- [ ] 静态资源缓存

### 6.2 并发测试

**测试工具**: Apache Bench (ab)

```bash
# 并发登录测试
ab -n 100 -c 10 -p login.json -T application/json http://localhost:3000/api/auth/login

# 并发获取新闻列表
ab -n 1000 -c 50 http://localhost:3000/api/news
```

**验证要点**:

- [ ] 服务器稳定性
- [ ] 数据库连接池
- [ ] 内存使用情况
- [ ] 错误率控制

---

## 7. 安全性测试

### 7.1 输入验证测试

**测试项目**:

- [ ] SQL 注入防护
- [ ] XSS 攻击防护
- [ ] CSRF 攻击防护
- [ ] 文件上传安全

### 7.2 权限控制测试

**测试项目**:

- [ ] 垂直权限验证
- [ ] 水平权限验证
- [ ] API 访问控制
- [ ] 文件访问权限

---

## 🐛 问题记录模板

### 问题记录表格

| 测试模块 | 问题描述          | 严重程度 | 复现步骤                       | 期望结果 | 实际结果 | 状态   |
| -------- | ----------------- | -------- | ------------------------------ | -------- | -------- | ------ |
| 用户登录 | Token过期处理异常 | 高       | 1. 登录 2. 等待过期 3. 访问API | 返回401  | 返回500  | 待修复 |

### 测试环境信息

- **操作系统**: macOS
- **浏览器**: Chrome 最新版
- **Node.js版本**: 18.x
- **数据库版本**: MongoDB 6.x
- **测试时间**: 2025年6月4日

---

## 📋 测试清单检查

### 功能模块完成度

- [ ] 用户认证系统 (100%)
- [ ] 资讯中心功能 (90%)
- [ ] 资源中心功能 (85%)
- [ ] 后台管理系统 (90%)
- [ ] 文件上传功能 (80%)
- [ ] 前端页面功能 (85%)

### 测试类型完成度

- [ ] 功能测试 (待进行)
- [ ] 界面测试 (待进行)
- [ ] 兼容性测试 (待进行)
- [ ] 性能测试 (待进行)
- [ ] 安全性测试 (待进行)

**下一步**: 开始执行手动功能测试，记录发现的问题，并逐一修复。
