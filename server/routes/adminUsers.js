// adminUsers.js - 管理员用户管理路由
import express from "express";
import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  createUser,
  updateUserStatus,
  resetUserPassword,
  batchDeleteUsers,
  getUserStats,
} from "../controllers/userController.js";
import { protect, restrictTo } from "../controllers/authController.js";

const router = express.Router();

// 保护所有管理员路由 - 需要登录且为管理员
router.use(protect);
router.use(restrictTo("admin"));

// 用户列表和统计
router.get("/", getAllUsers);
router.get("/stats", getUserStats);

// 创建用户
router.post("/", createUser);

// 批量操作
router.post("/batch-delete", batchDeleteUsers);

// 单个用户操作
router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

// 用户状态管理
router.patch("/:id/status", updateUserStatus);

// 密码管理
router.patch("/:id/reset-password", resetUserPassword);

export default router;
