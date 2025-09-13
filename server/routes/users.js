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

// 保护所有用户路由
router.use(protect);

// 当前用户路由
router.get("/me", getMe);
router.patch("/me", updateMyProfile);
router.patch("/update-password", updatePassword);
router.post("/upload-avatar", upload.single("avatar"), uploadAvatar);
router.get("/stats", getUserStats);
router.get("/activity-log", getMyActivityLog);
router.delete("/delete-account", deleteMyAccount);

// 限制以下路由只允许管理员访问
router.use(restrictTo("admin"));

router.route("/").get(getAllUsers).post(createUser);

router.post("/batch-delete", batchDeleteUsers);

router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

router.patch("/:id/status", updateUserStatus);
router.patch("/:id/reset-password", resetUserPassword);

export default router;
