// Resource.js - 资源模型
import mongoose from 'mongoose'

const resourceSchema = new mongoose.Schema(
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
      ref: 'ResourceCategory',
      required: true,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    videoDuration: {
      type: Number, // 视频时长（秒）
      min: 0,
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    authorAffiliation: {
      type: String,
      trim: true,
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
    attachments: [
      {
        name: String,
        url: String,
        size: Number,
        type: String,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isTop: {
      type: Boolean,
      default: false,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    shares: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Share',
      },
    ],
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    fileSize: {
      type: Number,
      min: 0,
    },
    mimeType: {
      type: String,
    },
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
    relatedResources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource',
      },
    ],
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

// 创建全文搜索索引
resourceSchema.index(
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
    name: 'resource_text_index',
  }
)

const Resource = mongoose.model('Resource', resourceSchema)

export default Resource
