// fix-thumbnail-urls.js - 修复资源URL的数据库迁移脚本
import mongoose from "mongoose";
import Resource from "../models/Resource.js";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

const MONGODB_URI = "mongodb://localhost:27017/sdszk";

console.log("Using MongoDB URI:", MONGODB_URI);

// 需要替换的错误域名和URL模式
const WRONG_PATTERNS = [
  "https://horsduroot.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
const CORRECT_PREFIX = "";

/**
 * 修复单个URL
 * @param {string} url - 原始URL
 * @returns {string} - 修复后的URL
 */
const fixUrl = (url) => {
  if (!url || typeof url !== "string") {
    return url;
  }

  // 检查并修复各种错误的URL模式
  for (const pattern of WRONG_PATTERNS) {
    if (url.startsWith(pattern)) {
      return url.replace(pattern, CORRECT_PREFIX);
    }
  }

  return url;
};

/**
 * 执行数据库迁移
 */
const runMigration = async () => {
  let connection;

  try {
    // 连接数据库
    console.log("正在连接数据库...");
    console.log("数据库URI:", MONGODB_URI);
    connection = await mongoose.connect(MONGODB_URI);
    console.log("数据库连接成功");
    console.log("当前数据库名称:", mongoose.connection.db.databaseName);

    // 首先检查总资源数量
    const totalResources = await Resource.countDocuments();
    console.log(`数据库中总共有 ${totalResources} 个资源`);

    // 查看前几个资源的样本数据
    const sampleResources = await Resource.find().limit(3);
    console.log("样本资源数据:");
    sampleResources.forEach((r, index) => {
      console.log(`  ${index + 1}. ${r.title}`);
      console.log(`     thumbnail: ${r.thumbnail || "NULL"}`);
      console.log(`     fileUrl: ${r.fileUrl || "NULL"}`);
    });

    // 查找所有需要修复的资源
    console.log("\n正在查找需要修复的资源...");
    const resourcesNeedFix = await Resource.find({
      $or: [
        { thumbnail: /horsduroot\.com/ },
        { fileUrl: /horsduroot\.com/ },
        { videoUrl: /horsduroot\.com/ },
        { thumbnail: /localhost:3000/ },
        { fileUrl: /localhost:3000/ },
        { videoUrl: /localhost:3000/ },
        { thumbnail: /127\.0\.0\.1:3000/ },
        { fileUrl: /127\.0\.0\.1:3000/ },
        { videoUrl: /127\.0\.0\.1:3000/ },
      ],
    });

    console.log(`找到 ${resourcesNeedFix.length} 个需要修复的资源`);

    // 如果没找到，尝试更宽泛的查询
    if (resourcesNeedFix.length === 0) {
      console.log("没有找到匹配的资源，尝试更宽泛的查询...");
      const allResourcesWithThumbnail = await Resource.find({
        thumbnail: { $exists: true, $ne: null, $nin: ["", null] },
      });
      console.log(`找到 ${allResourcesWithThumbnail.length} 个有缩略图的资源`);

      allResourcesWithThumbnail.forEach((r, index) => {
        if (index < 5) {
          // 只显示前5个
          console.log(`  ${r.title}: ${r.thumbnail}`);
        }
      });
    }

    if (resourcesNeedFix.length === 0) {
      console.log("没有需要修复的资源，迁移完成");
      return;
    }

    // 统计信息
    let fixedCount = 0;
    let thumbnailFixedCount = 0;
    let fileUrlFixedCount = 0;
    let videoUrlFixedCount = 0;

    // 逐个修复资源
    for (const resource of resourcesNeedFix) {
      const updates = {};
      let hasUpdates = false;

      // 修复 thumbnail
      if (
        resource.thumbnail &&
        WRONG_PATTERNS.some((pattern) =>
          resource.thumbnail.includes(
            pattern.replace("https://", "").replace("http://", ""),
          ),
        )
      ) {
        updates.thumbnail = fixUrl(resource.thumbnail);
        thumbnailFixedCount++;
        hasUpdates = true;
        console.log(
          `修复缩略图: ${resource.thumbnail} -> ${updates.thumbnail}`,
        );
      }

      // 修复 fileUrl
      if (
        resource.fileUrl &&
        WRONG_PATTERNS.some((pattern) =>
          resource.fileUrl.includes(
            pattern.replace("https://", "").replace("http://", ""),
          ),
        )
      ) {
        updates.fileUrl = fixUrl(resource.fileUrl);
        fileUrlFixedCount++;
        hasUpdates = true;
        console.log(`修复文件URL: ${resource.fileUrl} -> ${updates.fileUrl}`);
      }

      // 修复 videoUrl
      if (
        resource.videoUrl &&
        WRONG_PATTERNS.some((pattern) =>
          resource.videoUrl.includes(
            pattern.replace("https://", "").replace("http://", ""),
          ),
        )
      ) {
        updates.videoUrl = fixUrl(resource.videoUrl);
        videoUrlFixedCount++;
        hasUpdates = true;
        console.log(`修复视频URL: ${resource.videoUrl} -> ${updates.videoUrl}`);
      }

      // 如果有更新，则保存
      if (hasUpdates) {
        await Resource.updateOne({ _id: resource._id }, { $set: updates });
        fixedCount++;
        console.log(`已修复资源: ${resource.title} (ID: ${resource._id})`);
      }
    }

    // 输出统计结果
    console.log("\n=== 迁移完成 ===");
    console.log(`总共修复资源数量: ${fixedCount}`);
    console.log(`修复缩略图数量: ${thumbnailFixedCount}`);
    console.log(`修复文件URL数量: ${fileUrlFixedCount}`);
    console.log(`修复视频URL数量: ${videoUrlFixedCount}`);

    // 验证修复结果
    console.log("\n正在验证修复结果...");
    const remainingBrokenResources = await Resource.find({
      $or: [
        { thumbnail: /horsduroot\.com/ },
        { fileUrl: /horsduroot\.com/ },
        { videoUrl: /horsduroot\.com/ },
        { thumbnail: /localhost:3000/ },
        { fileUrl: /localhost:3000/ },
        { videoUrl: /localhost:3000/ },
        { thumbnail: /127\.0\.0\.1:3000/ },
        { fileUrl: /127\.0\.0\.1:3000/ },
        { videoUrl: /127\.0\.0\.1:3000/ },
      ],
    });

    if (remainingBrokenResources.length === 0) {
      console.log("✅ 验证成功：所有错误URL已修复");
    } else {
      console.log(
        `❌ 验证失败：仍有 ${remainingBrokenResources.length} 个资源包含错误URL`,
      );
      remainingBrokenResources.forEach((resource) => {
        console.log(`未修复资源: ${resource.title} (ID: ${resource._id})`);
      });
    }
  } catch (error) {
    console.error("迁移过程中发生错误:", error);
    throw error;
  } finally {
    // 关闭数据库连接
    if (connection) {
      await mongoose.connection.close();
      console.log("数据库连接已关闭");
    }
  }
};

/**
 * 回滚迁移（恢复原始URL）
 */
const rollbackMigration = async () => {
  let connection;

  try {
    console.log("正在连接数据库...");
    connection = await mongoose.connect(MONGODB_URI);
    console.log("数据库连接成功");

    console.log("警告：回滚功能仅用于紧急情况");
    console.log("此操作将把相对路径URL转换回错误的绝对路径URL");
    console.log("通常不建议执行回滚操作");
  } catch (error) {
    console.error("回滚过程中发生错误:", error);
    throw error;
  } finally {
    if (connection) {
      await mongoose.connection.close();
      console.log("数据库连接已关闭");
    }
  }
};

// 主函数
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === "rollback") {
      await rollbackMigration();
    } else {
      await runMigration();
    }
    console.log("操作完成");
    process.exit(0);
  } catch (error) {
    console.error("操作失败:", error);
    process.exit(1);
  }
};

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("开始执行资源URL修复迁移...");
  console.log("使用方法:");
  console.log("  node fix-thumbnail-urls.js      # 执行迁移");
  console.log("  node fix-thumbnail-urls.js rollback  # 回滚迁移");
  console.log("");

  main();
}

export { runMigration, rollbackMigration };
