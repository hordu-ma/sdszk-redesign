import mongoose from "mongoose";

const newsCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: "#1890ff",
    },
    icon: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isCore: {
      type: Boolean,
      default: false,
      description: "是否为核心分类（中心动态、通知公告、政策文件）",
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
  },
  {
    timestamps: true,
  },
);

// 创建索引
newsCategorySchema.index({ order: 1 });

// 添加静态方法：获取核心分类
newsCategorySchema.statics.getCoreCategories = function () {
  return this.find({ isCore: true }).sort({ order: 1 });
};

// 添加验证：核心分类不能被删除
newsCategorySchema.pre(
  "deleteOne",
  { document: true, query: false },
  function (next) {
    if (this.isCore) {
      next(new Error("核心分类不能被删除"));
    }
    next();
  },
);

// 添加验证：核心分类的 key 不能被修改
newsCategorySchema.pre("save", function (next) {
  if (this.isCore && this.isModified("key")) {
    next(new Error("核心分类的标识符不能被修改"));
  }
  next();
});

const NewsCategory = mongoose.model("NewsCategory", newsCategorySchema);

export default NewsCategory;
