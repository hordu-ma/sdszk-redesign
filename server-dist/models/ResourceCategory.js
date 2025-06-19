// ResourceCategory.js - 资源分类模型
import mongoose from 'mongoose'

const resourceCategorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
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
  },
  {
    timestamps: true,
  }
)

// 创建索引
resourceCategorySchema.index({ order: 1 })

// 添加虚拟字段：资源数量
resourceCategorySchema.virtual('resourceCount', {
  ref: 'Resource',
  localField: '_id',
  foreignField: 'category',
  count: true,
})

const ResourceCategory = mongoose.model('ResourceCategory', resourceCategorySchema)

export default ResourceCategory
