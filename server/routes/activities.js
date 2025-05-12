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
  updateAttendeeCount,
} from "../controllers/activityController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// 公开路由
router.get("/", getActivityList);
router.get("/upcoming", getUpcomingActivities);
router.get("/:id", getActivityById);

// 需要登录的路由
router.use(protect);

// 需要编辑权限的路由
router.use(restrictTo("admin", "editor"));
router.post("/", createActivity);
router.patch("/:id", updateActivity);
router.delete("/:id", restrictTo("admin"), deleteActivity);

// 发布状态和精选状态切换
router.patch("/:id/publish", togglePublishStatus);
router.patch("/:id/feature", restrictTo("admin"), toggleFeaturedStatus);

// 更新参与者数量
router.patch("/:id/attendees", updateAttendeeCount);

export default router;
