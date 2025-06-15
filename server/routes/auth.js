// auth.js - 认证路由
import express from "express";
import {
  login,
  logout,
  protect,
  getMe,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";

const router = express.Router();

// 登录路由
router.post("/login", login);
router.post("/logout", logout);

// 保护以下所有路由，需要登录才能访问
router.use(protect);

// 获取当前用户信息
router.get("/me", getMe);

// 更新个人资料
router.put("/profile", updateProfile);

// 修改密码
router.put("/change-password", changePassword);

export default router;
