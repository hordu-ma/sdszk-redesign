// server/scripts/seedNews.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk";

// 定义News模型（简化版）
const newsSchema = new mongoose.Schema({
  title: String,
  summary: String,
  content: String,
  category: mongoose.Schema.Types.ObjectId,
  isPublished: Boolean,
  publishDate: Date,
  createdAt: Date,
  updatedAt: Date,
});
const News = mongoose.model("News", newsSchema, "news");

// 获取一个分类ID（任意一个）
async function getAnyCategoryId() {
  const category = await mongoose.connection.db
    .collection("newscategories")
    .findOne({});
  return category ? category._id : null;
}

async function seedNews() {
  await mongoose.connect(MONGODB_URI);
  const categoryId = await getAnyCategoryId();
  if (!categoryId) {
    console.error("未找到任何新闻分类，请先插入分类数据！");
    process.exit(1);
  }
  const now = new Date();
  const newsList = [
    {
      title: "测试新闻1",
      summary: "这是一条测试新闻摘要1",
      content: "测试新闻内容1",
      category: categoryId,
      isPublished: true,
      publishDate: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "测试新闻2",
      summary: "这是一条测试新闻摘要2",
      content: "测试新闻内容2",
      category: categoryId,
      isPublished: true,
      publishDate: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "测试新闻3",
      summary: "这是一条测试新闻摘要3",
      content: "测试新闻内容3",
      category: categoryId,
      isPublished: true,
      publishDate: now,
      createdAt: now,
      updatedAt: now,
    },
  ];
  await News.insertMany(newsList);
  console.log("已插入测试新闻数据！");
  process.exit(0);
}

seedNews();
