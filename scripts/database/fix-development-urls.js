#!/usr/bin/env node

/**
 * 修复开发环境中包含错误URL的资源
 * 此脚本连接开发数据库进行修复，确保开发环境使用正确的URL格式
 */

import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载开发环境配置
dotenv.config({ path: path.join(__dirname, "../../server/.env") });

const DEVELOPMENT_MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk";
const PRODUCTION_DOMAIN = "https://horsduroot.com";
// Patterns for replacing localhost URLs

class DevelopmentUrlFixer {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      console.log("🔗 连接开发数据库...");
      this.client = new MongoClient(DEVELOPMENT_MONGO_URI);
      await this.client.connect();
      this.db = this.client.db();
      console.log("✅ 开发数据库连接成功");
    } catch (error) {
      console.error("❌ 数据库连接失败:", error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log("🔌 数据库连接已关闭");
    }
  }

  async findProblematicResources() {
    try {
      console.log("\n🔍 查找包含错误URL的资源记录...");

      const collection = this.db.collection("resources");

      // 查找所有包含localhost或127.0.0.1的资源
      const query = {
        $or: [
          { fileUrl: { $regex: "localhost" } },
          { fileUrl: { $regex: "127\\.0\\.0\\.1" } },
          { videoUrl: { $regex: "localhost" } },
          { videoUrl: { $regex: "127\\.0\\.0\\.1" } },
          { thumbnail: { $regex: "localhost" } },
          { thumbnail: { $regex: "127\\.0\\.0\\.1" } },
          { "attachments.url": { $regex: "localhost" } },
          { "attachments.url": { $regex: "127\\.0\\.0\\.1" } },
          { "source.url": { $regex: "localhost" } },
          { "source.url": { $regex: "127\\.0\\.0\\.1" } },
        ],
      };

      const problematicResources = await collection.find(query).toArray();

      console.log(
        `📊 找到 ${problematicResources.length} 个包含本地URL的资源记录`,
      );

      if (problematicResources.length > 0) {
        console.log("\n🔍 问题资源详情:");
        problematicResources.forEach((resource, index) => {
          console.log(`\n${index + 1}. ${resource.title}`);
          console.log(`   ID: ${resource._id}`);

          if (
            resource.fileUrl &&
            (resource.fileUrl.includes("localhost") ||
              resource.fileUrl.includes("127.0.0.1"))
          ) {
            console.log(`   🚨 fileUrl: ${resource.fileUrl}`);
          }
          if (
            resource.videoUrl &&
            (resource.videoUrl.includes("localhost") ||
              resource.videoUrl.includes("127.0.0.1"))
          ) {
            console.log(`   🚨 videoUrl: ${resource.videoUrl}`);
          }
          if (
            resource.thumbnail &&
            (resource.thumbnail.includes("localhost") ||
              resource.thumbnail.includes("127.0.0.1"))
          ) {
            console.log(`   🚨 thumbnail: ${resource.thumbnail}`);
          }
          if (resource.attachments) {
            resource.attachments.forEach((attachment, idx) => {
              if (
                attachment.url &&
                (attachment.url.includes("localhost") ||
                  attachment.url.includes("127.0.0.1"))
              ) {
                console.log(`   🚨 attachments[${idx}].url: ${attachment.url}`);
              }
            });
          }
          if (
            resource.source?.url &&
            (resource.source.url.includes("localhost") ||
              resource.source.url.includes("127.0.0.1"))
          ) {
            console.log(`   🚨 source.url: ${resource.source.url}`);
          }
        });
      }

      return problematicResources;
    } catch (error) {
      console.error("❌ 查找问题资源失败:", error.message);
      throw error;
    }
  }

  async fixResourceUrls() {
    try {
      console.log("\n🔧 开始修复资源URL...");

      const collection = this.db.collection("resources");
      let fixedCount = 0;

      // 需要替换的模式和对应的替换值
      const replacements = [
        { find: "localhost:3000", replace: "horsduroot.com" },
        { find: "localhost:5173", replace: "horsduroot.com" },
        { find: "127.0.0.1:3000", replace: "horsduroot.com" },
        { find: "127.0.0.1:5173", replace: "horsduroot.com" },
      ];

      for (const { find, replace } of replacements) {
        console.log(`\n🔄 替换 ${find} -> ${replace}`);

        // 修复 fileUrl 字段
        const fileUrlResult = await collection.updateMany(
          { fileUrl: { $regex: find } },
          [
            {
              $set: {
                fileUrl: {
                  $replaceAll: {
                    input: "$fileUrl",
                    find: find,
                    replacement: replace,
                  },
                },
              },
            },
          ],
        );
        if (fileUrlResult.modifiedCount > 0) {
          console.log(
            `  ✅ 修复了 ${fileUrlResult.modifiedCount} 个 fileUrl 字段`,
          );
          fixedCount += fileUrlResult.modifiedCount;
        }

        // 修复 videoUrl 字段
        const videoUrlResult = await collection.updateMany(
          { videoUrl: { $regex: find } },
          [
            {
              $set: {
                videoUrl: {
                  $replaceAll: {
                    input: "$videoUrl",
                    find: find,
                    replacement: replace,
                  },
                },
              },
            },
          ],
        );
        if (videoUrlResult.modifiedCount > 0) {
          console.log(
            `  ✅ 修复了 ${videoUrlResult.modifiedCount} 个 videoUrl 字段`,
          );
          fixedCount += videoUrlResult.modifiedCount;
        }

        // 修复 thumbnail 字段
        const thumbnailResult = await collection.updateMany(
          { thumbnail: { $regex: find } },
          [
            {
              $set: {
                thumbnail: {
                  $replaceAll: {
                    input: "$thumbnail",
                    find: find,
                    replacement: replace,
                  },
                },
              },
            },
          ],
        );
        if (thumbnailResult.modifiedCount > 0) {
          console.log(
            `  ✅ 修复了 ${thumbnailResult.modifiedCount} 个 thumbnail 字段`,
          );
          fixedCount += thumbnailResult.modifiedCount;
        }

        // 修复 attachments.url 字段
        const attachmentResult = await collection.updateMany(
          { "attachments.url": { $regex: find } },
          [
            {
              $set: {
                attachments: {
                  $map: {
                    input: "$attachments",
                    as: "attachment",
                    in: {
                      $mergeObjects: [
                        "$$attachment",
                        {
                          url: {
                            $replaceAll: {
                              input: "$$attachment.url",
                              find: find,
                              replacement: replace,
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          ],
        );
        if (attachmentResult.modifiedCount > 0) {
          console.log(
            `  ✅ 修复了 ${attachmentResult.modifiedCount} 个资源的 attachments.url 字段`,
          );
        }

        // 修复 source.url 字段
        const sourceResult = await collection.updateMany(
          { "source.url": { $regex: find } },
          [
            {
              $set: {
                "source.url": {
                  $replaceAll: {
                    input: "$source.url",
                    find: find,
                    replacement: replace,
                  },
                },
              },
            },
          ],
        );
        if (sourceResult.modifiedCount > 0) {
          console.log(
            `  ✅ 修复了 ${sourceResult.modifiedCount} 个 source.url 字段`,
          );
        }
      }

      return fixedCount;
    } catch (error) {
      console.error("❌ 修复URL失败:", error.message);
      throw error;
    }
  }

  async verifyFix() {
    try {
      console.log("\n🔍 验证修复结果...");

      const collection = this.db.collection("resources");

      const remainingIssues = await collection
        .find({
          $or: [
            { fileUrl: { $regex: "localhost" } },
            { fileUrl: { $regex: "127\\.0\\.0\\.1" } },
            { videoUrl: { $regex: "localhost" } },
            { videoUrl: { $regex: "127\\.0\\.0\\.1" } },
            { thumbnail: { $regex: "localhost" } },
            { thumbnail: { $regex: "127\\.0\\.0\\.1" } },
            { "attachments.url": { $regex: "localhost" } },
            { "attachments.url": { $regex: "127\\.0\\.0\\.1" } },
            { "source.url": { $regex: "localhost" } },
            { "source.url": { $regex: "127\\.0\\.0\\.1" } },
          ],
        })
        .toArray();

      if (remainingIssues.length === 0) {
        console.log("✅ 所有问题已修复！没有发现剩余的本地URL引用");
      } else {
        console.log(`⚠️  仍有 ${remainingIssues.length} 个资源包含本地URL`);
        remainingIssues.forEach((resource, index) => {
          console.log(`${index + 1}. ${resource.title} (ID: ${resource._id})`);
        });
      }

      return remainingIssues.length;
    } catch (error) {
      console.error("❌ 验证修复结果失败:", error.message);
      throw error;
    }
  }

  async createBackup() {
    try {
      console.log("\n💾 创建数据备份记录...");

      const collection = this.db.collection("resources");
      const backupData = await collection.find({}).toArray();

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFileName = `dev-resources-backup-${timestamp}.json`;

      console.log(`📝 备份信息: ${backupData.length} 个资源记录`);
      console.log(`📂 建议备份文件名: ${backupFileName}`);

      return {
        timestamp,
        recordCount: backupData.length,
        fileName: backupFileName,
      };
    } catch (error) {
      console.error("❌ 创建备份失败:", error.message);
      throw error;
    }
  }

  async run() {
    try {
      console.log("🚀 开始开发环境URL修复流程\n");
      console.log(`🌐 目标域名: ${PRODUCTION_DOMAIN}`);
      console.log(`🔗 数据库: ${DEVELOPMENT_MONGO_URI}\n`);

      await this.connect();

      // 步骤1: 创建备份记录
      await this.createBackup();

      // 步骤2: 查找问题资源
      const problematicResources = await this.findProblematicResources();

      if (problematicResources.length === 0) {
        console.log("\n🎉 没有发现需要修复的URL！");
        return;
      }

      // 步骤3: 执行修复
      console.log("\n🔧 开始执行修复...");
      const fixedCount = await this.fixResourceUrls();

      // 步骤4: 验证修复结果
      const remainingIssues = await this.verifyFix();

      // 步骤5: 输出修复报告
      console.log("\n📊 修复完成报告:");
      console.log(`📈 总计修复: ${fixedCount} 个字段`);
      console.log(`🔍 剩余问题: ${remainingIssues} 个`);

      if (remainingIssues === 0) {
        console.log(
          "\n🎉 开发环境URL修复完成！所有本地URL引用已被替换为生产域名",
        );
        console.log("\n📝 建议：");
        console.log("1. 重启开发服务器以确保更改生效");
        console.log("2. 测试资源下载功能是否正常");
        console.log("3. 确认前端页面显示正常");
      } else {
        console.log("\n⚠️  还有一些问题需要手动处理");
      }
    } catch (error) {
      console.error("\n❌ 修复过程中发生错误:", error.message);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// 主执行函数
async function main() {
  const fixer = new DevelopmentUrlFixer();
  await fixer.run();
}

// 错误处理
process.on("unhandledRejection", (reason) => {
  console.error("未处理的Promise拒绝:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("未捕获的异常:", error);
  process.exit(1);
});

// 执行脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default DevelopmentUrlFixer;
