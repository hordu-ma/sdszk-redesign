// seed.js - 数据库初始种子文件
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import News from "../models/News.js";
import NewsCategory from "../models/NewsCategory.js";
import Resource from "../models/Resource.js";
import Activity from "../models/Activity.js";
import SiteSetting from "../models/SiteSetting.js";

// 加载环境变量
dotenv.config();

// MongoDB连接
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk"
    );
    console.log("MongoDB连接成功，开始添加种子数据");
    return mongoose.connection;
  } catch (err) {
    console.error("MongoDB连接失败:", err);
    process.exit(1);
  }
};

// 创建初始管理员用户
const createAdminUser = async () => {
  try {
    // 检查是否已存在管理员
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("管理员用户已存在，返回现有管理员");
      return existingAdmin;
    }

    // 创建管理员
    const adminUser = await User.create({
      username: "admin",
      password: "Admin123456", // 密码会在保存时自动加密
      name: "系统管理员",
      email: "admin@sdszk.edu.cn",
      role: "admin",
      isActive: true,
      isVerified: true
    });

    console.log("管理员用户创建成功:", adminUser);
    return adminUser;
  } catch (err) {
    console.error("创建管理员失败:", err);
    return null;
  }
};

// 创建新闻分类
const createNewsCategories = async () => {
  try {
    // 获取管理员用户
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      console.log("未找到管理员用户，跳过创建新闻分类");
      return null;
    }
    console.log("找到管理员用户:", admin._id);

    // 创建基础新闻分类
    const categoryData = [
      {
        name: "中心动态",
        key: "center",
        description: "山东省大中小学思政课一体化指导中心相关动态",
        order: 1,
        color: "#2196F3",
        icon: "news",
        isActive: true,
        isCore: true,
        createdBy: admin._id,
        updatedBy: admin._id
      },
      {
        name: "通知公告",
        key: "notice",
        description: "各类通知和公告信息",
        order: 2,
        color: "#4CAF50",
        icon: "announcement",
        isActive: true,
        isCore: true,
        createdBy: admin._id,
        updatedBy: admin._id
      },
      {
        name: "政策文件",
        key: "policy",
        description: "相关政策文件和规定",
        order: 3,
        color: "#FF9800",
        icon: "policy",
        isActive: true,
        isCore: true,
        createdBy: admin._id,
        updatedBy: admin._id
      },
    ];

    console.log("准备创建的新闻分类数据:", JSON.stringify(categoryData, null, 2));

    // 创建新闻分类
    const createdCategories = await NewsCategory.insertMany(categoryData, { ordered: true });
    console.log("新闻分类创建成功:", createdCategories.map(cat => ({ name: cat.name, key: cat.key, _id: cat._id })));
    return createdCategories;
  } catch (err) {
    console.error("创建新闻分类失败:", err);
    throw err;
  }
};

// 创建示例新闻
const createSampleNews = async () => {
  try {
    // 获取管理员用户
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      console.log("未找到管理员用户，跳过创建示例新闻");
      return null;
    }

    // 获取所有新闻分类
    const categories = await NewsCategory.find();
    if (!categories || categories.length === 0) {
      console.log("未找到新闻分类，跳过创建示例新闻");
      return null;
    }

    // 创建分类映射
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category.key] = category._id;
    });
    console.log("分类映射:", categoryMap);

    // 示例新闻数据
    const now = new Date();
    const sampleNews = [
      {
        title: "山东省大中小学思政课一体化指导中心成立",
        content:
          "<p>为深入贯彻落实习近平总书记关于教育的重要论述和全国教育大会精神，推动大中小学思政课一体化建设，山东省大中小学思政课一体化指导中心正式成立。</p><p>中心将致力于推动思政课程与课程思政有机结合，完善大中小学思政课一体化建设的内容体系、教材体系和教学体系，提高思政课教学质量和育人实效。</p>",
        summary:
          "山东省大中小学思政课一体化指导中心正式成立，将致力于推动思政课程与课程思政有机结合。",
        category: categoryMap['center'],
        author: "管理员",
        importance: 5,
        tags: ["成立", "思政课", "一体化"],
        isPublished: true,
        publishDate: now,
        createdBy: admin._id,
        updatedBy: admin._id,
        viewCount: 0,
        attachments: [],
        seo: { keywords: [] }
      },
      {
        title: "关于举办2025年山东省思政课教师教学技能大赛的通知",
        content:
          "<p>各位思政课教师：</p><p>为提高思政课教师教学水平，促进教学经验交流，我中心定于2025年6月举办山东省思政课教师教学技能大赛。</p><p>比赛分为高校组、中学组和小学组，请各学校积极组织教师参加。</p>",
        summary:
          "山东省思政课教师教学技能大赛将于2025年6月举行，欢迎各校教师积极参与。",
        category: categoryMap['notice'],
        author: "管理员",
        importance: 4,
        tags: ["比赛", "教学技能", "通知"],
        isPublished: true,
        publishDate: now,
        createdBy: admin._id,
        updatedBy: admin._id,
        viewCount: 0,
        attachments: [],
        seo: { keywords: [] }
      },
      {
        title: "山东省关于加强大中小学思政课一体化建设的实施意见",
        content:
          "<p>为贯彻落实中共中央办公厅、国务院办公厅《关于深化新时代学校思想政治理论课改革创新的若干意见》，结合我省实际，特制定如下实施意见：</p><p>一、总体要求...</p><p>二、主要任务...</p><p>三、组织实施...</p>",
        summary:
          "本文件提出了加强山东省大中小学思政课一体化建设的具体措施和实施路径。",
        category: categoryMap['policy'],
        author: "省教育厅",
        source: {
          name: "山东省教育厅",
          url: "http://edu.shandong.gov.cn"
        },
        importance: 5,
        tags: ["政策", "实施意见", "思政课建设"],
        isPublished: true,
        publishDate: now,
        createdBy: admin._id,
        updatedBy: admin._id,
        viewCount: 0,
        attachments: [],
        seo: { keywords: [] }
      }
    ];

    // 验证新闻数据
    for (const news of sampleNews) {
      if (!news.category) {
        throw new Error(`新闻 "${news.title}" 的分类未找到`);
      }
    }

    console.log("准备创建的新闻数据:", JSON.stringify(sampleNews, null, 2));

    // 创建新闻
    const createdNews = await News.insertMany(sampleNews, { ordered: true });
    console.log("成功创建示例新闻:", createdNews.map(news => ({ title: news.title, category: news.category })));
    return createdNews;
  } catch (err) {
    console.error("创建示例新闻失败:", err);
    throw err;
  }
};

// 执行种子数据添加
const seedDB = async () => {
  try {
    // 连接数据库
    const conn = await connectDB();

    // 删除所有现有数据
    await Promise.all([
      User.deleteMany({}),
      NewsCategory.deleteMany({}),
      News.deleteMany({})
    ]);
    console.log("已清空现有数据");

    // 添加种子数据
    console.log('开始创建管理员用户...');
    const admin = await createAdminUser();
    if (!admin) {
      throw new Error("创建管理员用户失败");
    }
    console.log("管理员用户创建成功");
    
    console.log('开始创建新闻分类...');
    const categories = await createNewsCategories();
    if (!categories) {
      throw new Error("创建新闻分类失败");
    }
    console.log("新闻分类创建成功");
    
    console.log('开始创建示例新闻...');
    const news = await createSampleNews();
    if (!news) {
      throw new Error("创建示例新闻失败");
    }
    console.log("示例新闻创建成功");

    console.log("种子数据添加完成");
  } catch (err) {
    console.error("添加种子数据失败:", err);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log("数据库连接已关闭");
    process.exit();
  }
};

// 运行种子函数
seedDB();
