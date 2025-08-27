// favorites.js - 收藏功能路由
import express from "express";
import {
  addFavorite,
  removeFavorite,
  checkFavorite,
  getUserFavorites,
  updateFavoriteCategory,
  batchUpdateFavorites,
  batchDeleteFavorites,
  getFavoriteStats,
  addFavoriteTag,
  removeFavoriteTag,
} from "../controllers/favoriteController.js";
import { protect } from "../controllers/authController.js";

const router = express.Router();

// 保护所有收藏路由
router.use(protect);

// 收藏操作
router.post("/", addFavorite);
router.delete("/:itemType/:itemId", removeFavorite);
router.get("/check/:itemType/:itemId", checkFavorite);

// 获取收藏列表和统计
router.get("/", getUserFavorites);
router.get("/stats", getFavoriteStats);

// 收藏管理
router.patch("/:id/category", updateFavoriteCategory);
router.patch("/batch/category", batchUpdateFavorites);
router.delete("/batch", batchDeleteFavorites);

// 标签管理
router.post("/:id/tags", addFavoriteTag);
router.delete("/:id/tags", removeFavoriteTag);

export default router;
