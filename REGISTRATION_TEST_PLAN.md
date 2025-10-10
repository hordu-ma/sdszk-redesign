# 用户注册功能集成测试计划

## 测试环境要求
- Node.js 18+ 
- MongoDB 运行在默认端口27017
- Redis 运行在默认端口6379（生产环境）或使用内存存储（开发环境）

## 测试场景

### 1. 后端API测试

#### 1.1 发送验证码 API - POST /api/auth/send-code
**测试用例：**
- ✅ 成功发送验证码 (手机号格式正确)
- ✅ 手机号格式错误 (返回400错误)
- ✅ 频率限制测试 (60秒内重复发送，返回429错误)
- ✅ 开发环境验证码在控制台输出

**测试命令：**
```bash
# 成功案例
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"13812345678"}'

# 格式错误案例  
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"12345"}'

# 频率限制测试（连续两次）
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"13812345678"}'
```

#### 1.2 用户注册 API - POST /api/auth/register
**测试用例：**
- ✅ 完整注册流程成功
- ✅ 必填字段缺失 (返回400错误)
- ✅ 用户名重复 (返回400错误)
- ✅ 邮箱重复 (返回400错误)
- ✅ 手机号重复 (返回400错误)
- ✅ 验证码错误 (返回400错误)
- ✅ 验证码过期 (返回400错误)

**测试命令：**
```bash
# 成功注册（需要先获取验证码）
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testuser",
    "fullName":"测试用户",
    "password":"password123",
    "email":"test@example.com",
    "phone":"13812345678",
    "verificationCode":"123456"
  }'

# 缺失必填字段
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}'
```

### 2. 前端功能测试

#### 2.1 注册表单验证
**测试步骤：**
1. 访问 `http://localhost:5173/auth`
2. 切换到"注册"标签
3. 测试表单验证：
   - ✅ 用户名长度验证 (4-16位)
   - ✅ 真实姓名必填验证
   - ✅ 密码长度验证 (8-20位)
   - ✅ 确认密码一致性验证
   - ✅ 邮箱格式验证
   - ✅ 手机号格式验证 (1[3-9]\\d{9})
   - ✅ 验证码长度验证 (6位)

#### 2.2 验证码功能测试
**测试步骤：**
1. 输入正确格式的手机号
2. 点击"获取验证码"按钮
3. 验证：
   - ✅ 按钮显示60秒倒计时
   - ✅ 倒计时期间按钮禁用
   - ✅ 开发环境控制台显示验证码
   - ✅ 60秒后按钮恢复可用

#### 2.3 完整注册流程测试
**测试步骤：**
1. 填写所有注册信息
2. 获取验证码
3. 输入验证码并提交
4. 验证：
   - ✅ 注册成功后自动登录
   - ✅ 跳转到首页
   - ✅ 用户状态更新为已登录
   - ✅ Token保存到localStorage

### 3. 数据验证测试

#### 3.1 数据库记录验证
**验证项目：**
- ✅ 用户记录正确创建在MongoDB
- ✅ 密码正确加密存储
- ✅ 角色设置为"user"
- ✅ 默认权限正确分配: ["news:read", "resources:read", "activities:read"]
- ✅ 唯一性约束生效 (username, email, phone)

**MongoDB查询命令：**
```javascript
// 查看新注册的用户
db.users.findOne({username: "testuser"})

// 验证密码是否加密
db.users.findOne({username: "testuser"}, {password: 1})

// 验证权限设置
db.users.findOne({username: "testuser"}, {role: 1, permissions: 1})
```

#### 3.2 验证码服务验证
**验证项目：**
- ✅ 验证码在内存中正确存储
- ✅ 验证码5分钟自动过期
- ✅ 验证成功后验证码立即删除
- ✅ 同手机号60秒频率限制生效

### 4. 安全性测试

#### 4.1 频率限制测试
**测试项目：**
- ✅ /api/auth/send-code 每IP 20次/5分钟
- ✅ /api/auth/register 每IP 20次/5分钟
- ✅ 同手机号验证码发送 60秒间隔

#### 4.2 输入验证测试
**测试项目：**
- ✅ SQL注入防护 (使用Mongoose自动防护)
- ✅ XSS防护 (前端输入过滤)
- ✅ 手机号格式严格验证
- ✅ 邮箱格式严格验证

### 5. 错误处理测试

#### 5.1 网络错误处理
**测试场景：**
- ✅ 后端服务不可用时的错误提示
- ✅ 请求超时的错误处理
- ✅ 429错误的友好提示

#### 5.2 用户体验测试
**测试项目：**
- ✅ 加载状态显示
- ✅ 错误消息清晰易懂
- ✅ 成功提示及时反馈
- ✅ 表单重置正确

## 预期结果

### 成功场景
1. 用户能够完成完整的注册流程
2. 注册成功后自动登录并跳转首页
3. 用户数据正确保存到数据库
4. 验证码功能正常工作

### 错误场景
1. 各种输入错误能得到清晰的错误提示
2. 频率限制和安全防护正常工作
3. 系统在异常情况下保持稳定

## 测试执行清单

### 手动测试步骤
- [ ] 启动开发环境 (`npm run server:dev` 和 `npm run dev`)
- [ ] 访问注册页面 `http://localhost:5173/auth`
- [ ] 执行上述所有测试场景
- [ ] 验证数据库记录
- [ ] 检查控制台日志

### 自动化测试
- [ ] 运行后端单元测试 (`npm run test:server`)
- [ ] 运行前端单元测试 (`npm run test`)
- [ ] 运行E2E测试 (`npm run test:e2e:basic`)

## 问题排查指南

### 常见问题
1. **验证码未在控制台显示**
   - 检查环境变量 `NODE_ENV=development`
   - 确认verificationService正确导入

2. **验证码验证失败**
   - 检查verificationService的验证逻辑
   - 确认验证码在验证后被正确删除

3. **频率限制不生效**
   - 检查express-rate-limit中间件配置
   - 确认路由应用了正确的限制器

4. **用户无法注册**
   - 检查数据库连接
   - 验证User模型的schema
   - 查看后端错误日志

### 日志检查
- 后端日志：`server/logs/` 目录
- 验证码日志：控制台输出 "🔐 验证码发送到 xxx: xxxxxx"
- 认证日志：查看authLogger输出