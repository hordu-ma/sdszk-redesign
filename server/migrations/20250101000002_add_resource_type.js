// 为Resource模型添加resourceType字段的迁移脚本
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function up() {
  const url = process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk";
  await mongoose.connect(url);

  try {
    const collection = mongoose.connection.collection("resources");

    console.log("开始为资源添加resourceType字段...");

    // 统计现有资源数量
    const totalResources = await collection.countDocuments();
    console.log(`发现 ${totalResources} 个现有资源`);

    if (totalResources === 0) {
      console.log("没有现有资源，跳过迁移");
      return;
    }

    // 批量更新现有资源，根据文件类型智能设置resourceType
    const bulkOps = [];

    // 获取所有现有资源
    const resources = await collection.find({}).toArray();

    for (const resource of resources) {
      let resourceType = "document"; // 默认值

      // 根据现有字段智能判断资源类型
      if (resource.videoUrl || resource.videoDuration) {
        resourceType = "video";
      } else if (resource.mimeType) {
        const mimeType = resource.mimeType.toLowerCase();
        if (mimeType.startsWith("video/")) {
          resourceType = "video";
        } else if (mimeType.startsWith("image/")) {
          resourceType = "image";
        } else if (mimeType.startsWith("audio/")) {
          resourceType = "audio";
        } else if (
          mimeType.includes("pdf") ||
          mimeType.includes("document") ||
          mimeType.includes("text") ||
          mimeType.includes("word") ||
          mimeType.includes("excel") ||
          mimeType.includes("powerpoint")
        ) {
          resourceType = "document";
        } else {
          resourceType = "other";
        }
      } else if (resource.fileName) {
        const fileName = resource.fileName.toLowerCase();
        if (
          fileName.endsWith(".mp4") ||
          fileName.endsWith(".avi") ||
          fileName.endsWith(".mov")
        ) {
          resourceType = "video";
        } else if (
          fileName.endsWith(".jpg") ||
          fileName.endsWith(".png") ||
          fileName.endsWith(".gif")
        ) {
          resourceType = "image";
        } else if (
          fileName.endsWith(".mp3") ||
          fileName.endsWith(".wav") ||
          fileName.endsWith(".flac")
        ) {
          resourceType = "audio";
        }
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: resource._id },
          update: { $set: { resourceType: resourceType } },
        },
      });
    }

    // 执行批量更新
    if (bulkOps.length > 0) {
      const result = await collection.bulkWrite(bulkOps);
      console.log(`成功更新 ${result.modifiedCount} 个资源的resourceType字段`);
    }

    // 创建索引
    await collection.createIndex({ resourceType: 1 });
    console.log("已为resourceType字段创建索引");

    // 验证更新结果
    const typeStats = await collection
      .aggregate([
        {
          $group: {
            _id: "$resourceType",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    console.log("资源类型分布统计:");
    typeStats.forEach((stat) => {
      console.log(`  ${stat._id}: ${stat.count} 个`);
    });

    console.log("resourceType字段迁移完成");
  } finally {
    await mongoose.disconnect();
  }
}

async function down() {
  const url = process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk";
  await mongoose.connect(url);

  try {
    const collection = mongoose.connection.collection("resources");

    console.log("开始回滚resourceType字段...");

    // 删除resourceType字段
    const result = await collection.updateMany(
      {},
      { $unset: { resourceType: "" } },
    );

    console.log(`已从 ${result.modifiedCount} 个资源中移除resourceType字段`);

    // 删除索引
    try {
      await collection.dropIndex({ resourceType: 1 });
      console.log("已删除resourceType索引");
    } catch {
      console.log("resourceType索引不存在或已被删除");
    }

    console.log("resourceType字段回滚完成");
  } finally {
    await mongoose.disconnect();
  }
}

export { up, down };
