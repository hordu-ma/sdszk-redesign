// auth.js - 认证路由
import express from "express";
import {
  login,
  register,
  protect,
  restrictTo,
  generateCaptcha,
} from "../controllers/authController.js";

const router = express.Router();

// 获取验证码
router.get("/captcha", generateCaptcha);

// 登录路由
router.post("/login", login);

// 保护以下所有路由，需要登录才能访问
router.use(protect);

// 注册新用户 (仅限管理员)
router.post("/register", restrictTo("admin"), register);

export default router;
