import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { checkPermission } from "../middleware/permissionMiddleware.js";
import News from "../models/News.js";
import { catchAsync } from "../utils/catchAsync.js";
import { NotFoundError } from "../utils/appError.js";

const router = express.Router();

// 获取新闻列表
router.get(
  "/",
  catchAsync(async (req, res) => {
    const { category, page = 1, limit = 10 } = req.query;
    const query = category ? { category } : {};

    const news = await News.find(query)
      .sort({ publishDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await News.countDocuments(query);

    res.json({
      data: news,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  })
);

// 获取单个新闻详情
router.get(
  "/:id",
  catchAsync(async (req, res) => {
    const news = await News.findById(req.params.id);
    if (!news) {
      throw new NotFoundError("新闻不存在");
    }
    // 更新浏览量
    news.viewCount += 1;
    await news.save();
    res.json(news);
  })
);

// 创建新闻
router.post(
  "/",
  authenticateToken,
  checkPermission("news", "create"),
  catchAsync(async (req, res) => {
    const news = new News(req.body);
    const savedNews = await news.save();
    res.status(201).json(savedNews);
  })
);

// 更新新闻
router.put(
  "/:id",
  authenticateToken,
  checkPermission("news", "update"),
  catchAsync(async (req, res) => {
    const news = await News.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!news) {
      throw new NotFoundError("新闻不存在");
    }
    res.json(news);
  })
);

// 删除新闻
router.delete(
  "/:id",
  authenticateToken,
  checkPermission("news", "delete"),
  catchAsync(async (req, res) => {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) {
      throw new NotFoundError("新闻不存在");
    }
    res.json({ message: "新闻已删除" });
  })
);

export default router;
