// User.js - 用户模型
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "请输入用户名"],
      unique: true,
      trim: true,
      minlength: [3, "用户名至少需要3个字符"],
      maxlength: [20, "用户名不能超过20个字符"],
    },
    password: {
      type: String,
      required: [true, "请输入密码"],
      minlength: [6, "密码至少需要6个字符"],
      select: false, // 查询时默认不返回密码
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "请输入有效的邮箱地址",
      ],
    },
    role: {
      type: String,
      enum: ["admin", "editor", "user"], // 'viewer' -> 'user'
      default: "editor",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "banned"],
      default: "active",
      index: true,
    },
    avatar: String,
    active: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    permissions: {
      type: [String],
      default: ["news:read", "resources:read", "activities:read"],
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    loginHistory: {
      type: [
        {
          loginTime: { type: Date, default: Date.now },
          ip: String,
          userAgent: String,
          success: { type: Boolean, default: true },
        },
      ],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.length <= 10;
        },
        message: "登录历史记录不能超过10条",
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    deletedAt: { type: Date, index: true }, // Ensure deletedAt is indexed
  },
  {
    timestamps: true,
  },
);

// 添加索引，优化查询
userSchema.index({ email: 1 }, { unique: true, sparse: true }); // 稀疏索引，忽略null值
userSchema.index({ role: 1, active: 1 }); // 优化用户管理查询
userSchema.index({ "loginHistory.loginTime": -1 }); // 优化登录历史查询性能

// 在保存之前对密码进行加密
userSchema.pre("save", async function (next) {
  // 如果密码没有被修改，则不需要重新加密
  if (!this.isModified("password")) return next();

  try {
    // 使用bcrypt加密密码
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// 添加比较密码的实例方法
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 添加 correctPassword 方法作为 comparePassword 的别名
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  // 注意：userPassword 是已加密的密码，不需要再加密
  return await bcrypt.compare(candidatePassword, userPassword);
};

// 添加密码重置令牌方法
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // 密码重置令牌有效期为10分钟
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// 判断密码是否在特定时间后更改
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// 添加记录登录历史的方法
userSchema.methods.recordLogin = async function (success, ip, userAgent) {
  const loginRecord = {
    loginTime: new Date(),
    ip,
    userAgent,
    success,
  };

  // 使用 MongoDB 的 $push 和 $slice 操作符确保数组长度不超过10
  try {
    await this.constructor.updateOne(
      { _id: this._id },
      {
        $push: {
          loginHistory: {
            $each: [loginRecord],
            $slice: -10, // 保持最新的10条记录
          },
        },
        ...(success && { lastLogin: new Date() }),
      },
    );

    // 更新当前实例的数据
    if (!this.loginHistory) this.loginHistory = [];
    this.loginHistory.push(loginRecord);
    if (this.loginHistory.length > 10) {
      this.loginHistory = this.loginHistory.slice(-10);
    }
    if (success) {
      this.lastLogin = new Date();
    }
  } catch (error) {
    console.error("记录登录历史失败:", error);
    // 如果数据库操作失败，回退到原有逻辑
    if (this.loginHistory && this.loginHistory.length >= 10) {
      this.loginHistory.shift();
    }
    if (!this.loginHistory) this.loginHistory = [];
    this.loginHistory.push(loginRecord);
    if (success) {
      this.lastLogin = new Date();
    }
    await this.save({ validateBeforeSave: false });
  }
};

// 在角色修改时自动设置权限
userSchema.pre("save", function (next) {
  if (this.isModified("role")) {
    // 根据角色分配默认权限
    if (this.role === "admin") {
      this.permissions = [
        "news:manage",
        "news:create",
        "news:read",
        "news:update",
        "news:delete",
        "news:publish",
        "resources:manage",
        "resources:create",
        "resources:read",
        "resources:update",
        "resources:delete",
        "resources:publish",
        "activities:manage",
        "activities:create",
        "activities:read",
        "activities:update",
        "activities:delete",
        "activities:publish",
        "users:manage",
        "users:create",
        "users:read",
        "users:update",
        "users:delete",
        "settings:manage",
        "settings:read",
        "settings:update",
        "uploads:manage",
        "uploads:create",
        "uploads:delete",
      ];
    } else if (this.role === "editor") {
      this.permissions = [
        "news:create",
        "news:read",
        "news:update",
        "resources:create",
        "resources:read",
        "resources:update",
        "activities:create",
        "activities:read",
        "activities:update",
        "users:read",
        "uploads:create",
      ];
    } else {
      // 默认用户权限
      this.permissions = ["news:read", "resources:read", "activities:read"];
    }
  }

  // 同步 active 和 status 状态
  if (this.isModified("status")) {
    this.active = this.status === "active";
  } else if (this.isModified("active")) {
    this.status = this.active ? "active" : "inactive";
  }

  next();
});

// 检查用户是否有特定权限
userSchema.methods.hasPermission = function (permission) {
  if (!this.permissions || !Array.isArray(this.permissions)) return false;
  return this.permissions.includes(permission);
};

// 创建虚拟属性：全名
userSchema.virtual("fullName").get(function () {
  return this.name || this.username;
});

const User = mongoose.model("User", userSchema);

export default User;
