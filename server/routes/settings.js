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
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// 公开路由
router.get("/public", getPublicSettings);

// 需要认证的路由
router.use(authenticateToken);

// 获取所有设置
router.get("/", getAllSettings);

// 获取特定组的设置
router.get("/group/:group", getSettingsByGroup);

// 获取单个设置
router.get("/:key", getSettingByKey);

// 更新单个设置
router.put("/:key", updateSetting);

// 批量更新设置
router.put("/", bulkUpdateSettings);

// 删除设置
router.delete("/:key", deleteSetting);

// 重置为默认设置
router.post("/reset", resetToDefault);

export default router;
