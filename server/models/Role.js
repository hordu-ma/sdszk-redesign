// Role.js - 角色模型
import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "角色名称是必填项"],
      unique: true,
      trim: true,
      maxlength: [50, "角色名称不能超过50个字符"],
      match: [
        /^[a-zA-Z_][a-zA-Z0-9_]*$/,
        "角色名称只能包含字母、数字和下划线，且必须以字母或下划线开头",
      ],
    },
    displayName: {
      type: String,
      required: [true, "显示名称是必填项"],
      trim: true,
      maxlength: [100, "显示名称不能超过100个字符"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "描述不能超过500个字符"],
    },
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: function (permissions) {
          // 验证权限格式：module:action
          return permissions.every((permission) =>
            /^[a-z]+:[a-z]+$/.test(permission),
          );
        },
        message: "权限格式必须为 'module:action'，如 'users:read'",
      },
    },
    isSystem: {
      type: Boolean,
      default: false, // 系统角色不能删除
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// 虚拟属性：用户数量
roleSchema.virtual("userCount", {
  ref: "User",
  localField: "name",
  foreignField: "role",
  count: true,
});

// 索引
roleSchema.index({ name: 1 }, { unique: true });
roleSchema.index({ status: 1, deletedAt: 1 });
roleSchema.index({ createdAt: -1 });

// 静态方法：获取系统预定义角色
roleSchema.statics.getSystemRoles = function () {
  return [
    {
      name: "admin",
      displayName: "系统管理员",
      description: "拥有系统全部权限的管理员",
      permissions: [
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
      ],
      isSystem: true,
      status: "active",
    },
    {
      name: "editor",
      displayName: "内容编辑",
      description: "负责内容创建和编辑的用户",
      permissions: [
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
      ],
      isSystem: true,
      status: "active",
    },
    {
      name: "co_admin",
      displayName: "共同管理员",
      description: "拥有内容管理权限，无用户和系统管理权限",
      permissions: [
        "news:create",
        "news:read",
        "news:update",
        "news:delete",
        "news:publish",
        "resources:create",
        "resources:read",
        "resources:update",
        "resources:delete",
        "resources:publish",
        "activities:create",
        "activities:read",
        "activities:update",
        "activities:delete",
        "activities:publish",
        "users:read",
        "uploads:create",
      ],
      isSystem: true,
      status: "active",
    },
    {
      name: "user",
      displayName: "普通用户",
      description: "系统的普通用户",
      permissions: ["news:read", "resources:read", "activities:read"],
      isSystem: true,
      status: "active",
    },
  ];
};

// 静态方法：初始化系统角色
roleSchema.statics.initializeSystemRoles = async function () {
  const systemRoles = this.getSystemRoles();

  for (const roleData of systemRoles) {
    await this.findOneAndUpdate({ name: roleData.name }, roleData, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }
};

// 实例方法：检查是否有特定权限
roleSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

// 实例方法：添加权限
roleSchema.methods.addPermission = function (permission) {
  if (!this.hasPermission(permission)) {
    this.permissions.push(permission);
  }
  return this;
};

// 实例方法：移除权限
roleSchema.methods.removePermission = function (permission) {
  this.permissions = this.permissions.filter((p) => p !== permission);
  return this;
};

// 软删除中间件
roleSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

// 查询中间件：默认排除已删除的记录
roleSchema.pre(/^find/, function (next) {
  if (!this.getQuery().deletedAt) {
    this.where({ deletedAt: null });
  }
  next();
});

// pre-save 中间件：验证系统角色不能被修改某些字段
roleSchema.pre("save", function (next) {
  if (this.isSystem && this.isModified("name")) {
    const error = new Error("系统角色的名称不能被修改");
    return next(error);
  }

  // 去重权限
  if (this.isModified("permissions")) {
    this.permissions = [...new Set(this.permissions)];
  }

  next();
});

// pre-remove 中间件：防止删除系统角色
roleSchema.pre("deleteOne", { document: true }, function (next) {
  if (this.isSystem) {
    const error = new Error("系统角色不能被删除");
    return next(error);
  }
  next();
});

const Role = mongoose.model("Role", roleSchema);

export default Role;
