// activityLogs.js - 活动日志路由
import express from "express";
import { getActivityLogs } from "../controllers/activityLogController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// 获取活动日志
router.get("/", authenticateToken, getActivityLogs);

export default router;
