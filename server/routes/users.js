// users.js - 用户路由
import express from "express";
import multer from "multer";
import path from "path";
import {
  updatePassword,
  getMe,
  updateMyProfile,
  uploadAvatar,
  getUserStats,
  getMyActivityLog,
  deleteMyAccount,
} from "../controllers/userController.js";
import { protect } from "../controllers/authController.js";

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

// 保护所有用户路由 - 需要用户登录
router.use(protect);

// 当前用户自服务路由
router.get("/me", getMe);
router.patch("/me", updateMyProfile);
router.patch("/update-password", updatePassword);
router.post("/upload-avatar", upload.single("avatar"), uploadAvatar);
router.get("/stats", getUserStats);
router.get("/activity-log", getMyActivityLog);
router.delete("/delete-account", deleteMyAccount);

export default router;
