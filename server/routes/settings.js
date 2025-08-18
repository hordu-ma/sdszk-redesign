/**
 * @openapi
 * tags:
 *   name: Settings
 *   description: 站点设置管理
 */

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
import { authenticateToken, checkRole } from "../middleware/auth.js";
import {
  resourceCache,
  clearCacheMiddleware,
  CacheTTL,
} from "../middleware/cache.js";

const router = express.Router();

// 公开路由
router.get(
  "/public",
  resourceCache("settings", CacheTTL.VERY_LONG),
  getPublicSettings
);

// 需要认证的路由
router.use(authenticateToken);

// 获取所有设置
router.get("/", getAllSettings);

// 获取特定组的设置
router.get("/group/:group", getSettingsByGroup);

// 获取单个设置
router.get("/:key", getSettingByKey);

// 更新单个设置
router.put(
  "/:key",
  checkRole(["admin"]),
  clearCacheMiddleware("settings:*"),
  updateSetting
);

// 批量更新设置
router.put(
  "/",
  checkRole(["admin"]),
  clearCacheMiddleware("settings:*"),
  bulkUpdateSettings
);

// 删除设置
router.delete(
  "/:key",
  checkRole(["admin"]),
  clearCacheMiddleware("settings:*"),
  deleteSetting
);

// 重置为默认设置
router.post(
  "/reset",
  checkRole(["admin"]),
  clearCacheMiddleware("settings:*"),
  resetToDefault
);

export default router;
