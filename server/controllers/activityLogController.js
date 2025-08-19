// activityLogController.js - 活动日志控制器
import ActivityLog from '../models/ActivityLog.js'
import { AppError, BadRequestError, NotFoundError } from '../utils/appError.js'

// 获取活动日志列表
export const getActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type } = req.query
    const query = type ? { type } : {}

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user', 'username')
      .lean()

    const total = await ActivityLog.countDocuments(query)

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    })
  } catch (error) {
    console.error('获取活动日志失败:', error)
    next(error)
  }
}

// 创建活动日志
export const createActivityLog = async (userId, action, type, details = {}) => {
  try {
    const log = new ActivityLog({
      user: userId,
      action,
      type,
      details,
    })
    await log.save()
    return log
  } catch (error) {
    console.error('创建活动日志失败:', error)
    return null
  }
}
