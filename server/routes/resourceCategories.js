import express from "express";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryOrder,
} from "../controllers/resourceCategoryController.js";
import { authenticateToken } from "../middleware/auth.js";
import { checkPermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

// 公开路由
router.get("/", getCategories);
router.get("/:id", getCategory);

// 需要认证的路由
router.use(authenticateToken);

// 创建分类（仅管理员）
router.post("/", checkPermission("resource", "create"), createCategory);

// 更新分类（仅管理员）
router.put("/:id", checkPermission("resource", "update"), updateCategory);

// 删除分类（仅管理员）
router.delete("/:id", checkPermission("resource", "delete"), deleteCategory);

// 更新分类排序（仅管理员）
router.post(
  "/reorder",
  checkPermission("resource", "update"),
  updateCategoryOrder,
);

export default router;
