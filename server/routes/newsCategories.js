/**
 * @openapi
 * tags:
 *   name: NewsCategories
 *   description: 新闻分类管理
 */

import express from "express";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryOrder,
  getCoreCategories,
} from "../controllers/newsCategoryController.js";
import { authenticateToken } from "../middleware/auth.js";
import { checkPermission } from "../middleware/permissionMiddleware.js";
import {
  resourceCache,
  clearCacheMiddleware,
  CacheTTL,
} from "../middleware/cache.js";

const router = express.Router();

// 公开路由
router.get("/", resourceCache("news_categories", CacheTTL.LONG), getCategories);
router.get(
  "/core",
  resourceCache("news_categories:core", CacheTTL.LONG),
  getCoreCategories,
);
router.get("/:id", getCategoryById);

// 需要认证的路由
router.use(authenticateToken);

// 创建分类（仅管理员）
router.post(
  "/",
  checkPermission("news", "create"),
  clearCacheMiddleware("news_categories:*"),
  createCategory,
);

// 更新分类（仅管理员）
router.put(
  "/:id",
  checkPermission("news", "update"),
  clearCacheMiddleware("news_categories:*"),
  updateCategory,
);

// 删除分类（仅管理员）
router.delete(
  "/:id",
  checkPermission("news", "delete"),
  clearCacheMiddleware("news_categories:*"),
  deleteCategory,
);

// 更新分类排序（仅管理员）
router.post(
  "/reorder",
  checkPermission("news", "update"),
  clearCacheMiddleware("news_categories:*"),
  updateCategoryOrder,
);

export default router;
