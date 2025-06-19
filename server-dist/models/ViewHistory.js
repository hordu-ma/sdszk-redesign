// ViewHistory.js - 浏览历史模型
import mongoose from 'mongoose'

const viewHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    itemType: {
      type: String,
      enum: ['news', 'resource'],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'itemType',
    },
    viewCount: {
      type: Number,
      default: 1,
    },
    duration: {
      type: Number, // 浏览时长（秒）
      default: 0,
    },
    source: {
      type: String, // 来源页面
      default: 'direct',
    },
    device: {
      type: String, // 设备类型
      enum: ['desktop', 'mobile', 'tablet'],
      default: 'desktop',
    },
    userAgent: String,
    ip: String,
    lastViewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// 创建复合索引
viewHistorySchema.index({ user: 1, itemType: 1, itemId: 1 }, { unique: true })
viewHistorySchema.index({ user: 1, lastViewedAt: -1 })
viewHistorySchema.index({ user: 1, itemType: 1, lastViewedAt: -1 })

// 静态方法：记录浏览历史
viewHistorySchema.statics.recordView = async function (userId, itemType, itemId, options = {}) {
  const { duration = 0, source = 'direct', device = 'desktop', userAgent, ip } = options

  try {
    // 尝试更新已存在的记录
    const updated = await this.findOneAndUpdate(
      { user: userId, itemType, itemId },
      {
        $inc: { viewCount: 1 },
        $set: {
          lastViewedAt: new Date(),
          duration: duration > 0 ? duration : undefined,
          source,
          device,
          userAgent,
          ip,
        },
      },
      { new: true, upsert: true }
    )

    return updated
  } catch (error) {
    console.error('记录浏览历史失败:', error)
    throw error
  }
}

// 静态方法：获取用户浏览历史
viewHistorySchema.statics.getUserHistory = async function (userId, options = {}) {
  const { itemType, page = 1, limit = 20, sort = '-lastViewedAt', dateRange } = options

  const query = { user: userId }
  if (itemType) query.itemType = itemType

  // 日期范围筛选
  if (dateRange && dateRange.start && dateRange.end) {
    query.lastViewedAt = {
      $gte: new Date(dateRange.start),
      $lte: new Date(dateRange.end),
    }
  }

  const history = await this.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({
      path: 'itemId',
      select: 'title description image status createdAt author',
    })
    .lean()

  const total = await this.countDocuments(query)

  return {
    history,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

// 静态方法：清理历史记录
viewHistorySchema.statics.clearUserHistory = async function (userId, options = {}) {
  const { itemType, olderThan } = options

  const query = { user: userId }
  if (itemType) query.itemType = itemType
  if (olderThan) query.lastViewedAt = { $lt: new Date(olderThan) }

  const result = await this.deleteMany(query)
  return result.deletedCount
}

// 静态方法：获取热门内容（基于浏览量）
viewHistorySchema.statics.getPopularItems = async function (options = {}) {
  const {
    itemType,
    timeRange = 7, // 默认最近7天
    limit = 10,
  } = options

  const matchStage = {
    lastViewedAt: {
      $gte: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000),
    },
  }

  if (itemType) matchStage.itemType = itemType

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: { itemType: '$itemType', itemId: '$itemId' },
        totalViews: { $sum: '$viewCount' },
        uniqueUsers: { $addToSet: '$user' },
        lastViewedAt: { $max: '$lastViewedAt' },
      },
    },
    {
      $addFields: {
        uniqueUserCount: { $size: '$uniqueUsers' },
      },
    },
    { $sort: { totalViews: -1, uniqueUserCount: -1 } },
    { $limit: limit },
  ]

  return await this.aggregate(pipeline)
}

// 静态方法：获取用户推荐内容
viewHistorySchema.statics.getRecommendations = async function (userId, options = {}) {
  const { limit = 10 } = options

  // 基于用户浏览历史的简单推荐算法
  const userHistory = await this.find({ user: userId }).sort('-lastViewedAt').limit(20).lean()

  // 提取用户浏览过的内容类型和分类
  const viewedItemTypes = [...new Set(userHistory.map(h => h.itemType))]

  // 这里可以实现更复杂的推荐算法
  // 暂时返回用户浏览过的相同类型的热门内容
  const recommendations = []

  for (const itemType of viewedItemTypes) {
    const popular = await this.getPopularItems({
      itemType,
      timeRange: 30,
      limit: Math.ceil(limit / viewedItemTypes.length),
    })
    recommendations.push(...popular)
  }

  return recommendations.slice(0, limit)
}

// 自动清理老旧历史记录（保留最近6个月）
viewHistorySchema.statics.cleanupOldRecords = async function () {
  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)

  const result = await this.deleteMany({
    lastViewedAt: { $lt: sixMonthsAgo },
  })

  console.log(`清理了 ${result.deletedCount} 条老旧浏览记录`)
  return result.deletedCount
}

// 验证被浏览的项目是否存在
viewHistorySchema.pre('save', async function (next) {
  if (this.isNew) {
    const Model = mongoose.model(this.itemType === 'news' ? 'News' : 'Resource')
    const item = await Model.findById(this.itemId)

    if (!item) {
      throw new Error('被浏览的项目不存在')
    }
  }
  next()
})

const ViewHistory = mongoose.model('ViewHistory', viewHistorySchema)

export default ViewHistory
