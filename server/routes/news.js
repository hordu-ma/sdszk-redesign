import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { checkPermission } from "../middleware/permissionMiddleware.js";
import {
  validate,
  validateQuery,
  validateParams,
  schemas,
} from "../middleware/validation.js";
import {
  getNewsList,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
} from "../controllers/newsController.js";

const router = express.Router();

// 获取新闻列表
router.get("/", validateQuery(schemas.pagination), getNewsList);

// 获取单个新闻详情
router.get("/:id", getNewsById);

// 创建新闻
router.post(
  "/",
  authenticateToken,
  checkPermission("news", "create"),
  validate(schemas.news.create),
  createNews,
);

// 更新新闻
router.put(
  "/:id",
  authenticateToken,
  checkPermission("news", "update"),
  validate(schemas.news.update),
  updateNews,
);

// 删除新闻
router.delete(
  "/:id",
  authenticateToken,
  checkPermission("news", "delete"),
  deleteNews,
);

export default router;
