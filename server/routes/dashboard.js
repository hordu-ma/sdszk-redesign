// dashboard.js - 仪表盘路由
import express from 'express'
import { getOverviewStats, getRecentActivities } from '../controllers/dashboardController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 获取仪表盘总览数据
router.get('/overview', authenticateToken, getOverviewStats)

// 获取最近活动
router.get('/recent-activities', authenticateToken, getRecentActivities)

export default router
