// activities.js - 活动管理路由
import express from "express";
import {
  getActivityList,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  togglePublishStatus,
  toggleFeaturedStatus,
  getUpcomingActivities,
} from "../controllers/activityController.js";
import { getActivityRegistrations } from "../controllers/activityRegistrationController.js";
import { authenticateToken } from "../middleware/auth.js";
import { checkPermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

// 获取活动列表
router.get("/", getActivityList);

// 获取单个活动
router.get("/:id", getActivityById);

// 获取指定活动的所有报名记录 (管理员/活动管理者)
router.get(
  "/:id/registrations",
  authenticateToken,
  checkPermission("activities", "manage"),
  getActivityRegistrations,
);

// 创建新活动
router.post("/", authenticateToken, createActivity);

// 更新活动
router.put("/:id", authenticateToken, updateActivity);

// 删除活动
router.delete("/:id", authenticateToken, deleteActivity);

// 切换发布状态
router.patch("/:id/publish", authenticateToken, togglePublishStatus);

// 切换推荐状态
router.patch("/:id/featured", authenticateToken, toggleFeaturedStatus);

// 获取即将开始的活动
router.get("/upcoming", getUpcomingActivities);

export default router;
