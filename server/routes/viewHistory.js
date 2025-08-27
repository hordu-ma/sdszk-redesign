// viewHistory.js - 浏览历史路由
import express from "express";
import {
  recordView,
  getUserHistory,
  clearUserHistory,
  getPopularItems,
  getRecommendations,
  getViewStats,
  deleteViewRecord,
  batchDeleteViewRecords,
} from "../controllers/viewHistoryController.js";
import { protect } from "../controllers/authController.js";

const router = express.Router();

// 保护所有浏览历史路由
router.use(protect);

// 记录浏览历史
router.post("/record", recordView);

// 获取浏览历史
router.get("/", getUserHistory);
router.get("/stats", getViewStats);

// 清理浏览历史
router.delete("/clear", clearUserHistory);
router.delete("/:id", deleteViewRecord);
router.delete("/batch", batchDeleteViewRecords);

// 推荐和热门内容
router.get("/popular", getPopularItems);
router.get("/recommendations", getRecommendations);

export default router;
