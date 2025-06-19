// Favorite.js - 收藏模型
import mongoose from 'mongoose'

const favoriteSchema = new mongoose.Schema(
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
    category: {
      type: String,
      default: 'default',
    },
    tags: [String],
    notes: {
      type: String,
      maxlength: 500,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// 创建复合索引确保用户不能重复收藏同一项目
favoriteSchema.index({ user: 1, itemType: 1, itemId: 1 }, { unique: true })

// 创建其他索引以提高查询性能
favoriteSchema.index({ user: 1, category: 1 })
favoriteSchema.index({ user: 1, itemType: 1 })
favoriteSchema.index({ createdAt: -1 })

// 静态方法：添加收藏
favoriteSchema.statics.addFavorite = async function (userId, itemType, itemId, options = {}) {
  const favorite = new this({
    user: userId,
    itemType,
    itemId,
    ...options,
  })

  try {
    await favorite.save()
    return favorite
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('已经收藏过该项目')
    }
    throw error
  }
}

// 静态方法：移除收藏
favoriteSchema.statics.removeFavorite = async function (userId, itemType, itemId) {
  const result = await this.deleteOne({
    user: userId,
    itemType,
    itemId,
  })

  return result.deletedCount > 0
}

// 静态方法：检查是否已收藏
favoriteSchema.statics.isFavorited = async function (userId, itemType, itemId) {
  const count = await this.countDocuments({
    user: userId,
    itemType,
    itemId,
  })

  return count > 0
}

// 静态方法：获取用户收藏列表
favoriteSchema.statics.getUserFavorites = async function (userId, options = {}) {
  const { itemType, category, page = 1, limit = 20, sort = '-createdAt' } = options

  const query = { user: userId }
  if (itemType) query.itemType = itemType
  if (category && category !== 'all') query.category = category

  const favorites = await this.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({
      path: 'itemId',
      select: 'title description image status createdAt',
    })
    .lean()

  const total = await this.countDocuments(query)

  return {
    favorites,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

// 实例方法：更新收藏分类
favoriteSchema.methods.updateCategory = async function (newCategory) {
  this.category = newCategory
  await this.save()
  return this
}

// 实例方法：添加标签
favoriteSchema.methods.addTag = async function (tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag)
    await this.save()
  }
  return this
}

// 实例方法：移除标签
favoriteSchema.methods.removeTag = async function (tag) {
  this.tags = this.tags.filter(t => t !== tag)
  await this.save()
  return this
}

// 在删除关联项目时自动删除收藏
favoriteSchema.pre('save', async function (next) {
  if (this.isNew) {
    // 验证被收藏的项目是否存在
    const Model = mongoose.model(this.itemType === 'news' ? 'News' : 'Resource')
    const item = await Model.findById(this.itemId)

    if (!item) {
      throw new Error('被收藏的项目不存在')
    }
  }
  next()
})

const Favorite = mongoose.model('Favorite', favoriteSchema)

export default Favorite
