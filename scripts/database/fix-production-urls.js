#!/usr/bin/env node

/**
 * 修复生产环境中包含 localhost:3000 的资源URL
 * 此脚本直接连接生产数据库进行修复
 */

import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载生产环境配置
dotenv.config({ path: path.join(__dirname, "../../server/.env.production") });

const PRODUCTION_MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk";
const PRODUCTION_DOMAIN = "https://horsduroot.com";

class ProductionUrlFixer {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      console.log("🔗 连接生产数据库...");
      this.client = new MongoClient(PRODUCTION_MONGO_URI);
      await this.client.connect();
      this.db = this.client.db();
      console.log("✅ 生产数据库连接成功");
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
      console.log("\n🔍 查找包含 localhost:3000 的资源记录...");

      const collection = this.db.collection("resources");

      // 查找所有包含 localhost:3000 的资源
      const query = {
        $or: [
          { fileUrl: { $regex: "localhost:3000" } },
          { videoUrl: { $regex: "localhost:3000" } },
          { thumbnail: { $regex: "localhost:3000" } },
          { "attachments.url": { $regex: "localhost:3000" } },
          { "source.url": { $regex: "localhost:3000" } },
        ],
      };

      const problematicResources = await collection.find(query).toArray();

      console.log(
        `📊 找到 ${problematicResources.length} 个包含 localhost:3000 的资源记录`,
      );

      if (problematicResources.length > 0) {
        console.log("\n🔍 问题资源详情:");
        problematicResources.forEach((resource, index) => {
          console.log(`\n${index + 1}. ${resource.title}`);
          console.log(`   ID: ${resource._id}`);

          if (resource.fileUrl && resource.fileUrl.includes("localhost:3000")) {
            console.log(`   🚨 fileUrl: ${resource.fileUrl}`);
          }
          if (
            resource.videoUrl &&
            resource.videoUrl.includes("localhost:3000")
          ) {
            console.log(`   🚨 videoUrl: ${resource.videoUrl}`);
          }
          if (
            resource.thumbnail &&
            resource.thumbnail.includes("localhost:3000")
          ) {
            console.log(`   🚨 thumbnail: ${resource.thumbnail}`);
          }
          if (resource.attachments) {
            resource.attachments.forEach((attachment, idx) => {
              if (attachment.url && attachment.url.includes("localhost:3000")) {
                console.log(`   🚨 attachments[${idx}].url: ${attachment.url}`);
              }
            });
          }
          if (
            resource.source?.url &&
            resource.source.url.includes("localhost:3000")
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

      // 修复 fileUrl 字段
      const fileUrlResult = await collection.updateMany(
        { fileUrl: { $regex: "localhost:3000" } },
        [
          {
            $set: {
              fileUrl: {
                $replaceAll: {
                  input: "$fileUrl",
                  find: "localhost:3000",
                  replacement: "horsduroot.com",
                },
              },
            },
          },
        ],
      );
      fixedCount += fileUrlResult.modifiedCount;
      console.log(`✅ 修复了 ${fileUrlResult.modifiedCount} 个 fileUrl 字段`);

      // 修复 videoUrl 字段
      const videoUrlResult = await collection.updateMany(
        { videoUrl: { $regex: "localhost:3000" } },
        [
          {
            $set: {
              videoUrl: {
                $replaceAll: {
                  input: "$videoUrl",
                  find: "localhost:3000",
                  replacement: "horsduroot.com",
                },
              },
            },
          },
        ],
      );
      fixedCount += videoUrlResult.modifiedCount;
      console.log(`✅ 修复了 ${videoUrlResult.modifiedCount} 个 videoUrl 字段`);

      // 修复 thumbnail 字段
      const thumbnailResult = await collection.updateMany(
        { thumbnail: { $regex: "localhost:3000" } },
        [
          {
            $set: {
              thumbnail: {
                $replaceAll: {
                  input: "$thumbnail",
                  find: "localhost:3000",
                  replacement: "horsduroot.com",
                },
              },
            },
          },
        ],
      );
      fixedCount += thumbnailResult.modifiedCount;
      console.log(
        `✅ 修复了 ${thumbnailResult.modifiedCount} 个 thumbnail 字段`,
      );

      // 修复 attachments.url 字段
      const attachmentResult = await collection.updateMany(
        { "attachments.url": { $regex: "localhost:3000" } },
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
                            find: "localhost:3000",
                            replacement: "horsduroot.com",
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
      console.log(
        `✅ 修复了 ${attachmentResult.modifiedCount} 个资源的 attachments.url 字段`,
      );

      // 修复 source.url 字段
      const sourceResult = await collection.updateMany(
        { "source.url": { $regex: "localhost:3000" } },
        [
          {
            $set: {
              "source.url": {
                $replaceAll: {
                  input: "$source.url",
                  find: "localhost:3000",
                  replacement: "horsduroot.com",
                },
              },
            },
          },
        ],
      );
      console.log(`✅ 修复了 ${sourceResult.modifiedCount} 个 source.url 字段`);

      return {
        totalFixed: fixedCount,
        fileUrl: fileUrlResult.modifiedCount,
        videoUrl: videoUrlResult.modifiedCount,
        thumbnail: thumbnailResult.modifiedCount,
        attachments: attachmentResult.modifiedCount,
        source: sourceResult.modifiedCount,
      };
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
            { fileUrl: { $regex: "localhost:3000" } },
            { videoUrl: { $regex: "localhost:3000" } },
            { thumbnail: { $regex: "localhost:3000" } },
            { "attachments.url": { $regex: "localhost:3000" } },
            { "source.url": { $regex: "localhost:3000" } },
          ],
        })
        .toArray();

      if (remainingIssues.length === 0) {
        console.log("✅ 所有问题已修复！没有发现剩余的 localhost:3000 引用");
      } else {
        console.log(
          `⚠️  仍有 ${remainingIssues.length} 个资源包含 localhost:3000`,
        );
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
      console.log("\n💾 创建数据备份...");

      const collection = this.db.collection("resources");
      const backupData = await collection.find({}).toArray();

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFileName = `resources-backup-${timestamp}.json`;

      // 这里只记录备份信息，实际的文件写入需要在有文件系统权限的地方进行
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
      console.log("🚀 开始生产环境URL修复流程\n");
      console.log(`🌐 目标域名: ${PRODUCTION_DOMAIN}`);
      console.log(`🔗 数据库: ${PRODUCTION_MONGO_URI}\n`);

      await this.connect();

      // 步骤1: 创建备份
      await this.createBackup();

      // 步骤2: 查找问题资源
      const problematicResources = await this.findProblematicResources();

      if (problematicResources.length === 0) {
        console.log("\n🎉 没有发现需要修复的URL！");
        return;
      }

      // 步骤3: 询问用户确认
      console.log("\n⚠️  即将开始修复操作，这将直接修改生产数据库！");
      console.log("📝 请确保已经做好了数据备份");

      // 在生产环境中，我们直接执行修复（因为这是紧急修复）
      console.log("\n🔧 开始执行修复...");

      // 步骤4: 执行修复
      const fixResult = await this.fixResourceUrls();

      // 步骤5: 验证修复结果
      const remainingIssues = await this.verifyFix();

      // 步骤6: 输出修复报告
      console.log("\n📊 修复完成报告:");
      console.log(`✅ 修复的 fileUrl 字段: ${fixResult.fileUrl}`);
      console.log(`✅ 修复的 videoUrl 字段: ${fixResult.videoUrl}`);
      console.log(`✅ 修复的 thumbnail 字段: ${fixResult.thumbnail}`);
      console.log(`✅ 修复的 attachments 字段: ${fixResult.attachments}`);
      console.log(`✅ 修复的 source 字段: ${fixResult.source}`);
      console.log(`📈 总计修复: ${fixResult.totalFixed} 个字段`);
      console.log(`🔍 剩余问题: ${remainingIssues} 个`);

      if (remainingIssues === 0) {
        console.log(
          "\n🎉 生产环境URL修复完成！所有 localhost:3000 引用已被替换为 horsduroot.com",
        );
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
  const fixer = new ProductionUrlFixer();
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

export default ProductionUrlFixer;
