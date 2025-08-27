import mongoose from "mongoose";
import NewsCategory from "../models/NewsCategory.js";

const CORE_CATEGORIES = [
  {
    name: "中心动态",
    key: "center",
    description: "思政课一体化指导中心的动态信息",
    order: 1,
    isCore: true,
    color: "#1890ff",
    icon: "notification",
  },
  {
    name: "通知公告",
    key: "notice",
    description: "各类通知、公告信息",
    order: 2,
    isCore: true,
    color: "#52c41a",
    icon: "sound",
  },
  {
    name: "政策文件",
    key: "policy",
    description: "相关政策、文件信息",
    order: 3,
    isCore: true,
    color: "#722ed1",
    icon: "file-text",
  },
];

export async function up() {
  try {
    console.log("开始初始化核心分类...");

    // 获取系统管理员用户
    const adminUser = await mongoose.model("User").findOne({ role: "admin" });
    if (!adminUser) {
      throw new Error("未找到系统管理员用户");
    }

    // 初始化核心分类
    for (const category of CORE_CATEGORIES) {
      const exists = await NewsCategory.findOne({ key: category.key });
      if (!exists) {
        await NewsCategory.create({
          ...category,
          createdBy: adminUser._id,
          updatedBy: adminUser._id,
        });
        console.log(`创建核心分类: ${category.name}`);
      } else {
        // 更新现有分类为核心分类
        await NewsCategory.findByIdAndUpdate(exists._id, {
          ...category,
          isCore: true,
          updatedBy: adminUser._id,
        });
        console.log(`更新核心分类: ${category.name}`);
      }
    }

    console.log("核心分类初始化完成");
  } catch (error) {
    console.error("初始化核心分类失败:", error);
    throw error;
  }
}

export async function down() {
  try {
    console.log("开始回滚核心分类...");
    await NewsCategory.deleteMany({ isCore: true });
    console.log("核心分类回滚完成");
  } catch (error) {
    console.error("回滚核心分类失败:", error);
    throw error;
  }
}
