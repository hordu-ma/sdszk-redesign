// verify-thumbnail-fix.js - 验证缩略图修复的API测试脚本
import mongoose from "mongoose";
import Resource from "./models/Resource.js";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

const MONGODB_URI = "mongodb://localhost:27017/sdszk";

/**
 * 验证缩略图修复结果
 */
const verifyThumbnailFix = async () => {
  let connection;

  try {
    // 连接数据库
    console.log("正在连接数据库...");
    connection = await mongoose.connect(MONGODB_URI);
    console.log("数据库连接成功");

    console.log("\n=== 验证缩略图修复结果 ===");

    // 查找所有已发布的资源
    const allResources = await Resource.find({ isPublished: true })
      .select("title thumbnail fileUrl category isPublished createdAt")
      .sort({ createdAt: -1 });

    console.log(`\n总共找到 ${allResources.length} 个已发布的资源`);

    // 显示资源信息（不按分类筛选，因为无法获取分类详情）
    console.log(`\n--- 所有资源 ---`);
    console.log(`资源数量: ${allResources.length}`);

    if (allResources.length > 0) {
      allResources.forEach((resource, index) => {
        if (index < 5) {
          // 只显示前5个
          console.log(`  ${index + 1}. ${resource.title}`);
          console.log(`     缩略图: ${resource.thumbnail || "无"}`);
          console.log(`     文件URL: ${resource.fileUrl || "无"}`);

          // 验证URL格式
          const thumbnailValid =
            !resource.thumbnail || resource.thumbnail.startsWith("/uploads/");
          const fileUrlValid =
            !resource.fileUrl ||
            resource.fileUrl.startsWith("/uploads/") ||
            resource.fileUrl.startsWith("/");

          console.log(
            `     缩略图格式: ${thumbnailValid ? "✅ 正确" : "❌ 错误"}`,
          );
          console.log(
            `     文件URL格式: ${fileUrlValid ? "✅ 正确" : "❌ 错误"}`,
          );
        }
      });

      if (allResources.length > 5) {
        console.log(`     ... 还有 ${allResources.length - 5} 个资源`);
      }
    } else {
      console.log("  暂无资源");
    }

    // 检查是否还有错误的URL
    const brokenResources = allResources.filter(
      (r) =>
        (r.thumbnail && r.thumbnail.includes("horsduroot.com")) ||
        (r.fileUrl && r.fileUrl.includes("horsduroot.com")),
    );

    console.log(`\n=== URL格式检查 ===`);
    if (brokenResources.length === 0) {
      console.log("✅ 所有资源的URL格式都已修复");
    } else {
      console.log(`❌ 发现 ${brokenResources.length} 个资源仍有错误URL:`);
      brokenResources.forEach((r) => {
        console.log(`  - ${r.title}: ${r.thumbnail || r.fileUrl}`);
      });
    }

    // 模拟前端API调用
    console.log(`\n=== 模拟前端API响应 ===`);

    // 模拟API响应示例
    const sampleResources = allResources.slice(0, 3).map((r) => ({
      id: r._id.toString(),
      title: r.title,
      thumbnail: r.thumbnail,
      description: r.content || "",
      publishDate: r.createdAt,
    }));

    console.log("API响应示例（前3个资源）:");
    console.log(JSON.stringify(sampleResources, null, 2));
  } catch (error) {
    console.error("验证过程中发生错误:", error);
    throw error;
  } finally {
    // 关闭数据库连接
    if (connection) {
      await mongoose.connection.close();
      console.log("\n数据库连接已关闭");
    }
  }
};

// 主函数
const main = async () => {
  try {
    await verifyThumbnailFix();
    console.log("\n验证完成");
    process.exit(0);
  } catch (error) {
    console.error("验证失败:", error);
    process.exit(1);
  }
};

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("开始验证缩略图修复结果...");
  main();
}

export { verifyThumbnailFix };
