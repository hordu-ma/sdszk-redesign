// users.js - 用户路由
import express from "express";
import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  updatePassword,
  getMe,
} from "../controllers/userController.js";
import { protect, restrictTo } from "../controllers/authController.js";

const router = express.Router();

// 保护所有用户路由
router.use(protect);

// 当前用户路由
router.get("/me", getMe);
router.patch("/update-password", updatePassword);

// 限制以下路由只允许管理员访问
router.use(restrictTo("admin"));

router.route("/").get(getAllUsers);

router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

export default router;
