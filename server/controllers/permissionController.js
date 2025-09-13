// permissionController.js - 权限管理控制器
import Permission from "../models/Permission.js";
import Role from "../models/Role.js";
import User from "../models/User.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../utils/appError.js";
import { logError, log } from "../utils/logger.js";

// 辅助函数：规范化权限输出
const normalizePermissionOutput = (permission) => {
  if (!permission) return null;
  const permissionObject = permission.toObject
    ? permission.toObject()
    : permission;

  // 移除敏感或内部字段
  const safePermission = { ...permissionObject };
  delete safePermission.__v;

  // 转换 _id 为 id
  const { _id, ...rest } = safePermission;

  return {
    id: _id.toString(),
    ...rest,
  };
};

// 获取所有权限
export const getAllPermissions = async (req, res, next) => {
  try {
    // 分页参数
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // 搜索和筛选条件
    const filter = { deletedAt: null };

    if (req.query.keyword) {
      const keyword = req.query.keyword.trim();
      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { displayName: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { module: { $regex: keyword, $options: "i" } },
      ];
    }

    if (req.query.module) {
      filter.module = req.query.module;
    }

    if (req.query.action) {
      filter.action = req.query.action;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.isSystem !== undefined) {
      filter.isSystem = req.query.isSystem === "true";
    }

    // 并行执行查询和计数
    const [permissions, total] = await Promise.all([
      Permission.find(filter)
        .sort({ module: 1, priority: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Permission.countDocuments(filter),
    ]);

    // 获取每个权限的使用统计
    const permissionsWithUsage = await Promise.all(
      permissions.map(async (permission) => {
        const [roleCount, userCount] = await Promise.all([
          Role.countDocuments({
            permissions: permission.name,
            deletedAt: null,
          }),
          User.countDocuments({
            permissions: permission.name,
            deletedAt: null,
          }),
        ]);

        return {
          ...normalizePermissionOutput(permission),
          roleCount,
          userCount,
          totalUsage: roleCount + userCount,
        };
      }),
    );

    res.status(200).json({
      data: permissionsWithUsage,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    logError(err, { context: "getAllPermissions" });
    next(err);
  }
};

// 获取单个权限
export const getPermission = async (req, res, next) => {
  try {
    const permission = await Permission.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!permission) {
      return next(new NotFoundError("未找到此权限"));
    }

    // 获取使用此权限的角色和用户
    const [roles, users] = await Promise.all([
      Role.find({
        permissions: permission.name,
        deletedAt: null,
      }).select("name displayName"),
      User.find({
        permissions: permission.name,
        deletedAt: null,
      }).select("username email"),
    ]);

    const permissionData = {
      ...normalizePermissionOutput(permission),
      usage: {
        roles: roles.map((role) => ({
          id: role._id.toString(),
          name: role.name,
          displayName: role.displayName,
        })),
        users: users.map((user) => ({
          id: user._id.toString(),
          username: user.username,
          email: user.email,
        })),
        roleCount: roles.length,
        userCount: users.length,
        totalUsage: roles.length + users.length,
      },
    };

    res.status(200).json({
      status: "success",
      data: permissionData,
    });
  } catch (err) {
    logError(err, { context: "getPermission", permissionId: req.params.id });
    next(err);
  }
};

// 创建权限
export const createPermission = async (req, res, next) => {
  try {
    const {
      name,
      displayName,
      description,
      module,
      action,
      resource,
      category,
      priority,
      status,
    } = req.body;

    if (!displayName || !module || !action) {
      return next(new BadRequestError("显示名称、模块名称和操作名称是必填项"));
    }

    // 自动生成权限名称
    const permissionName = name || `${module}:${action}`;

    // 检查权限名是否已存在
    const existingPermission = await Permission.findOne({
      name: permissionName,
      deletedAt: null,
    });
    if (existingPermission) {
      return next(new ConflictError("权限名称已存在"));
    }

    const permission = await Permission.create({
      name: permissionName,
      displayName,
      description,
      module,
      action,
      resource: resource || module,
      category: category || "read",
      priority: priority || 0,
      status: status || "active",
      createdBy: req.user?.id,
    });

    log.info("新权限已创建", {
      permissionId: permission._id,
      name: permission.name,
    });

    res.status(201).json({
      status: "success",
      data: {
        ...normalizePermissionOutput(permission),
        roleCount: 0,
        userCount: 0,
        totalUsage: 0,
      },
    });
  } catch (err) {
    logError(err, { context: "createPermission" });
    next(err);
  }
};

// 更新权限
export const updatePermission = async (req, res, next) => {
  try {
    const permission = await Permission.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!permission) {
      return next(new NotFoundError("未找到此权限"));
    }

    // 检查是否尝试修改系统权限的关键字段
    if (permission.isSystem) {
      const protectedFields = ["name", "module", "action"];
      const hasProtectedChanges = protectedFields.some(
        (field) => req.body[field] && req.body[field] !== permission[field],
      );

      if (hasProtectedChanges) {
        return next(new BadRequestError("系统权限的关键字段不能被修改"));
      }
    }

    // 如果修改了模块或操作，重新生成权限名
    if (req.body.module || req.body.action) {
      const newModule = req.body.module || permission.module;
      const newAction = req.body.action || permission.action;
      const newName = `${newModule}:${newAction}`;

      if (newName !== permission.name) {
        // 检查新名称是否冲突
        const existingPermission = await Permission.findOne({
          name: newName,
          _id: { $ne: permission._id },
          deletedAt: null,
        });
        if (existingPermission) {
          return next(new ConflictError("权限名称已存在"));
        }

        // 更新所有使用此权限的角色和用户
        await Promise.all([
          Role.updateMany(
            { permissions: permission.name },
            { $set: { "permissions.$": newName } },
          ),
          User.updateMany(
            { permissions: permission.name },
            { $set: { "permissions.$": newName } },
          ),
        ]);

        req.body.name = newName;
        log.info("权限名称已更新，关联数据已同步", {
          oldName: permission.name,
          newName,
        });
      }
    }

    // 更新权限
    Object.assign(permission, req.body);
    permission.updatedBy = req.user?.id;
    await permission.save();

    // 获取使用统计
    const [roleCount, userCount] = await Promise.all([
      Role.countDocuments({
        permissions: permission.name,
        deletedAt: null,
      }),
      User.countDocuments({
        permissions: permission.name,
        deletedAt: null,
      }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        ...normalizePermissionOutput(permission),
        roleCount,
        userCount,
        totalUsage: roleCount + userCount,
      },
    });
  } catch (err) {
    logError(err, { context: "updatePermission", permissionId: req.params.id });
    next(err);
  }
};

// 删除权限
export const deletePermission = async (req, res, next) => {
  try {
    const permission = await Permission.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!permission) {
      return next(new NotFoundError("未找到此权限"));
    }

    // 检查是否为系统权限
    if (permission.isSystem) {
      return next(new BadRequestError("系统权限不能被删除"));
    }

    // 检查是否有角色或用户在使用此权限
    const [roleCount, userCount] = await Promise.all([
      Role.countDocuments({
        permissions: permission.name,
        deletedAt: null,
      }),
      User.countDocuments({
        permissions: permission.name,
        deletedAt: null,
      }),
    ]);

    const totalUsage = roleCount + userCount;
    if (totalUsage > 0) {
      return next(
        new ConflictError(
          `无法删除权限，还有 ${roleCount} 个角色和 ${userCount} 个用户在使用此权限`,
        ),
      );
    }

    await permission.softDelete();

    log.info("权限已被删除", {
      permissionId: permission._id,
      name: permission.name,
    });

    res.status(200).json({ status: "success", data: true });
  } catch (err) {
    logError(err, { context: "deletePermission", permissionId: req.params.id });
    next(err);
  }
};

// 批量删除权限
export const batchDeletePermissions = async (req, res, next) => {
  try {
    const { permissionIds } = req.body;
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      return next(new BadRequestError("需要提供权限ID数组"));
    }

    const permissions = await Permission.find({
      _id: { $in: permissionIds },
      deletedAt: null,
    });

    if (permissions.length === 0) {
      return next(new NotFoundError("未找到任何匹配的权限"));
    }

    // 检查系统权限
    const systemPermissions = permissions.filter(
      (permission) => permission.isSystem,
    );
    if (systemPermissions.length > 0) {
      return next(
        new BadRequestError(
          `无法删除系统权限: ${systemPermissions.map((p) => p.displayName).join(", ")}`,
        ),
      );
    }

    // 检查是否有角色或用户使用这些权限
    const permissionNames = permissions.map((permission) => permission.name);
    const [roleCount, userCount] = await Promise.all([
      Role.countDocuments({
        permissions: { $in: permissionNames },
        deletedAt: null,
      }),
      User.countDocuments({
        permissions: { $in: permissionNames },
        deletedAt: null,
      }),
    ]);

    const totalUsage = roleCount + userCount;
    if (totalUsage > 0) {
      return next(
        new ConflictError(
          `无法删除权限，还有 ${roleCount} 个角色和 ${userCount} 个用户在使用这些权限`,
        ),
      );
    }

    // 软删除权限
    const result = await Permission.updateMany(
      { _id: { $in: permissionIds } },
      {
        $set: {
          deletedAt: new Date(),
          status: "inactive",
        },
      },
    );

    log.info(`${result.modifiedCount} 个权限已被批量删除`, { permissionIds });

    res.status(200).json({
      status: "success",
      data: { deletedCount: result.modifiedCount },
    });
  } catch (err) {
    logError(err, { context: "batchDeletePermissions" });
    next(err);
  }
};

// 获取权限树
export const getPermissionTree = async (req, res, next) => {
  try {
    const tree = await Permission.buildPermissionTree();

    res.status(200).json({
      status: "success",
      data: tree,
    });
  } catch (err) {
    logError(err, { context: "getPermissionTree" });
    next(err);
  }
};

// 按模块获取权限
export const getPermissionsByModule = async (req, res, next) => {
  try {
    const { module } = req.params;

    if (!module) {
      return next(new BadRequestError("模块名称是必填项"));
    }

    const permissions = await Permission.getPermissionsByModule(module);

    const permissionsWithUsage = await Promise.all(
      permissions.map(async (permission) => {
        const [roleCount, userCount] = await Promise.all([
          Role.countDocuments({
            permissions: permission.name,
            deletedAt: null,
          }),
          User.countDocuments({
            permissions: permission.name,
            deletedAt: null,
          }),
        ]);

        return {
          ...normalizePermissionOutput(permission),
          roleCount,
          userCount,
          totalUsage: roleCount + userCount,
        };
      }),
    );

    res.status(200).json({
      status: "success",
      data: permissionsWithUsage,
    });
  } catch (err) {
    logError(err, { context: "getPermissionsByModule", module });
    next(err);
  }
};

// 获取模块列表
export const getModules = async (req, res, next) => {
  try {
    const modules = await Permission.distinct("module", {
      deletedAt: null,
      status: "active",
    });

    const moduleStats = await Promise.all(
      modules.map(async (module) => {
        const permissionCount = await Permission.countDocuments({
          module,
          deletedAt: null,
          status: "active",
        });

        return {
          name: module,
          permissionCount,
        };
      }),
    );

    res.status(200).json({
      status: "success",
      data: moduleStats,
    });
  } catch (err) {
    logError(err, { context: "getModules" });
    next(err);
  }
};

// 初始化系统权限
export const initializeSystemPermissions = async (req, res, next) => {
  try {
    await Permission.initializeSystemPermissions();

    log.info("系统权限初始化完成");

    res.status(200).json({
      status: "success",
      message: "系统权限初始化完成",
    });
  } catch (err) {
    logError(err, { context: "initializeSystemPermissions" });
    next(err);
  }
};

// 获取权限统计信息
export const getPermissionStats = async (req, res, next) => {
  try {
    const [
      totalPermissions,
      systemPermissions,
      activePermissions,
      moduleStats,
      categoryStats,
      usageStats,
    ] = await Promise.all([
      Permission.countDocuments({ deletedAt: null }),
      Permission.countDocuments({ isSystem: true, deletedAt: null }),
      Permission.countDocuments({ status: "active", deletedAt: null }),
      Permission.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: "$module", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Permission.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Permission.aggregate([
        { $match: { deletedAt: null } },
        {
          $lookup: {
            from: "roles",
            localField: "name",
            foreignField: "permissions",
            as: "roles",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "name",
            foreignField: "permissions",
            as: "users",
          },
        },
        {
          $project: {
            name: 1,
            displayName: 1,
            roleCount: { $size: "$roles" },
            userCount: { $size: "$users" },
          },
        },
        {
          $addFields: {
            totalUsage: { $add: ["$roleCount", "$userCount"] },
          },
        },
        { $sort: { totalUsage: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        totalPermissions,
        systemPermissions,
        activePermissions,
        customPermissions: totalPermissions - systemPermissions,
        moduleStats,
        categoryStats,
        topUsedPermissions: usageStats,
      },
    });
  } catch (err) {
    logError(err, { context: "getPermissionStats" });
    next(err);
  }
};
