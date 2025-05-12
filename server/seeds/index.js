// seed.js - 数据库初始种子文件
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import News from "../models/News.js";
import Resource from "../models/Resource.js";
import Activity from "../models/Activity.js";
import SiteSetting from "../models/SiteSetting.js";
ed.js - 数据库初始种子文件;
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import News from "../models/News.js";

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
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount > 0) {
      console.log("管理员用户已存在，跳过创建");
      return;
    }

    // 创建管理员
    const adminUser = new User({
      username: "admin",
      password: "Admin123456", // 密码会在保存时自动加密
      name: "系统管理员",
      email: "admin@sdszk.edu.cn",
      role: "admin",
      active: true,
    });

    await adminUser.save();
    console.log("成功创建管理员用户");
  } catch (err) {
    console.error("创建管理员失败:", err);
  }
};

// 创建示例新闻
const createSampleNews = async () => {
  try {
    // 检查是否已存在新闻
    const newsCount = await News.countDocuments();
    if (newsCount > 0) {
      console.log("新闻数据已存在，跳过创建");
      return;
    }

    // 示例新闻数据
    const sampleNews = [
      {
        title: "山东省大中小学思政课一体化指导中心成立",
        content:
          "<p>为深入贯彻落实习近平总书记关于教育的重要论述和全国教育大会精神，推动大中小学思政课一体化建设，山东省大中小学思政课一体化指导中心正式成立。</p><p>中心将致力于推动思政课程与课程思政有机结合，完善大中小学思政课一体化建设的内容体系、教材体系和教学体系，提高思政课教学质量和育人实效。</p>",
        summary:
          "山东省大中小学思政课一体化指导中心正式成立，将致力于推动思政课程与课程思政有机结合。",
        category: "center",
        author: "管理员",
        importance: 5,
        tags: ["成立", "思政课", "一体化"],
        isPublished: true,
      },
      {
        title: "关于举办2025年山东省思政课教师教学技能大赛的通知",
        content:
          "<p>各位思政课教师：</p><p>为提高思政课教师教学水平，促进教学经验交流，我中心定于2025年6月举办山东省思政课教师教学技能大赛。</p><p>比赛分为高校组、中学组和小学组，请各学校积极组织教师参加。</p>",
        summary:
          "山东省思政课教师教学技能大赛将于2025年6月举行，欢迎各校教师积极参与。",
        category: "notice",
        author: "管理员",
        importance: 4,
        tags: ["比赛", "教学技能", "通知"],
        isPublished: true,
      },
      {
        title: "山东省关于加强大中小学思政课一体化建设的实施意见",
        content:
          "<p>为贯彻落实中共中央办公厅、国务院办公厅《关于深化新时代学校思想政治理论课改革创新的若干意见》，结合我省实际，特制定如下实施意见：</p><p>一、总体要求...</p><p>二、主要任务...</p><p>三、组织实施...</p>",
        summary:
          "本文件提出了加强山东省大中小学思政课一体化建设的具体措施和实施路径。",
        category: "policy",
        author: "省教育厅",
        source: {
          name: "山东省教育厅",
          url: "http://edu.shandong.gov.cn",
        },
        importance: 5,
        tags: ["政策", "实施意见", "思政课建设"],
        isPublished: true,
      },
    ];

    await News.insertMany(sampleNews);
    console.log("成功创建示例新闻数据");
  } catch (err) {
    console.error("创建示例新闻失败:", err);
  }
};

// 执行种子数据添加
const seedDB = async () => {
  try {
    // 连接数据库
    const conn = await connectDB();

    // 添加初始数据
    await createAdminUser();
    await createSampleNews();

    // 关闭数据库连接
    await conn.close();
    console.log("种子数据添加完成，数据库连接已关闭");
    process.exit();
  } catch (err) {
    console.error("添加种子数据失败:", err);
    process.exit(1);
  }
};

// 运行种子函数
seedDB();
