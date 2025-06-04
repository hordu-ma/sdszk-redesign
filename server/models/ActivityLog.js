// ActivityLog.js - 操作日志模型
import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create',
      'update',
      'delete',
      'publish',
      'unpublish',
      'login',
      'logout',
      'failed_login',
      'password_change',
      'settings_update',
      'export',
      'import',
    ],
  },
  entityType: {
    type: String,
    required: true,
    enum: ['news', 'resource', 'activity', 'user', 'setting', 'system'],
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  ip: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

// 创建索引以提高查询性能
activityLogSchema.index({ userId: 1 })
activityLogSchema.index({ action: 1 })
activityLogSchema.index({ entityType: 1, entityId: 1 })
activityLogSchema.index({ timestamp: -1 })

// 静态方法：记录活动
activityLogSchema.statics.logActivity = async function (data) {
  return await this.create(data)
}

// 静态方法：获取用户最近活动
activityLogSchema.statics.getUserActivity = async function (userId, limit = 10) {
  return await this.find({ userId }).sort({ timestamp: -1 }).limit(limit).lean()
}

// 静态方法：获取实体活动历史
activityLogSchema.statics.getEntityHistory = async function (entityType, entityId) {
  return await this.find({ entityType, entityId })
    .sort({ timestamp: -1 })
    .populate('userId', 'username name')
    .lean()
}

// 静态方法：获取最近的系统活动
activityLogSchema.statics.getRecentActivity = async function (limit = 50) {
  return await this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'username name')
    .lean()
}

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema)

export default ActivityLog
