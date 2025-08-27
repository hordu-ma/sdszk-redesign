// Share.js - 分享模型
import mongoose from "mongoose";

const shareSchema = new mongoose.Schema(
  {
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: true,
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shareType: {
      type: String,
      enum: ["email", "link", "wechat"],
      required: true,
    },
    recipientEmail: {
      type: String,
      trim: true,
      validate: {
        validator: function (email) {
          return email
            ? /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)
            : true;
        },
        message: "请提供有效的电子邮件地址",
      },
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    shareDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    accessCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Share = mongoose.model("Share", shareSchema);

export default Share;
