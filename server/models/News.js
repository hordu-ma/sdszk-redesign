import mongoose from "mongoose";

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
      type: String,
      required: true,
      enum: ["center", "notice", "policy"],
      default: "center",
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    isPublished: {
      type: Boolean,
      default: false,
    },
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
);

// 创建全文搜索索引
newsSchema.index(
  {
    title: "text",
    content: "text",
    summary: "text",
    tags: "text",
  },
  {
    weights: {
      title: 10,
      tags: 5,
      summary: 3,
      content: 1,
    },
    name: "news_text_index",
  }
);

// 创建静态方法：热门新闻
newsSchema.statics.getPopularNews = async function (limit = 5) {
  return this.find({ isPublished: true })
    .sort({ viewCount: -1, publishDate: -1 })
    .limit(limit);
};

// 创建静态方法：按类别获取最新新闻
newsSchema.statics.getLatestByCategory = async function (category, limit = 5) {
  return this.find({
    category,
    isPublished: true,
    publishDate: { $lte: new Date() },
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: null },
      { expiryDate: { $gt: new Date() } },
    ],
  })
    .sort({ publishDate: -1 })
    .limit(limit);
};

// 创建虚拟属性：是否已过期
newsSchema.virtual("isExpired").get(function () {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// 创建中间件：更新时自动设置updatedBy字段
newsSchema.pre("findOneAndUpdate", function (next) {
  if (this._update && this._update.$set && this._update.$set.updatedBy) {
    this._update.updatedBy = this._update.$set.updatedBy;
  }
  next();
});

const News = mongoose.model("News", newsSchema);

export default News;
