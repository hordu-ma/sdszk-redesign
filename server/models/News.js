import mongoose from 'mongoose'

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NewsCategory',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    isTop: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    source: {
      name: {
        type: String,
        trim: true,
      },
      url: {
        type: String,
        trim: true,
      },
    },
    importance: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    attachments: [
      {
        name: String,
        url: String,
        size: Number,
        type: String,
      },
    ],
    seo: {
      metaTitle: {
        type: String,
        maxlength: 70,
      },
      metaDescription: {
        type: String,
        maxlength: 160,
      },
      keywords: [String],
    },
  },
  {
    timestamps: true,
  }
)

// 创建全文搜索索引
newsSchema.index(
  {
    title: 'text',
    content: 'text',
    summary: 'text',
    tags: 'text',
  },
  {
    weights: {
      title: 10,
      tags: 5,
      summary: 3,
      content: 1,
    },
    name: 'news_text_index',
  }
)

// 创建静态方法：热门新闻
newsSchema.statics.getPopularNews = async function (limit = 5) {
  return this.find({ status: 'published' })
    .sort({ viewCount: -1, publishDate: -1 })
    .limit(limit)
    .populate('author', 'username')
    .populate('category', 'name')
}

// 创建静态方法：按类别获取最新新闻
newsSchema.statics.getLatestByCategory = async function (category, limit = 5) {
  return this.find({
    category,
    status: 'published',
    publishDate: { $lte: new Date() },
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: null },
      { expiryDate: { $gt: new Date() } },
    ],
  })
    .sort({ publishDate: -1 })
    .limit(limit)
    .populate('author', 'username')
    .populate('category', 'name')
}

// 创建静态方法：获取置顶新闻
newsSchema.statics.getTopNews = async function (limit = 5) {
  return this.find({
    status: 'published',
    isTop: true,
    publishDate: { $lte: new Date() },
  })
    .sort({ publishDate: -1 })
    .limit(limit)
    .populate('author', 'username')
    .populate('category', 'name')
}

// 创建静态方法：获取推荐新闻
newsSchema.statics.getFeaturedNews = async function (limit = 5) {
  return this.find({
    status: 'published',
    isFeatured: true,
    publishDate: { $lte: new Date() },
  })
    .sort({ publishDate: -1 })
    .limit(limit)
    .populate('author', 'username')
    .populate('category', 'name')
}

// 创建虚拟属性：是否已过期
newsSchema.virtual('isExpired').get(function () {
  if (!this.expiryDate) return false
  return new Date() > this.expiryDate
})

// 创建中间件：更新时自动设置updatedBy字段
newsSchema.pre('findOneAndUpdate', function (next) {
  if (this._update && this._update.$set && this._update.$set.updatedBy) {
    this._update.updatedBy = this._update.$set.updatedBy
  }
  next()
})

// 添加自动填充中间件
newsSchema.pre(['find', 'findOne'], function () {
  this.populate('category', 'name key color icon')
  this.populate('author', 'username')
})

// 在保存前，确保legacyCategory与category匹配
newsSchema.pre('save', async function (next) {
  if (this.isModified('category')) {
    const category = await mongoose.model('NewsCategory').findById(this.category)
    if (category && category.isCore) {
      this.legacyCategory = category.key
    }
  }
  next()
})

const News = mongoose.model('News', newsSchema)

export default News
