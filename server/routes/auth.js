// auth.js - 认证路由
import express from "express";
import {
  login,
  logout,
  register,
  sendVerificationCode,
  protect,
  getMe,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";

const router = express.Router();

// ==============================================
// 公开路由（不需要认证）
// ==============================================

// 用户登录
router.post("/login", login);

// 用户注册
router.post("/register", register);

// 发送手机验证码
router.post("/send-code", sendVerificationCode);

// 用户登出（通常也不需要认证，因为只是清除客户端状态）
router.post("/logout", logout);

// ==============================================
// 需要认证的路由
// ==============================================

// 保护以下所有路由，需要登录才能访问
router.use(protect);

// 获取当前用户信息
router.get("/me", getMe);

// 更新个人资料
router.put("/profile", updateProfile);

// 修改密码
router.put("/change-password", changePassword);

export default router;
