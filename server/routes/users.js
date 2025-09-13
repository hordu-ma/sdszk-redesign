// users.js - 用户路由
import express from "express";
import multer from "multer";
import path from "path";
import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  updatePassword,
  getMe,
  updateMyProfile,
  uploadAvatar,
  getUserStats,
  getMyActivityLog,
  deleteMyAccount,
  createUser,
  updateUserStatus,
  resetUserPassword,
  batchDeleteUsers,
} from "../controllers/userController.js";
import { protect, restrictTo } from "../controllers/authController.js";

const router = express.Router();

// 配置头像上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const base = process.env.UPLOAD_DIR || "uploads";
    const dest = `${base}/avatars`;
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `avatar-${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`,
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("只允许上传图片文件"), false);
    }
  },
});

// ==============================================
// 中间件：保护所有用户路由（需要登录）
// ==============================================
router.use(protect);

// ==============================================
// 当前用户相关路由 (普通用户可访问)
// ==============================================

// GET /api/users/me - 获取当前用户信息
router.get("/me", getMe);

// PATCH /api/users/me - 更新当前用户个人信息
router.patch("/me", updateMyProfile);

// PATCH /api/users/update-password - 更新当前用户密码
router.patch("/update-password", updatePassword);

// POST /api/users/upload-avatar - 上传头像
router.post("/upload-avatar", upload.single("avatar"), uploadAvatar);

// GET /api/users/stats - 获取用户统计信息
router.get("/stats", getUserStats);

// GET /api/users/activity-log - 获取用户活动日志
router.get("/activity-log", getMyActivityLog);

// DELETE /api/users/delete-account - 删除当前用户账户
router.delete("/delete-account", deleteMyAccount);

// ==============================================
// 中间件：限制以下路由只允许管理员访问
// ==============================================
router.use(restrictTo("admin"));

// ==============================================
// 管理员用户管理路由
// ==============================================

// GET /api/users - 获取所有用户列表
// POST /api/users - 创建新用户
router
  .route("/")
  .get(getAllUsers) // 获取用户列表（分页、搜索、筛选）
  .post(createUser); // 创建新用户

// POST /api/users/batch-delete - 批量删除用户
router.post("/batch-delete", batchDeleteUsers);

// GET /api/users/:id - 获取特定用户信息
// PATCH /api/users/:id - 更新用户信息
// DELETE /api/users/:id - 删除用户
router
  .route("/:id")
  .get(getUser) // 获取特定用户详细信息
  .patch(updateUser) // 更新用户信息（不包括密码）
  .delete(deleteUser); // 软删除用户

// PATCH /api/users/:id/status - 更新用户状态
router.patch("/:id/status", updateUserStatus);

// PATCH /api/users/:id/reset-password - 管理员重置用户密码
router.patch("/:id/reset-password", resetUserPassword);

export default router;
