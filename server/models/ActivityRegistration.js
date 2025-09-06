// server/models/ActivityRegistration.js - 活动报名模型
import mongoose from "mongoose";

const activityRegistrationSchema = new mongoose.Schema(
  {
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
      required: [true, "必须关联一个活动"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "必须关联一个用户"],
    },
    // 1. 姓名
    name: {
      type: String,
      required: [true, "请输入报名姓名"],
      trim: true,
    },
    // 2. 性别
    gender: {
      type: String,
      enum: ["男", "女"],
    },
    // 3. 单位名称
    organization: {
      type: String,
      required: [true, "请输入单位名称"],
      trim: true,
    },
    // 4. 学校类别
    schoolType: {
      type: String,
      enum: ["大学", "高中", "初中", "小学"],
      required: [true, "请选择学校类别"],
    },
    // 5. 职务
    position: {
      type: String,
      trim: true,
    },
    // 6. 职称
    professionalTitle: {
      type: String,
      trim: true,
    },
    // 7. 学历
    educationLevel: {
      type: String,
      trim: true,
    },
    // 8. 联系电话
    phone: {
      type: String,
      required: [true, "请输入联系电话"],
      trim: true,
    },
    // 9. 邮箱
    email: {
      type: String,
      required: [true, "请输入联系邮箱"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "请输入有效的邮箱地址",
      ],
    },
    // 10. 上传文件 (可选)
    attachmentPath: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "备注信息不能超过500个字符"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true, // 自动添加 createdAt 和 updatedAt 字段
  },
);

// 添加索引以优化查询
activityRegistrationSchema.index({ activity: 1, user: 1 }, { unique: true }); // 同一用户对同一活动只能报名一次
activityRegistrationSchema.index({ status: 1 });

const ActivityRegistration = mongoose.model(
  "ActivityRegistration",
  activityRegistrationSchema,
);

export default ActivityRegistration;
