// resources.js - 资源管理路由
import express from "express";
import {
  getResourceList,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  togglePublishStatus,
  toggleFeaturedStatus,
  getFeaturedResources,
  getCategoryResources,
} from "../controllers/resourceController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// 公开路由
router.get("/", getResourceList);
router.get("/featured", getFeaturedResources);
router.get("/category/:category", getCategoryResources);
router.get("/:id", getResourceById);

// 需要登录的路由
router.use(protect);

// 需要编辑权限的路由
router.use(restrictTo("admin", "editor"));
router.post("/", createResource);
router.patch("/:id", updateResource);
router.delete("/:id", restrictTo("admin"), deleteResource);

// 发布状态切换
router.patch("/:id/publish", togglePublishStatus);
router.patch("/:id/feature", restrictTo("admin"), toggleFeaturedStatus);

export default router;
