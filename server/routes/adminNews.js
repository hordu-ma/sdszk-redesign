import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { checkPermission } from "../middleware/permissionMiddleware.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  getNewsList,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  batchDeleteNews,
  batchUpdateNewsStatus,
  batchUpdateNewsCategory,
  batchAddTags,
  toggleTop,
  toggleFeatured,
  togglePublish,
  getNewsStats,
} from "../controllers/newsController.js";

const router = express.Router();

// 获取新闻列表（管理员版）
router.get(
  "/",
  authenticateToken,
  checkPermission("news", "read"),
  catchAsync(getNewsList),
);

// 获取单个新闻详情（管理员版）
router.get(
  "/:id",
  authenticateToken,
  checkPermission("news", "read"),
  catchAsync(getNewsById),
);

// 创建新闻
router.post(
  "/",
  authenticateToken,
  checkPermission("news", "create"),
  catchAsync(createNews),
);

// 更新新闻
router.put(
  "/:id",
  authenticateToken,
  checkPermission("news", "update"),
  catchAsync(updateNews),
);

// 删除新闻
router.delete(
  "/:id",
  authenticateToken,
  checkPermission("news", "delete"),
  catchAsync(deleteNews),
);

// 批量删除新闻
router.post(
  "/batch-delete",
  authenticateToken,
  checkPermission("news", "delete"),
  catchAsync(batchDeleteNews),
);

// 批量更新新闻状态
router.post(
  "/batch-update-status",
  authenticateToken,
  checkPermission("news", "update"),
  catchAsync(batchUpdateNewsStatus),
);

// 批量更新新闻分类
router.post(
  "/batch-update-category",
  authenticateToken,
  checkPermission("news", "update"),
  catchAsync(batchUpdateNewsCategory),
);

// 批量添加标签
router.post(
  "/batch-add-tags",
  authenticateToken,
  checkPermission("news", "update"),
  catchAsync(batchAddTags),
);

// 切换置顶状态
router.patch(
  "/:id/toggle-top",
  authenticateToken,
  checkPermission("news", "update"),
  catchAsync(toggleTop),
);

// 切换精选状态
router.patch(
  "/:id/toggle-featured",
  authenticateToken,
  checkPermission("news", "update"),
  catchAsync(toggleFeatured),
);

// 切换发布状态
router.patch(
  "/:id/toggle-publish",
  authenticateToken,
  checkPermission("news", "update"),
  catchAsync(togglePublish),
);

// 获取新闻统计信息
router.get(
  "/stats/overview",
  authenticateToken,
  checkPermission("news", "read"),
  catchAsync(getNewsStats),
);

export default router;
