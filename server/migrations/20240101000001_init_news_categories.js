// 初始化和迁移新闻分类的脚本
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function up() {
  const url = process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk";
  await mongoose.connect(url);

  try {
    const collection = mongoose.connection.collection("news_categories");

    // 创建核心分类数组
    const coreCategories = [
      {
        key: "center",
        name: "中心动态",
        description: "中心的最新动态、活动和通知",
        isCore: true,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: "notice",
        name: "通知公告",
        description: "重要通知和公告信息",
        isCore: true,
        order: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: "policy",
        name: "政策文件",
        description: "政策、法规、文件等资料",
        isCore: true,
        order: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: "theory",
        name: "理论前沿",
        description: "思政教育理论研究、学术成果",
        isCore: true,
        order: 4,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: "teaching",
        name: "教学研究",
        description: "教学方法、教学案例、教学经验总结",
        isCore: true,
        order: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 创建索引
    await collection.createIndex({ key: 1 }, { unique: true });
    await collection.createIndex({ isCore: 1 });
    await collection.createIndex({ isActive: 1 });
    await collection.createIndex({ order: 1 });

    // 插入核心分类
    for (const category of coreCategories) {
      // 使用 upsert 操作以避免重复
      await collection.updateOne(
        { key: category.key },
        { $set: category },
        { upsert: true },
      );
    }

    // 迁移现有分类（如果存在的话）
    const newsCollection = mongoose.connection.collection("news");
    const existingCategories = await newsCollection.distinct("category");

    for (const categoryName of existingCategories) {
      // 跳过已经存在的核心分类
      if (coreCategories.some((c) => c.name === categoryName)) {
        continue;
      }

      // 检查 categoryName 是否为字符串
      if (typeof categoryName !== "string") {
        console.log(`跳过非字符串类型的分类:`, categoryName);
        continue;
      }

      // 生成唯一的 key
      const key = categoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // 添加新分类
      await collection.updateOne(
        { key },
        {
          $set: {
            key,
            name: categoryName,
            description: `${categoryName}相关信息`,
            isCore: false,
            order: 100, // 非核心分类排在后面
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
    }

    console.log("新闻分类初始化完成");
  } finally {
    await mongoose.disconnect();
  }
}

async function down() {
  const url = process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk";
  await mongoose.connect(url);

  try {
    // 删除分类集合
    await mongoose.connection.collection("news_categories").drop();

    console.log("新闻分类回滚完成");
  } finally {
    await mongoose.disconnect();
  }
}

export { up, down };
