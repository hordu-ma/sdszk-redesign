// Permission.js - 权限模型
import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "权限名称是必填项"],
      unique: true,
      trim: true,
      maxlength: [100, "权限名称不能超过100个字符"],
      match: [
        /^[a-z]+:[a-z]+$/,
        "权限格式必须为 'module:action'，如 'users:read'",
      ],
    },
    displayName: {
      type: String,
      required: [true, "显示名称是必填项"],
      trim: true,
      maxlength: [200, "显示名称不能超过200个字符"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "描述不能超过500个字符"],
    },
    module: {
      type: String,
      required: [true, "模块名称是必填项"],
      trim: true,
      maxlength: [50, "模块名称不能超过50个字符"],
      match: [/^[a-z]+$/, "模块名称只能包含小写字母"],
    },
    action: {
      type: String,
      required: [true, "操作名称是必填项"],
      trim: true,
      maxlength: [50, "操作名称不能超过50个字符"],
      match: [/^[a-z]+$/, "操作名称只能包含小写字母"],
    },
    resource: {
      type: String,
      trim: true,
      maxlength: [100, "资源名称不能超过100个字符"],
      default: "",
    },
    isSystem: {
      type: Boolean,
      default: false, // 系统权限不能删除
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    category: {
      type: String,
      enum: ["read", "write", "manage", "admin"],
      default: "read",
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
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

// 虚拟属性：使用此权限的角色数量
permissionSchema.virtual("roleCount", {
  ref: "Role",
  localField: "name",
  foreignField: "permissions",
  count: true,
});

// 虚拟属性：使用此权限的用户数量
permissionSchema.virtual("userCount", {
  ref: "User",
  localField: "name",
  foreignField: "permissions",
  count: true,
});

// 索引
permissionSchema.index({ name: 1 }, { unique: true });
permissionSchema.index({ module: 1, action: 1 });
permissionSchema.index({ status: 1, deletedAt: 1 });
permissionSchema.index({ category: 1 });
permissionSchema.index({ priority: -1 });

// 静态方法：获取系统预定义权限
permissionSchema.statics.getSystemPermissions = () => [
  // 新闻权限
  {
    name: "news:read",
    displayName: "查看新闻",
    description: "允许查看新闻内容",
    module: "news",
    action: "read",
    resource: "news",
    category: "read",
    priority: 1,
    isSystem: true,
  },
  {
    name: "news:create",
    displayName: "创建新闻",
    description: "允许创建新闻",
    module: "news",
    action: "create",
    resource: "news",
    category: "write",
    priority: 2,
    isSystem: true,
  },
  {
    name: "news:update",
    displayName: "编辑新闻",
    description: "允许编辑新闻",
    module: "news",
    action: "update",
    resource: "news",
    category: "write",
    priority: 3,
    isSystem: true,
  },
  {
    name: "news:delete",
    displayName: "删除新闻",
    description: "允许删除新闻",
    module: "news",
    action: "delete",
    resource: "news",
    category: "manage",
    priority: 4,
    isSystem: true,
  },
  {
    name: "news:publish",
    displayName: "发布新闻",
    description: "允许发布/撤回新闻",
    module: "news",
    action: "publish",
    resource: "news",
    category: "manage",
    priority: 5,
    isSystem: true,
  },
  {
    name: "news:manage",
    displayName: "管理新闻",
    description: "允许全面管理新闻模块",
    module: "news",
    action: "manage",
    resource: "news",
    category: "admin",
    priority: 10,
    isSystem: true,
  },

  // 资源权限
  {
    name: "resources:read",
    displayName: "查看资源",
    description: "允许查看资源内容",
    module: "resources",
    action: "read",
    resource: "resources",
    category: "read",
    priority: 1,
    isSystem: true,
  },
  {
    name: "resources:create",
    displayName: "创建资源",
    description: "允许创建资源",
    module: "resources",
    action: "create",
    resource: "resources",
    category: "write",
    priority: 2,
    isSystem: true,
  },
  {
    name: "resources:update",
    displayName: "编辑资源",
    description: "允许编辑资源",
    module: "resources",
    action: "update",
    resource: "resources",
    category: "write",
    priority: 3,
    isSystem: true,
  },
  {
    name: "resources:delete",
    displayName: "删除资源",
    description: "允许删除资源",
    module: "resources",
    action: "delete",
    resource: "resources",
    category: "manage",
    priority: 4,
    isSystem: true,
  },
  {
    name: "resources:publish",
    displayName: "发布资源",
    description: "允许发布/撤回资源",
    module: "resources",
    action: "publish",
    resource: "resources",
    category: "manage",
    priority: 5,
    isSystem: true,
  },
  {
    name: "resources:manage",
    displayName: "管理资源",
    description: "允许全面管理资源模块",
    module: "resources",
    action: "manage",
    resource: "resources",
    category: "admin",
    priority: 10,
    isSystem: true,
  },

  // 活动权限
  {
    name: "activities:read",
    displayName: "查看活动",
    description: "允许查看活动内容",
    module: "activities",
    action: "read",
    resource: "activities",
    category: "read",
    priority: 1,
    isSystem: true,
  },
  {
    name: "activities:create",
    displayName: "创建活动",
    description: "允许创建活动",
    module: "activities",
    action: "create",
    resource: "activities",
    category: "write",
    priority: 2,
    isSystem: true,
  },
  {
    name: "activities:update",
    displayName: "编辑活动",
    description: "允许编辑活动",
    module: "activities",
    action: "update",
    resource: "activities",
    category: "write",
    priority: 3,
    isSystem: true,
  },
  {
    name: "activities:delete",
    displayName: "删除活动",
    description: "允许删除活动",
    module: "activities",
    action: "delete",
    resource: "activities",
    category: "manage",
    priority: 4,
    isSystem: true,
  },
  {
    name: "activities:publish",
    displayName: "发布活动",
    description: "允许发布/撤回活动",
    module: "activities",
    action: "publish",
    resource: "activities",
    category: "manage",
    priority: 5,
    isSystem: true,
  },
  {
    name: "activities:manage",
    displayName: "管理活动",
    description: "允许全面管理活动模块",
    module: "activities",
    action: "manage",
    resource: "activities",
    category: "admin",
    priority: 10,
    isSystem: true,
  },

  // 用户权限
  {
    name: "users:read",
    displayName: "查看用户",
    description: "允许查看用户信息",
    module: "users",
    action: "read",
    resource: "users",
    category: "read",
    priority: 1,
    isSystem: true,
  },
  {
    name: "users:create",
    displayName: "创建用户",
    description: "允许创建新用户",
    module: "users",
    action: "create",
    resource: "users",
    category: "write",
    priority: 2,
    isSystem: true,
  },
  {
    name: "users:update",
    displayName: "编辑用户",
    description: "允许编辑用户信息",
    module: "users",
    action: "update",
    resource: "users",
    category: "write",
    priority: 3,
    isSystem: true,
  },
  {
    name: "users:delete",
    displayName: "删除用户",
    description: "允许删除用户",
    module: "users",
    action: "delete",
    resource: "users",
    category: "manage",
    priority: 4,
    isSystem: true,
  },
  {
    name: "users:manage",
    displayName: "管理用户",
    description: "允许全面管理用户模块",
    module: "users",
    action: "manage",
    resource: "users",
    category: "admin",
    priority: 10,
    isSystem: true,
  },

  // 设置权限
  {
    name: "settings:read",
    displayName: "查看设置",
    description: "允许查看系统设置",
    module: "settings",
    action: "read",
    resource: "settings",
    category: "read",
    priority: 1,
    isSystem: true,
  },
  {
    name: "settings:update",
    displayName: "修改设置",
    description: "允许修改系统设置",
    module: "settings",
    action: "update",
    resource: "settings",
    category: "manage",
    priority: 3,
    isSystem: true,
  },
  {
    name: "settings:manage",
    displayName: "管理设置",
    description: "允许全面管理系统设置",
    module: "settings",
    action: "manage",
    resource: "settings",
    category: "admin",
    priority: 10,
    isSystem: true,
  },

  // 上传权限
  {
    name: "uploads:create",
    displayName: "上传文件",
    description: "允许上传文件",
    module: "uploads",
    action: "create",
    resource: "uploads",
    category: "write",
    priority: 2,
    isSystem: true,
  },
  {
    name: "uploads:delete",
    displayName: "删除文件",
    description: "允许删除文件",
    module: "uploads",
    action: "delete",
    resource: "uploads",
    category: "manage",
    priority: 4,
    isSystem: true,
  },
  {
    name: "uploads:manage",
    displayName: "管理文件",
    description: "允许全面管理文件上传",
    module: "uploads",
    action: "manage",
    resource: "uploads",
    category: "admin",
    priority: 10,
    isSystem: true,
  },
];

// 静态方法：初始化系统权限
permissionSchema.statics.initializeSystemPermissions = async function () {
  const systemPermissions = this.getSystemPermissions();

  for (const permissionData of systemPermissions) {
    await this.findOneAndUpdate({ name: permissionData.name }, permissionData, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }
};

// 静态方法：按模块获取权限
permissionSchema.statics.getPermissionsByModule = function (module) {
  return this.find({
    module,
    status: "active",
    deletedAt: null,
  }).sort({ priority: 1 });
};

// 静态方法：构建权限树
permissionSchema.statics.buildPermissionTree = async function () {
  const permissions = await this.find({
    status: "active",
    deletedAt: null,
  }).sort({ module: 1, priority: 1 });

  const tree = {};
  permissions.forEach((permission) => {
    if (!tree[permission.module]) {
      tree[permission.module] = {
        module: permission.module,
        displayName: getModuleDisplayName(permission.module),
        permissions: [],
      };
    }
    tree[permission.module].permissions.push({
      name: permission.name,
      displayName: permission.displayName,
      description: permission.description,
      action: permission.action,
      category: permission.category,
      priority: permission.priority,
    });
  });

  return Object.values(tree);
};

// 软删除中间件
permissionSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

// 查询中间件：默认排除已删除的记录
permissionSchema.pre(/^find/, function (next) {
  if (!this.getQuery().deletedAt) {
    this.where({ deletedAt: null });
  }
  next();
});

// pre-save 中间件：自动设置 name 字段
permissionSchema.pre("save", function (next) {
  if (this.isModified("module") || this.isModified("action")) {
    this.name = `${this.module}:${this.action}`;
  }

  // 验证系统权限不能被修改某些字段
  if (this.isSystem && this.isModified("name")) {
    const error = new Error("系统权限的名称不能被修改");
    return next(error);
  }

  next();
});

// pre-remove 中间件：防止删除系统权限
permissionSchema.pre("deleteOne", { document: true }, function (next) {
  if (this.isSystem) {
    const error = new Error("系统权限不能被删除");
    return next(error);
  }
  next();
});

// 辅助函数：获取模块显示名称
function getModuleDisplayName(module) {
  const moduleNames = {
    news: "新闻管理",
    resources: "资源管理",
    activities: "活动管理",
    users: "用户管理",
    settings: "系统设置",
    uploads: "文件管理",
  };
  return moduleNames[module] || module;
}

const Permission = mongoose.model("Permission", permissionSchema);

export default Permission;
