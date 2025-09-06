#!/usr/bin/env node

/**
 * 修复现有新闻内容中的图片显示问题
 * 将 Markdown 格式 ![alt](url) 转换为 HTML 格式 <img src="url" alt="alt">
 *
 * 使用方法:
 * 1. 测试模式 (不保存): node fix-news-images.js
 * 2. 执行修复 (保存): node fix-news-images.js --execute
 * 3. 修复指定文章: node fix-news-images.js --id 123456 --execute
 * 4. 生成修复报告: node fix-news-images.js --report
 *
 * 环境变量:
 * - NODE_ENV: 设置为 production 以使用生产环境配置
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 获取脚本当前目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
const envFile =
  process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "../../.env.production")
    : path.resolve(__dirname, "../../.env");

dotenv.config({ path: envFile });

// 命令行参数
const args = process.argv.slice(2);
const execute = args.includes("--execute");
const generateReport = args.includes("--report");
const specificId = args.includes("--id")
  ? args[args.indexOf("--id") + 1]
  : null;

// 颜色定义
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// 日志功能
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) =>
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  title: (msg) =>
    console.log(
      `\n${colors.bright}${colors.cyan}=== ${msg} ===${colors.reset}\n`,
    ),
};

// 数据库连接
const connectDB = async () => {
  try {
    // 获取数据库连接字符串
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      log.error("未找到数据库连接字符串 (MONGODB_URI)");
      process.exit(1);
    }

    log.info(`正在连接到数据库: ${uri.split("@")[1] || uri}`);

    // 连接数据库
    await mongoose.connect(uri, {});

    log.success("数据库连接成功");
  } catch (error) {
    log.error(`数据库连接失败: ${error.message}`);
    process.exit(1);
  }
};

// 定义新闻 Schema
const NewsSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    category: mongoose.Schema.Types.Mixed,
    status: String,
    publishDate: Date,
    createdAt: Date,
    updatedAt: Date,
  },
  { collection: "news" },
);

const News = mongoose.model("News", NewsSchema);

// 匹配 Markdown 图片语法的正则表达式
const MARKDOWN_IMAGE_REGEX = /!\[(.*?)\]\((.*?)\)/g;

// 转换 Markdown 图片为 HTML 图片
function convertMarkdownImagesToHtml(content) {
  if (!content) return { content: "", count: 0 };

  let count = 0;
  const convertedContent = content.replace(
    MARKDOWN_IMAGE_REGEX,
    (match, alt, url) => {
      count++;
      return `<img src="${url}" alt="${alt || "图片"}" style="max-width: 100%;" />`;
    },
  );

  return {
    content: convertedContent,
    count,
    hasChanged: count > 0 && convertedContent !== content,
  };
}

// 修复单个新闻文章
async function fixNewsItem(news) {
  const { content, _id, title } = news;

  const {
    content: newContent,
    count,
    hasChanged,
  } = convertMarkdownImagesToHtml(content);

  if (!hasChanged) {
    return { fixed: false, id: _id.toString(), title, message: "无需修复" };
  }

  if (execute) {
    try {
      await News.updateOne(
        { _id: news._id },
        { $set: { content: newContent } },
      );

      return {
        fixed: true,
        id: _id.toString(),
        title,
        count,
        message: `成功修复 ${count} 处图片引用`,
      };
    } catch (error) {
      return {
        fixed: false,
        id: _id.toString(),
        title,
        error: error.message,
        message: `更新失败: ${error.message}`,
      };
    }
  } else {
    // 测试模式，不执行实际更新
    return {
      fixed: false,
      id: _id.toString(),
      title,
      count,
      message: `将修复 ${count} 处图片引用 (测试模式)`,
    };
  }
}

// 生成修复报告
function generateFixReport(results) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  const reportPath = path.resolve(
    __dirname,
    `../../fix-news-images-report-${timestamp}.json`,
  );

  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log.success(`报告已生成: ${reportPath}`);

  // 简单统计
  const totalNews = results.length;
  const fixedNews = results.filter((r) => r.fixed).length;
  const needFix = results.filter((r) => r.count > 0).length;
  const totalImages = results.reduce((sum, item) => sum + (item.count || 0), 0);

  log.title("修复统计");
  console.log(`- 总文章数: ${totalNews}`);
  console.log(`- 需修复文章: ${needFix}`);
  console.log(`- 已修复文章: ${fixedNews}`);
  console.log(`- 图片引用总数: ${totalImages}`);

  if (execute) {
    console.log(`\n${colors.green}✓ 修复操作已完成${colors.reset}`);
  } else {
    console.log(
      `\n${colors.yellow}⚠ 这是测试模式，没有实际修复任何内容${colors.reset}`,
    );
    console.log(`  使用 --execute 参数执行实际修复`);
  }
}

// 主函数
async function main() {
  log.title(`新闻图片修复工具 ${execute ? "(执行模式)" : "(测试模式)"}`);

  try {
    await connectDB();

    let query = { status: "published" };

    // 如果指定了文章ID
    if (specificId) {
      query = { _id: specificId };
      log.info(`正在处理指定文章 ID: ${specificId}`);
    } else {
      log.info("正在查询所有已发布的新闻文章...");
    }

    const allNews = await News.find(query).sort({ createdAt: -1 });

    if (allNews.length === 0) {
      log.warn("未找到任何文章");
      process.exit(0);
    }

    log.info(`找到 ${allNews.length} 篇文章`);

    const results = [];
    let progress = 0;

    for (const news of allNews) {
      progress++;
      process.stdout.write(`\r正在处理: ${progress}/${allNews.length}`);

      const result = await fixNewsItem(news);
      results.push(result);

      // 非静默模式或有错误时，打印处理结果
      if (result.error || result.count > 0) {
        process.stdout.write("\r" + " ".repeat(50) + "\r"); // 清除进度显示
        const statusSymbol = result.fixed ? "✓" : result.error ? "✗" : "⚠";
        const statusColor = result.fixed
          ? colors.green
          : result.error
            ? colors.red
            : colors.yellow;
        console.log(
          `${statusColor}${statusSymbol}${colors.reset} [${result.id}] ${result.title.substring(0, 40)}... ${result.message}`,
        );
      }
    }

    process.stdout.write("\r" + " ".repeat(50) + "\r"); // 清除进度显示
    log.success(`处理完成 ${allNews.length} 篇文章`);

    // 生成报告
    if (generateReport || results.some((r) => r.count > 0)) {
      generateFixReport(results);
    }
  } catch (error) {
    log.error(`执行过程中出错: ${error.message}`);
    console.error(error);
  } finally {
    // 关闭数据库连接
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      log.info("数据库连接已关闭");
    }
  }
}

main();
