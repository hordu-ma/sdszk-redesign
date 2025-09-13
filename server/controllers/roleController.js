// roleController.js - 角色管理控制器
import Role from "../models/Role.js";
import User from "../models/User.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../utils/appError.js";
import { logError, log } from "../utils/logger.js";

// 辅助函数：规范化角色输出
const normalizeRoleOutput = (role) => {
  if (!role) return null;
  const roleObject = role.toObject ? role.toObject() : role;

  // 移除敏感或内部字段
  const safeRole = { ...roleObject };
  delete safeRole.__v;

  // 转换 _id 为 id
  const { _id, ...rest } = safeRole;

  return {
    id: _id.toString(),
    ...rest,
  };
};

// 获取所有角色
export const getAllRoles = async (req, res, next) => {
  try {
    // 分页参数
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // 搜索和筛选条件
    const filter = { deletedAt: null };

    if (req.query.keyword) {
      const keyword = req.query.keyword.trim();
      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { displayName: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.isSystem !== undefined) {
      filter.isSystem = req.query.isSystem === "true";
    }

    // 并行执行查询和计数
    const [roles, total] = await Promise.all([
      Role.find(filter)
        .populate("userCount")
        .sort({ isSystem: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Role.countDocuments(filter),
    ]);

    // 获取每个角色的用户数量
    const rolesWithUserCount = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.countDocuments({
          role: role.name,
          deletedAt: null,
        });
        return {
          ...normalizeRoleOutput(role),
          userCount,
        };
      }),
    );

    res.status(200).json({
      data: rolesWithUserCount,
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
    logError(err, { context: "getAllRoles" });
    next(err);
  }
};

// 获取单个角色
export const getRole = async (req, res, next) => {
  try {
    const role = await Role.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!role) {
      return next(new NotFoundError("未找到此角色"));
    }

    // 获取使用此角色的用户数量
    const userCount = await User.countDocuments({
      role: role.name,
      deletedAt: null,
    });

    const roleData = {
      ...normalizeRoleOutput(role),
      userCount,
    };

    res.status(200).json({
      status: "success",
      data: roleData,
    });
  } catch (err) {
    logError(err, { context: "getRole", roleId: req.params.id });
    next(err);
  }
};

// 创建角色
export const createRole = async (req, res, next) => {
  try {
    const { name, displayName, description, permissions, status } = req.body;

    if (!name || !displayName) {
      return next(new BadRequestError("角色名称和显示名称是必填项"));
    }

    // 检查角色名是否已存在
    const existingRole = await Role.findOne({ name, deletedAt: null });
    if (existingRole) {
      return next(new ConflictError("角色名称已存在"));
    }

    const role = await Role.create({
      name,
      displayName,
      description,
      permissions: permissions || [],
      status: status || "active",
      createdBy: req.user?.id,
    });

    log.info("新角色已创建", { roleId: role._id, name: role.name });

    res.status(201).json({
      status: "success",
      data: {
        ...normalizeRoleOutput(role),
        userCount: 0,
      },
    });
  } catch (err) {
    logError(err, { context: "createRole" });
    next(err);
  }
};

// 更新角色
export const updateRole = async (req, res, next) => {
  try {
    const role = await Role.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!role) {
      return next(new NotFoundError("未找到此角色"));
    }

    // 检查是否尝试修改系统角色的关键字段
    if (role.isSystem && req.body.name && req.body.name !== role.name) {
      return next(new BadRequestError("系统角色的名称不能被修改"));
    }

    // 如果修改了角色名，检查新名称是否冲突
    if (req.body.name && req.body.name !== role.name) {
      const existingRole = await Role.findOne({
        name: req.body.name,
        _id: { $ne: role._id },
        deletedAt: null,
      });
      if (existingRole) {
        return next(new ConflictError("角色名称已存在"));
      }
    }

    // 更新角色
    Object.assign(role, req.body);
    role.updatedBy = req.user?.id;
    await role.save();

    // 如果角色名称发生变化，需要更新使用此角色的用户
    if (req.body.name && req.body.name !== role.name) {
      await User.updateMany({ role: role.name }, { role: req.body.name });
      log.info("角色关联用户已更新", {
        oldRoleName: role.name,
        newRoleName: req.body.name,
      });
    }

    // 获取用户数量
    const userCount = await User.countDocuments({
      role: role.name,
      deletedAt: null,
    });

    res.status(200).json({
      status: "success",
      data: {
        ...normalizeRoleOutput(role),
        userCount,
      },
    });
  } catch (err) {
    logError(err, { context: "updateRole", roleId: req.params.id });
    next(err);
  }
};

// 删除角色
export const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!role) {
      return next(new NotFoundError("未找到此角色"));
    }

    // 检查是否为系统角色
    if (role.isSystem) {
      return next(new BadRequestError("系统角色不能被删除"));
    }

    // 检查是否有用户在使用此角色
    const userCount = await User.countDocuments({
      role: role.name,
      deletedAt: null,
    });

    if (userCount > 0) {
      return next(
        new ConflictError(`无法删除角色，还有 ${userCount} 个用户在使用此角色`),
      );
    }

    await role.softDelete();

    log.info("角色已被删除", { roleId: role._id, name: role.name });

    res.status(200).json({ status: "success", data: true });
  } catch (err) {
    logError(err, { context: "deleteRole", roleId: req.params.id });
    next(err);
  }
};

// 批量删除角色
export const batchDeleteRoles = async (req, res, next) => {
  try {
    const { roleIds } = req.body;
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return next(new BadRequestError("需要提供角色ID数组"));
    }

    const roles = await Role.find({
      _id: { $in: roleIds },
      deletedAt: null,
    });

    if (roles.length === 0) {
      return next(new NotFoundError("未找到任何匹配的角色"));
    }

    // 检查系统角色
    const systemRoles = roles.filter((role) => role.isSystem);
    if (systemRoles.length > 0) {
      return next(
        new BadRequestError(
          `无法删除系统角色: ${systemRoles.map((r) => r.displayName).join(", ")}`,
        ),
      );
    }

    // 检查是否有用户使用这些角色
    const roleNames = roles.map((role) => role.name);
    const userCount = await User.countDocuments({
      role: { $in: roleNames },
      deletedAt: null,
    });

    if (userCount > 0) {
      return next(
        new ConflictError(
          `无法删除角色，还有 ${userCount} 个用户在使用这些角色`,
        ),
      );
    }

    // 软删除角色
    const result = await Role.updateMany(
      { _id: { $in: roleIds } },
      {
        $set: {
          deletedAt: new Date(),
          status: "inactive",
        },
      },
    );

    log.info(`${result.modifiedCount} 个角色已被批量删除`, { roleIds });

    res.status(200).json({
      status: "success",
      data: { deletedCount: result.modifiedCount },
    });
  } catch (err) {
    logError(err, { context: "batchDeleteRoles" });
    next(err);
  }
};

// 获取角色权限
export const getRolePermissions = async (req, res, next) => {
  try {
    const role = await Role.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!role) {
      return next(new NotFoundError("未找到此角色"));
    }

    res.status(200).json({
      status: "success",
      data: {
        roleId: role._id,
        roleName: role.name,
        permissions: role.permissions,
      },
    });
  } catch (err) {
    logError(err, { context: "getRolePermissions", roleId: req.params.id });
    next(err);
  }
};

// 更新角色权限
export const updateRolePermissions = async (req, res, next) => {
  try {
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return next(new BadRequestError("权限必须是数组格式"));
    }

    const role = await Role.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!role) {
      return next(new NotFoundError("未找到此角色"));
    }

    role.permissions = permissions;
    role.updatedBy = req.user?.id;
    await role.save();

    log.info("角色权限已更新", {
      roleId: role._id,
      name: role.name,
      permissionCount: permissions.length,
    });

    res.status(200).json({
      status: "success",
      data: {
        roleId: role._id,
        roleName: role.name,
        permissions: role.permissions,
      },
    });
  } catch (err) {
    logError(err, { context: "updateRolePermissions", roleId: req.params.id });
    next(err);
  }
};

// 初始化系统角色
export const initializeSystemRoles = async (req, res, next) => {
  try {
    await Role.initializeSystemRoles();

    log.info("系统角色初始化完成");

    res.status(200).json({
      status: "success",
      message: "系统角色初始化完成",
    });
  } catch (err) {
    logError(err, { context: "initializeSystemRoles" });
    next(err);
  }
};

// 获取角色统计信息
export const getRoleStats = async (req, res, next) => {
  try {
    const [totalRoles, systemRoles, activeRoles, roleUsage] = await Promise.all(
      [
        Role.countDocuments({ deletedAt: null }),
        Role.countDocuments({ isSystem: true, deletedAt: null }),
        Role.countDocuments({ status: "active", deletedAt: null }),
        Role.aggregate([
          { $match: { deletedAt: null } },
          {
            $lookup: {
              from: "users",
              localField: "name",
              foreignField: "role",
              as: "users",
            },
          },
          {
            $project: {
              name: 1,
              displayName: 1,
              userCount: { $size: "$users" },
            },
          },
          { $sort: { userCount: -1 } },
        ]),
      ],
    );

    res.status(200).json({
      status: "success",
      data: {
        totalRoles,
        systemRoles,
        activeRoles,
        customRoles: totalRoles - systemRoles,
        roleUsage,
      },
    });
  } catch (err) {
    logError(err, { context: "getRoleStats" });
    next(err);
  }
};
