// ActivityLog.js - 操作日志模型
import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "create",
        "update",
        "delete",
        "publish",
        "unpublish",
        "login",
        "logout",
        "failed_login",
        "password_change",
        "settings_update",
        "settings_delete",
        "settings_reset",
        "export",
        "import",
        "archive",
        "restore",
      ],
    },
    entityType: {
      type: String,
      required: true,
      enum: [
        "news",
        "resource",
        "activity",
        "user",
        "setting",
        "system",
        "category",
      ],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    entityName: {
      type: String,
      required: true,
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// 创建索引以提高查询性能
activityLogSchema.index({ user: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });
activityLogSchema.index({ createdAt: -1 });

// 静态方法：记录活动
activityLogSchema.statics.logActivity = async function (data) {
  return await this.create(data);
};

// 静态方法：获取用户最近活动
activityLogSchema.statics.getUserActivity = async function (
  userId,
  limit = 10,
) {
  return await this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("user", "username avatar")
    .lean();
};

// 静态方法：获取实体活动历史
activityLogSchema.statics.getEntityHistory = async function (
  entityType,
  entityId,
) {
  return await this.find({ entityType, entityId })
    .sort({ createdAt: -1 })
    .populate("user", "username avatar")
    .lean();
};

// 静态方法：获取最近的系统活动
activityLogSchema.statics.getRecentActivity = async function (limit = 50) {
  return await this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("user", "username avatar")
    .lean();
};

// 中间件：更新updatedAt字段
activityLogSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;
