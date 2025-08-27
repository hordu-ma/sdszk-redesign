// MongoDB 初始化脚本
// 创建数据库和用户

// 切换到admin数据库
db = db.getSiblingDB("admin");

// 创建应用数据库用户
db.createUser({
  user: "sdszk_user",
  pwd: process.env.MONGO_PASSWORD || "your_secure_user_password",
  roles: [
    { role: "readWrite", db: "sdszk" },
    { role: "dbAdmin", db: "sdszk" },
  ],
});

// 切换到应用数据库
let dbInstance = db.getSiblingDB("sdszk");

// 创建基础集合和索引
print("创建基础集合和索引...");

// 用户集合索引
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

// 新闻集合索引
db.news.createIndex({ title: "text", content: "text" });
db.news.createIndex({ category: 1 });
db.news.createIndex({ publishDate: -1 });
db.news.createIndex({ status: 1 });
db.news.createIndex({ author: 1 });

// 资源集合索引
db.resources.createIndex({ title: "text", description: "text" });
db.resources.createIndex({ category: 1 });
db.resources.createIndex({ type: 1 });
db.resources.createIndex({ uploadDate: -1 });
db.resources.createIndex({ uploader: 1 });

// 分类集合索引
db.newscategories.createIndex({ name: 1 }, { unique: true });
db.newscategories.createIndex({ sort: 1 });
db.resourcecategories.createIndex({ name: 1 }, { unique: true });
db.resourcecategories.createIndex({ sort: 1 });

// 收藏集合索引
db.favorites.createIndex(
  { userId: 1, targetType: 1, targetId: 1 },
  { unique: true },
);
db.favorites.createIndex({ userId: 1, createdAt: -1 });

// 浏览历史集合索引
db.viewhistories.createIndex({ userId: 1, createdAt: -1 });
db.viewhistories.createIndex({ targetType: 1, targetId: 1 });

// 活动日志集合索引
db.activitylogs.createIndex({ userId: 1, createdAt: -1 });
db.activitylogs.createIndex({ action: 1 });
db.activitylogs.createIndex({ createdAt: -1 });

// 插入默认数据
print("插入默认数据...");

// 默认管理员用户
db.users.insertOne({
  username: "admin",
  name: "系统管理员",
  email: "admin@sust.edu.cn",
  password: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
  role: "admin",
  permissions: ["all"],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 默认新闻分类
db.newscategories.insertMany([
  {
    name: "党建工作",
    description: "党建相关新闻和活动",
    sort: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "教学研究",
    description: "思政教学研究成果",
    sort: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "学术交流",
    description: "学术会议和交流活动",
    sort: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "实践活动",
    description: "思政实践活动",
    sort: 4,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

// 默认资源分类
db.resourcecategories.insertMany([
  {
    key: "theory",
    name: "理论前沿",
    description: "思政理论前沿研究成果",
    order: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    key: "teaching",
    name: "教学研究",
    description: "思政教学研究成果",
    order: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    key: "video",
    name: "影像思政",
    description: "思政教育视频资源",
    order: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

// 插入示例新闻
db.news.insertOne({
  title: "欢迎使用山东省思想政治理论课平台",
  summary: "平台正式上线，为思政教育提供全面支持",
  content: `
    <p>山东省思想政治理论课平台正式上线！</p>
    <p>本平台致力于为全省思政教育工作者提供:</p>
    <ul>
      <li>丰富的教学资源</li>
      <li>便捷的交流平台</li>
      <li>先进的AI辅助工具</li>
      <li>全面的数据分析</li>
    </ul>
    <p>让我们共同推进思政教育现代化！</p>
  `,
  category: db.newscategories.findOne({ name: "党建工作" })._id,
  author: db.users.findOne({ username: "admin" })._id,
  status: "published",
  publishDate: new Date(),
  viewCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 网站配置
db.sitesettings.insertMany([
  {
    key: "site_title",
    value: "山东省思想政治理论课",
    description: "网站标题",
    type: "string",
    updatedAt: new Date(),
  },
  {
    key: "site_description",
    value: "山东省思想政治理论课教育教学资源平台",
    description: "网站描述",
    type: "string",
    updatedAt: new Date(),
  },
  {
    key: "maintenance_mode",
    value: false,
    description: "维护模式",
    type: "boolean",
    updatedAt: new Date(),
  },
]);

print("数据库初始化完成!");
print("默认管理员账号: admin / password");
print("请及时修改默认密码!");
