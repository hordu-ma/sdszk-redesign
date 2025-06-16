# 项目API架构分析文档

## 1. 总体架构概览

### 1.1 API架构模式

- **前端**: 基于模块化设计的API客户端
- **后端**: RESTful API + Express.js框架
- **数据传输**: JSON格式，统一响应结构
- **认证方式**: JWT Token + Bearer认证

### 1.2 目录结构

```
前端API相关文件：
src/api/
├── index.ts           # API模块统一导出
├── base.ts           # 基础API类和请求封装
├── types.ts          # API类型定义
└── modules/          # 功能模块API
    ├── auth.ts       # 认证相关API
    ├── news/         # 新闻模块API
    ├── resources/    # 资源模块API
    ├── admin.ts      # 管理后台API
    ├── newsCategory/ # 新闻分类API
    └── settings.ts   # 系统设置API

后端API相关文件：
server/
├── app.js            # Express应用主入口
├── routes/           # 路由配置
├── controllers/      # 业务逻辑控制器
├── models/           # 数据模型
├── middleware/       # 中间件
└── utils/            # 工具函数
```

## 2. 前端API实现分析

### 2.1 基础架构 (`src/api/base.ts`)

```typescript
// 核心功能：
1. HTTP请求封装 (axios)
2. 请求/响应拦截器
3. 错误处理统一化
4. Token自动添加
5. 响应数据标准化

// 主要类：
export class BaseApi {
  protected baseURL: string = '/api'

  // 请求拦截器：自动添加Authorization header
  // 响应拦截器：统一错误处理和数据格式化

  async get<T>(endpoint: string, params?: object): Promise<ApiResponse<T>>
  async post<T>(endpoint: string, data?: object): Promise<ApiResponse<T>>
  async put<T>(endpoint: string, data?: object): Promise<ApiResponse<T>>
  async delete<T>(endpoint: string): Promise<ApiResponse<T>>
}
```

**关键逻辑**：

- 所有请求自动添加`Authorization: Bearer ${token}`
- 统一错误码处理 (401自动跳转登录)
- 响应数据包装为`ApiResponse<T>`格式

### 2.2 类型定义 (`src/api/types.ts`)

```typescript
// 统一响应格式
interface ApiResponse<T> {
  success: boolean;
  status: string;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
}

// 分页元数据
interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// 查询参数基类
interface BaseQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
```

### 2.3 认证API (`src/api/modules/auth.ts`)

```typescript
class AuthApi extends BaseApi {
  // 核心功能：
  1. 用户登录/注册
  2. Token刷新
  3. 用户信息获取
  4. 密码重置

  // 主要方法：
  async login(credentials: LoginCredentials): Promise<AuthResponse>
  async register(userData: RegisterData): Promise<AuthResponse>
  async getCurrentUser(): Promise<ApiResponse<UserInfo>>
  async logout(): Promise<ApiResponse<void>>
  async refreshToken(): Promise<ApiResponse<TokenResponse>>
}
```

**认证流程**：

1. 登录 → 获取JWT token → 存储到localStorage
2. 每次请求 → 自动携带token
3. Token过期 → 自动刷新或跳转登录

### 2.4 新闻API (`src/api/modules/news/index.ts`)

```typescript
class NewsApi extends BaseApi {
  constructor() { super('/news') }

  // 核心功能：
  1. 新闻列表查询 (支持分类筛选、分页、搜索)
  2. 新闻详情获取
  3. 新闻CRUD操作
  4. 分类管理

  // 查询参数接口：
  interface NewsQueryParams extends BaseQueryParams {
    category?: string      // 分类ID或key
    featured?: boolean     // 是否推荐
    status?: string       // 发布状态
    keyword?: string      // 搜索关键词
    author?: string       // 作者筛选
    startDate?: string    // 开始日期
    endDate?: string      // 结束日期
  }

  // 主要方法：
  async getList(params?: NewsQueryParams): Promise<PaginatedResponse<NewsItem[]>>
  async getDetail(id: string): Promise<ApiResponse<NewsItem>>
  async create(data: CreateNewsData): Promise<ApiResponse<NewsItem>>
  async update(id: string, data: UpdateNewsData): Promise<ApiResponse<NewsItem>>
  async delete(id: string): Promise<ApiResponse<void>>
}
```

**新闻数据模型**：

```typescript
interface NewsItem {
  id: string;
  title: string;
  content: string;
  summary?: string;
  author: string;
  category: NewsCategory;
  categoryId: string;
  categoryKey: string;
  categoryName: string;
  viewCount: number;
  featured: boolean;
  publishDate: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "published" | "archived";
  tags?: string[];
  thumbnail?: string;
}
```

### 2.5 资源API (`src/api/modules/resources/index.ts`)

```typescript
class ResourceApi extends BaseApi {
  constructor() { super('/resources') }

  // 核心功能：
  1. 资源列表查询 (支持分类、类型筛选)
  2. 资源详情获取
  3. 文件上传/下载
  4. 资源管理

  // 资源类型常量：
  RESOURCE_CATEGORIES = {
    theory: '理论前沿',
    teaching: '教学研究',
    video: '影像思政'
  }

  // 查询参数：
  interface ResourceQueryParams extends BaseQueryParams {
    category?: string     // 分类
    fileType?: string    // 文件类型
    featured?: boolean   // 是否推荐
    keyword?: string     // 搜索关键词
  }

  // 主要方法：
  async getList(params?: ResourceQueryParams): Promise<PaginatedResponse<ResourceItem[]>>
  async getDetail(id: string): Promise<ApiResponse<ResourceItem>>
  async upload(file: File, metadata: ResourceMetadata): Promise<ApiResponse<ResourceItem>>
  async download(id: string): Promise<Blob>
}
```

**资源数据模型**：

```typescript
interface ResourceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryId: string;
  fileType: string;
  fileSize: number;
  downloadUrl: string;
  thumbnailUrl?: string;
  viewCount: number;
  downloadCount: number;
  isFeatured: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}
```

### 2.6 管理后台API (`src/api/modules/admin.ts`)

```typescript
class AdminApi extends BaseApi {
  constructor() { super('/admin') }

  // 核心功能：
  1. 仪表板数据统计
  2. 用户管理
  3. 内容管理
  4. 系统监控

  // 主要方法：
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>>
  async getVisitTrends(period: '7d' | '30d' | '90d'): Promise<ApiResponse<TrendData[]>>
  async getRecentActivities(): Promise<ApiResponse<ActivityItem[]>>
  async getUserList(params?: UserQueryParams): Promise<PaginatedResponse<UserItem[]>>
  async getUserDetail(id: string): Promise<ApiResponse<UserDetail>>
  async updateUserStatus(id: string, status: string): Promise<ApiResponse<void>>
}
```

### 2.7 系统设置API (`src/api/modules/settings.ts`)

```typescript
class SettingsApi extends BaseApi {
  constructor() {
    super("/settings");
  }

  // 设置分组：
  SETTING_GROUPS = {
    site: "网站设置",
    system: "系统设置",
    email: "邮件设置",
    security: "安全设置",
    backup: "备份设置",
  };

  // 主要方法：
  async getAll(): Promise<ApiResponse<SettingsGroup[]>>;
  async getByGroup(group: string): Promise<ApiResponse<SettingItem[]>>;
  async update(key: string, value: any): Promise<ApiResponse<void>>;
  async batchUpdate(settings: SettingUpdate[]): Promise<ApiResponse<void>>;
}
```

## 3. 后端API实现分析

### 3.1 Express应用配置 (`server/app.js`)

```javascript
// 核心配置：
1. 中间件配置 (cors, body-parser, morgan)
2. 路由挂载
3. 错误处理
4. 静态文件服务

// 路由挂载：
app.use('/api/auth', authRoutes)           // 认证路由
app.use('/api/news', newsRoutes)           // 新闻路由
app.use('/api/resources', resourceRoutes)  // 资源路由
app.use('/api/admin', adminRoutes)         // 管理路由
app.use('/api/settings', settingsRoutes)  // 设置路由
app.use('/api/uploads', uploadsRoutes)     // 文件上传路由

// 全局错误处理中间件
app.use(errorHandler)
```

### 3.2 路由配置分析

#### 3.2.1 认证路由 (`server/routes/auth.js`)

```javascript
// 路由映射：
POST   /api/auth/register     → authController.register
POST   /api/auth/login        → authController.login
POST   /api/auth/logout       → authController.logout
GET    /api/auth/profile      → authController.getProfile
PUT    /api/auth/profile      → authController.updateProfile
PUT    /api/auth/password     → authController.changePassword
POST   /api/auth/refresh      → authController.refreshToken

// 中间件：
- body validation (express-validator)
- rate limiting (登录接口)
```

#### 3.2.2 新闻路由 (`server/routes/news.js`)

```javascript
// 公开路由 (无需认证)：
GET    /api/news              → newsController.getNewsList
GET    /api/news/:id          → newsController.getNewsById

// 管理路由 (需要认证)：
POST   /api/news              → auth → newsController.createNews
PUT    /api/news/:id          → auth → newsController.updateNews
DELETE /api/news/:id          → auth → newsController.deleteNews
PUT    /api/news/:id/status   → auth → newsController.updateStatus

// 中间件链：
1. auth (JWT验证)
2. permission (权限检查)
3. validation (数据验证)
4. controller (业务逻辑)
```

#### 3.2.3 资源路由 (`server/routes/resources.js`)

```javascript
// 公开路由：
GET    /api/resources         → resourceController.getResourceList
GET    /api/resources/:id     → resourceController.getResourceById

// 管理路由：
POST   /api/resources         → auth → upload → resourceController.createResource
PUT    /api/resources/:id     → auth → resourceController.updateResource
DELETE /api/resources/:id     → auth → resourceController.deleteResource

// 文件处理：
- multer (文件上传中间件)
- file type validation
- size limits
```

### 3.3 控制器逻辑分析

#### 3.3.1 认证控制器 (`server/controllers/authController.js`)

```javascript
// 核心功能实现：

1. register: 用户注册
   - 密码加密 (bcrypt)
   - 用户唯一性检查
   - 默认角色分配
   - JWT token生成

2. login: 用户登录
   - 用户名/邮箱验证
   - 密码验证
   - JWT token生成
   - 登录日志记录

3. getProfile: 获取用户信息
   - JWT token验证
   - 用户信息查询
   - 权限信息包含

4. updateProfile: 更新用户信息
   - 数据验证
   - 重复检查
   - 数据库更新
   - 活动日志记录

// JWT实现：
const token = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
)
```

#### 3.3.2 新闻控制器 (`server/controllers/newsController.js`)

```javascript
// 核心功能：

1. getNewsList: 新闻列表查询
   - 分页处理 (mongoose-paginate-v2)
   - 分类筛选
   - 关键词搜索 (正则表达式)
   - 状态筛选
   - 排序 (发布时间倒序)
   - 字段映射 (mapBackendToFrontend)

2. getNewsById: 新闻详情查询
   - ID验证
   - 关联查询 (populate category, author)
   - 访问量增加
   - 字段映射

3. createNews: 新闻创建
   - 数据验证
   - 分类验证
   - 用户权限检查
   - 内容处理 (HTML sanitize)
   - 活动日志记录

// 字段映射函数：
const mapBackendToFrontend = (news) => {
  return {
    id: news._id.toString(),
    title: news.title,
    content: news.content,
    categoryId: news.category?._id?.toString(),
    categoryKey: news.category?.key,
    categoryName: news.category?.name,
    author: news.author?.username || news.author,
    viewCount: news.viewCount || 0,
    // ... 其他字段映射
  }
}

// 查询构建：
const query = News.find()
if (category) query.where('category').equals(category)
if (keyword) query.where('title').regex(new RegExp(keyword, 'i'))
if (status) query.where('status').equals(status)
```

#### 3.3.3 资源控制器 (`server/controllers/resourceController.js`)

```javascript
// 核心功能：

1. getResourceList: 资源列表查询
   - 分类筛选 (理论前沿/教学研究/影像思政)
   - 文件类型筛选
   - 推荐筛选
   - 分页处理
   - 字段映射

2. getResourceById: 资源详情查询
   - 关联查询 (category, uploader)
   - 下载统计更新
   - 字段映射

3. createResource: 资源创建
   - 文件上传处理
   - 文件类型验证
   - 元数据提取
   - 缩略图生成 (图片/视频)
   - 存储路径管理

// 文件处理逻辑：
const multer = require('multer')
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/resources')
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
    const ext = path.extname(file.originalname)
    cb(null, `${uniqueName}${ext}`)
  }
})

// 字段映射：
const mapBackendToFrontend = (resource) => {
  return {
    id: resource._id.toString(),
    title: resource.title,
    description: resource.content,
    fileType: resource.mimeType,
    isFeatured: resource.featured,
    // ... 其他映射
  }
}
```

#### 3.3.4 管理后台控制器 (`server/controllers/dashboardController.js`)

```javascript
// 核心功能：

1. getDashboardStats: 仪表板统计
   - 新闻总数统计
   - 资源总数统计
   - 用户总数统计
   - 访问量统计
   - 增长率计算

2. getVisitTrends: 访问趋势分析
   - 时间范围处理 (7天/30天/90天)
   - 数据聚合 (MongoDB aggregate)
   - 新闻访问量 + 资源访问量
   - 缺失日期补零

3. getRecentActivities: 最近活动
   - ActivityLog查询
   - 用户信息关联
   - 时间排序
   - 分页限制

// 统计查询示例：
const getStats = async () => {
  const [newsCount, resourceCount, userCount, totalViews] = await Promise.all([
    News.countDocuments({ status: 'published' }),
    Resource.countDocuments({ isPublished: true }),
    User.countDocuments({ role: { $ne: 'admin' } }),
    News.aggregate([{ $group: { _id: null, total: { $sum: '$viewCount' } } }])
  ])

  return { newsCount, resourceCount, userCount, totalViews }
}

// 访问趋势聚合：
const getVisitTrends = async (period) => {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const trends = await News.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        views: { $sum: '$viewCount' }
      }
    },
    { $sort: { '_id': 1 } }
  ])

  return trends
}
```

### 3.4 数据模型分析

#### 3.4.1 用户模型 (`server/models/User.js`)

```javascript
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "editor", "user"],
    default: "user",
  },
  avatar: String,
  phone: String,
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 中间件：
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  this.updatedAt = new Date();
  next();
});

// 实例方法：
userSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

#### 3.4.2 新闻模型 (`server/models/News.js`)

```javascript
const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  summary: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NewsCategory",
    required: true,
  },
  status: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "draft",
  },
  featured: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  publishDate: Date,
  thumbnail: String,
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 索引优化：
newsSchema.index({ category: 1, status: 1 });
newsSchema.index({ publishDate: -1 });
newsSchema.index({ title: "text", content: "text" });

// 分页插件：
newsSchema.plugin(require("mongoose-paginate-v2"));
```

#### 3.4.3 资源模型 (`server/models/Resource.js`)

```javascript
const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ResourceCategory",
    required: true,
  },
  fileUrl: { type: String, required: true },
  fileName: String,
  fileSize: Number,
  mimeType: String,
  thumbnailUrl: String,
  featured: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isPublished: { type: Boolean, default: true },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 虚拟字段：
resourceSchema.virtual("downloadUrl").get(function () {
  return `/api/uploads/resources/${this._id}/download`;
});
```

### 3.5 中间件分析

#### 3.5.1 认证中间件 (`server/middleware/auth.js`)

```javascript
const auth = async (req, res, next) => {
  try {
    // 1. 提取token
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "访问被拒绝，未提供token",
      });
    }

    // 2. 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. 查询用户
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "用户不存在",
      });
    }

    // 4. 设置用户信息
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token无效",
    });
  }
};
```

#### 3.5.2 权限中间件 (`server/middleware/permission.js`)

```javascript
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "用户未认证",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "权限不足",
      });
    }

    next();
  };
};

// 使用示例：
router.post("/news", auth, requireRole(["admin", "editor"]), createNews);
```

#### 3.5.3 文件上传中间件 (`server/middleware/upload.js`)

```javascript
const multer = require("multer");
const path = require("path");

// 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// 文件筛选
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|mp4|avi/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("不支持的文件类型"));
  }
};

// 配置选项
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: fileFilter,
});
```

## 4. API数据流分析

### 4.1 请求流程

```
1. 前端发起请求
   ↓
2. BaseApi 添加认证头
   ↓
3. 后端路由匹配
   ↓
4. 中间件链执行 (auth → permission → validation)
   ↓
5. 控制器业务逻辑
   ↓
6. 数据库查询/操作
   ↓
7. 响应数据封装
   ↓
8. 前端响应处理
```

### 4.2 错误处理流程

```
1. 错误发生
   ↓
2. 错误类型判断
   - 验证错误 (400)
   - 认证错误 (401)
   - 权限错误 (403)
   - 资源不存在 (404)
   - 服务器错误 (500)
   ↓
3. 错误响应格式化
   {
     success: false,
     status: 'error',
     message: '错误描述',
     code: 'ERROR_CODE'
   }
   ↓
4. 前端错误处理
   - 自动重试
   - 用户提示
   - 登录跳转
```

### 4.3 缓存策略

```javascript
// 前端缓存：
1. 分类数据缓存 (60分钟)
2. 用户信息缓存 (30分钟)
3. 静态资源缓存 (24小时)

// 后端缓存：
1. 数据库查询缓存 (Redis)
2. 文件系统缓存
3. 响应缓存 (热点数据)
```

## 5. API接口完整清单

### 5.1 认证接口

| 方法 | 路径               | 功能         | 权限 |
| ---- | ------------------ | ------------ | ---- |
| POST | /api/auth/register | 用户注册     | 公开 |
| POST | /api/auth/login    | 用户登录     | 公开 |
| POST | /api/auth/logout   | 用户登出     | 认证 |
| GET  | /api/auth/profile  | 获取用户信息 | 认证 |
| PUT  | /api/auth/profile  | 更新用户信息 | 认证 |
| PUT  | /api/auth/password | 修改密码     | 认证 |
| POST | /api/auth/refresh  | 刷新Token    | 认证 |

### 5.2 新闻接口

| 方法   | 路径                 | 功能         | 权限     |
| ------ | -------------------- | ------------ | -------- |
| GET    | /api/news            | 获取新闻列表 | 公开     |
| GET    | /api/news/:id        | 获取新闻详情 | 公开     |
| POST   | /api/news            | 创建新闻     | 编辑权限 |
| PUT    | /api/news/:id        | 更新新闻     | 编辑权限 |
| DELETE | /api/news/:id        | 删除新闻     | 编辑权限 |
| PUT    | /api/news/:id/status | 更新状态     | 编辑权限 |

### 5.3 资源接口

| 方法   | 路径                        | 功能         | 权限     |
| ------ | --------------------------- | ------------ | -------- |
| GET    | /api/resources              | 获取资源列表 | 公开     |
| GET    | /api/resources/:id          | 获取资源详情 | 公开     |
| POST   | /api/resources              | 上传资源     | 编辑权限 |
| PUT    | /api/resources/:id          | 更新资源     | 编辑权限 |
| DELETE | /api/resources/:id          | 删除资源     | 编辑权限 |
| GET    | /api/resources/:id/download | 下载资源     | 公开     |

### 5.4 管理接口

| 方法 | 路径                              | 功能         | 权限   |
| ---- | --------------------------------- | ------------ | ------ |
| GET  | /api/admin/dashboard/stats        | 仪表板统计   | 管理员 |
| GET  | /api/admin/dashboard/visit-trends | 访问趋势     | 管理员 |
| GET  | /api/admin/dashboard/activities   | 最近活动     | 管理员 |
| GET  | /api/admin/users                  | 用户列表     | 管理员 |
| GET  | /api/admin/users/:id              | 用户详情     | 管理员 |
| PUT  | /api/admin/users/:id/status       | 更新用户状态 | 管理员 |

### 5.5 分类接口

| 方法 | 路径                     | 功能         | 权限   |
| ---- | ------------------------ | ------------ | ------ |
| GET  | /api/news-categories     | 获取新闻分类 | 公开   |
| GET  | /api/resource-categories | 获取资源分类 | 公开   |
| POST | /api/news-categories     | 创建新闻分类 | 管理员 |
| POST | /api/resource-categories | 创建资源分类 | 管理员 |

### 5.6 设置接口

| 方法 | 路径                 | 功能         | 权限   |
| ---- | -------------------- | ------------ | ------ |
| GET  | /api/settings        | 获取所有设置 | 管理员 |
| GET  | /api/settings/:group | 获取分组设置 | 管理员 |
| PUT  | /api/settings/:key   | 更新单个设置 | 管理员 |
| PUT  | /api/settings/batch  | 批量更新设置 | 管理员 |

## 6. 常见问题排查指南

### 6.1 认证问题

- **Token过期**: 检查JWT有效期设置
- **权限不足**: 确认用户角色和权限配置
- **CORS错误**: 检查跨域配置

### 6.2 数据同步问题

- **字段不匹配**: 检查前后端字段映射函数
- **类型转换**: 确认数据类型定义一致
- **分页问题**: 验证分页参数和响应格式

### 6.3 文件上传问题

- **文件大小限制**: 检查multer配置
- **文件类型限制**: 确认文件过滤器设置
- **存储路径**: 验证文件存储和访问路径

### 6.4 性能问题

- **查询优化**: 检查数据库索引和查询条件
- **缓存策略**: 确认缓存配置和过期时间
- **数据传输**: 优化响应数据结构

---

**文档版本**: v1.0  
**更新日期**: 2025-06-16  
**维护人员**: 开发团队
