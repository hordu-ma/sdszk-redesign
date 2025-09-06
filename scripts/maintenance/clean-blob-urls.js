#!/usr/bin/env node

/**
 * 清理历史新闻数据中的 blob URL 脚本
 * 用途：将数据库中包含 blob: 链接的图片标签替换为提示文本
 * 版本：1.0
 * 作者：系统维护脚本
 */

import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量 - 优先使用阿里云生产环境配置
const envFile = process.env.NODE_ENV === "production" ? ".env.aliyun" : ".env";
dotenv.config({ path: path.join(__dirname, "../../", envFile) });

// MongoDB 连接配置
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk";
const DB_NAME = process.env.DB_NAME || "sdszk";

// 显示连接信息（隐藏敏感信息）
console.log(`使用环境配置: ${envFile}`);
console.log(`数据库URI: ${MONGODB_URI.replace(/\/\/[^@]+@/, "//***:***@")}`);

// 颜色输出工具
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) =>
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) =>
    console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.magenta}[STEP]${colors.reset} ${msg}`),
};

/**
 * 检测内容中是否包含 blob URL
 */
function hasBlobUrls(content) {
  if (!content) return false;
  return /blob:https?:\/\/[^\s)]+/gi.test(content);
}

/**
 * 清理内容中的 blob URL
 */
function cleanBlobUrls(content) {
  if (!content) return content;

  // 匹配并替换 blob URL 图片标签
  const blobImageRegex = /!\[([^\]]*)\]\(blob:https?:\/\/[^\s)]+\)/gi;
  const cleanedContent = content.replace(blobImageRegex, (match, altText) => {
    const displayText = altText || "图片";
    return `> **${displayText}**（图片已失效，请重新上传）`;
  });

  // 也处理直接的 blob URL
  const directBlobRegex = /blob:https?:\/\/[^\s]+/gi;
  return cleanedContent.replace(directBlobRegex, "（链接已失效）");
}

/**
 * 分析数据库中的 blob URL 情况
 */
async function analyzeBlobUrls(db) {
  log.step("分析数据库中的 blob URL 情况...");

  const collections = ["news", "resources"]; // 可能包含富文本内容的集合
  const results = {};

  for (const collectionName of collections) {
    try {
      const collection = db.collection(collectionName);

      // 查找包含 blob URL 的文档
      const documents = await collection.find({}).toArray();
      const affectedDocs = [];

      for (const doc of documents) {
        let hasBlob = false;
        const blobFields = [];

        // 检查可能包含富文本的字段
        const fieldsToCheck = ["content", "description", "summary"];

        for (const field of fieldsToCheck) {
          if (doc[field] && hasBlobUrls(doc[field])) {
            hasBlob = true;
            blobFields.push(field);
          }
        }

        if (hasBlob) {
          affectedDocs.push({
            _id: doc._id,
            title: doc.title || doc.name || "无标题",
            fields: blobFields,
            createdAt: doc.createdAt,
          });
        }
      }

      results[collectionName] = affectedDocs;

      if (affectedDocs.length > 0) {
        log.warning(
          `${collectionName} 集合中发现 ${affectedDocs.length} 个包含 blob URL 的文档`,
        );
      } else {
        log.success(`${collectionName} 集合中没有发现 blob URL`);
      }
    } catch (error) {
      log.error(`分析 ${collectionName} 集合时出错: ${error.message}`);
    }
  }

  return results;
}

/**
 * 清理指定集合中的 blob URL
 */
async function cleanCollection(
  db,
  collectionName,
  affectedDocs,
  dryRun = true,
) {
  if (affectedDocs.length === 0) {
    log.info(`${collectionName} 集合无需清理`);
    return { cleaned: 0, errors: 0 };
  }

  log.step(`${dryRun ? "模拟" : "执行"}清理 ${collectionName} 集合...`);

  const collection = db.collection(collectionName);
  let cleaned = 0;
  let errors = 0;

  for (const docInfo of affectedDocs) {
    try {
      // 获取完整文档
      const doc = await collection.findOne({ _id: docInfo._id });
      if (!doc) {
        log.warning(`文档 ${docInfo._id} 不存在，跳过`);
        continue;
      }

      const updateFields = {};
      let hasUpdates = false;

      // 清理各个字段
      for (const field of docInfo.fields) {
        if (doc[field] && hasBlobUrls(doc[field])) {
          const cleanedContent = cleanBlobUrls(doc[field]);
          updateFields[field] = cleanedContent;
          hasUpdates = true;

          log.info(`文档 "${docInfo.title}" 的字段 ${field} 需要清理`);
        }
      }

      if (hasUpdates) {
        if (!dryRun) {
          // 执行更新
          await collection.updateOne(
            { _id: docInfo._id },
            {
              $set: {
                ...updateFields,
                updatedAt: new Date(),
              },
            },
          );
        }

        cleaned++;
        log.success(`${dryRun ? "模拟" : ""}清理文档: "${docInfo.title}"`);
      }
    } catch (error) {
      errors++;
      log.error(`清理文档 ${docInfo._id} 时出错: ${error.message}`);
    }
  }

  return { cleaned, errors };
}

/**
 * 备份受影响的文档
 */
async function backupAffectedDocuments(db, analysisResults) {
  log.step("创建备份...");

  const backupCollection = db.collection("blob_url_backup");
  const backupData = {
    timestamp: new Date(),
    description: "blob URL 清理前的数据备份",
    data: {},
  };

  for (const [collectionName, affectedDocs] of Object.entries(
    analysisResults,
  )) {
    if (affectedDocs.length > 0) {
      const collection = db.collection(collectionName);
      const documents = await collection
        .find({
          _id: { $in: affectedDocs.map((doc) => doc._id) },
        })
        .toArray();

      backupData.data[collectionName] = documents;
    }
  }

  if (Object.keys(backupData.data).length > 0) {
    await backupCollection.insertOne(backupData);
    log.success(`备份已创建，备份ID: ${backupData._id}`);
    return backupData._id;
  } else {
    log.info("无需创建备份");
    return null;
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--execute");
  const skipBackup = args.includes("--skip-backup");

  console.log(`
${colors.cyan}====================================
   🧹 Blob URL 清理工具 v1.0
====================================${colors.reset}

环境: ${process.env.NODE_ENV || "development"}
配置文件: ${envFile}
数据库: ${DB_NAME}
模式: ${dryRun ? "🔍 预览模式（不会修改数据）" : "⚡ 执行模式（会修改数据）"}
备份: ${skipBackup ? "❌ 跳过备份" : "✅ 自动备份"}

${dryRun ? "💡 添加 --execute 参数以实际执行清理" : ""}
${colors.cyan}====================================${colors.reset}
`);

  let client;

  try {
    // 连接数据库
    log.step("连接数据库...");
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    log.success("数据库连接成功");

    // 分析数据
    const analysisResults = await analyzeBlobUrls(db);

    // 统计总数
    const totalAffected = Object.values(analysisResults).reduce(
      (sum, docs) => sum + docs.length,
      0,
    );

    if (totalAffected === 0) {
      log.success("🎉 没有发现需要清理的 blob URL，数据库状态良好！");
      return;
    }

    log.warning(`发现 ${totalAffected} 个文档需要清理`);

    // 显示详细信息
    for (const [collectionName, affectedDocs] of Object.entries(
      analysisResults,
    )) {
      if (affectedDocs.length > 0) {
        console.log(
          `\n${colors.yellow}${collectionName} 集合受影响的文档：${colors.reset}`,
        );
        affectedDocs.forEach((doc, index) => {
          console.log(
            `  ${index + 1}. "${doc.title}" (字段: ${doc.fields.join(", ")})`,
          );
        });
      }
    }

    if (dryRun) {
      console.log(
        `\n${colors.blue}🔍 这是预览模式，不会修改任何数据。${colors.reset}`,
      );
      console.log(
        `${colors.blue}   如需执行清理，请使用: npm run clean:blob-urls -- --execute${colors.reset}`,
      );
      return;
    }

    // 询问确认
    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question("\n⚠️  确定要执行清理操作吗？(y/N): ", resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
      log.info("操作已取消");
      return;
    }

    // 创建备份
    let backupId = null;
    if (!skipBackup) {
      backupId = await backupAffectedDocuments(db, analysisResults);
    }

    // 执行清理
    log.step("开始执行清理操作...");
    let totalCleaned = 0;
    let totalErrors = 0;

    for (const [collectionName, affectedDocs] of Object.entries(
      analysisResults,
    )) {
      const result = await cleanCollection(
        db,
        collectionName,
        affectedDocs,
        false,
      );
      totalCleaned += result.cleaned;
      totalErrors += result.errors;
    }

    // 输出结果
    console.log(`
${colors.green}====================================
         🎉 清理完成！
====================================${colors.reset}

📊 清理统计:
   • 清理成功: ${totalCleaned} 个文档
   • 清理失败: ${totalErrors} 个文档
   • 备份ID: ${backupId || "无"}

📝 后续建议:
   1. 请通知内容管理员重新上传相关图片
   2. 可在 CMS 后台编辑受影响的新闻/资源
   3. 新的图片上传将正常工作

${colors.green}====================================${colors.reset}
`);
  } catch (error) {
    log.error(`脚本执行失败: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      log.info("数据库连接已关闭");
    }
  }
}

// 错误处理
process.on("uncaughtException", (error) => {
  log.error(`未捕获的异常: ${error.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  log.error(`未处理的 Promise 拒绝: ${reason}`);
  process.exit(1);
});

// 优雅退出
process.on("SIGINT", () => {
  log.info("\n收到中断信号，正在退出...");
  process.exit(0);
});

// 执行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;
