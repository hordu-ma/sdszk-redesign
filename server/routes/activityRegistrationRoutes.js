// server/routes/activityRegistrationRoutes.js - 活动报名路由
import express from "express";
import {
  createActivityRegistration,
  getMyRegistrations,
  cancelMyRegistration,
} from "../controllers/activityRegistrationController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// 所有与“我的报名”相关的操作都需要用户登录
router.use(authenticateToken);

// 提交一个新的活动报名
router.post("/", createActivityRegistration);

// 获取当前用户的所有报名记录
router.get("/my-registrations", getMyRegistrations);

// 用户取消自己的一个报名
router.delete("/:id", cancelMyRegistration);

export default router;
