// dashboard.js - 仪表盘路由
import express from 'express'
import {
  getOverviewStats,
  getRecentActivities,
  getVisitTrends,
} from '../controllers/dashboardController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 获取仪表盘总览数据
router.get('/overview', authenticateToken, getOverviewStats)

// 获取访问量趋势
router.get('/visit-trends', authenticateToken, getVisitTrends)

// 获取最新动态
router.get('/activities', authenticateToken, getRecentActivities)

// 获取仪表盘统计数据（兼容前端 /stats 路径）
router.get('/stats', authenticateToken, getOverviewStats)

export default router
