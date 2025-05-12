// settings.js - 站点设置路由
import express from "express";
import {
  getAllSettings,
  getSettingsByGroup,
  getSettingByKey,
  updateSetting,
  bulkUpdateSettings,
  deleteSetting,
  resetToDefault,
  getPublicSettings,
} from "../controllers/siteSettingController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// 公开路由
router.get("/public", getPublicSettings);

// 需要登录的路由
router.use(protect);

// 需要管理员权限的路由
router.get("/", restrictTo("admin", "editor"), getAllSettings);
router.get("/group/:group", restrictTo("admin", "editor"), getSettingsByGroup);
router.get("/:key", restrictTo("admin", "editor"), getSettingByKey);

// 只有管理员可以修改设置
router.use(restrictTo("admin"));
router.patch("/:key", updateSetting);
router.post("/bulk", bulkUpdateSettings);
router.delete("/:key", deleteSetting);
router.post("/reset", resetToDefault);

export default router;
