// userController.js - 用户控制器
import User from "../models/User.js";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../utils/appError.js";
import { createSendToken } from "./authController.js";
import { logError, log } from "../utils/logger.js";

// 辅助函数：规范化用户输出
const normalizeUserOutput = (user) => {
  if (!user) return null;
  const userObject = user.toObject ? user.toObject() : user;

  // 移除敏感或内部字段
  const {
    _id,
    __v,
    password,
    passwordChangedAt,
    passwordResetToken,
    passwordResetExpires,
    loginHistory,
    ...rest
  } = userObject;

  return {
    id: _id.toString(),
    ...rest,
    status: rest.status || (rest.active ? "active" : "inactive"),
    lastLoginAt: rest.lastLogin || null,
    loginCount: Array.isArray(loginHistory) ? loginHistory.length : 0,
  };
};

// 获取所有用户 (管理员)
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ deletedAt: null }).select("-__v").lean();
    const normalizedUsers = users.map(normalizeUserOutput);

    res.status(200).json({
      data: normalizedUsers,
      pagination: {
        total: normalizedUsers.length,
        // 在实际应用中，这里应该有更完整的分页逻辑
      },
    });
  } catch (err) {
    logError(err, { context: "getAllUsers" });
    next(err);
  }
};

// 获取单个用户 (管理员)
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      deletedAt: null,
    }).select("-__v");

    if (!user) {
      return next(new NotFoundError("未找到此用户"));
    }

    res.status(200).json({
      status: "success",
      data: normalizeUserOutput(user),
    });
  } catch (err) {
    logError(err, { context: "getUser", userId: req.params.id });
    next(err);
  }
};

// 创建用户 (管理员)
export const createUser = async (req, res, next) => {
  try {
    const { username, email, phone, password, role, status, permissions } =
      req.body;

    if (!username || !password) {
      return next(new BadRequestError("用户名和密码是必填项"));
    }

    const doc = await User.create({
      username,
      email,
      phone,
      password, // 密码将在 pre-save hook 中自动哈希
      role: role || "user",
      status: status || "active",
      ...(permissions ? { permissions } : {}),
    });

    log.info("新用户已创建", { userId: doc._id, username: doc.username });

    res.status(201).json({
      status: "success",
      data: normalizeUserOutput(doc),
    });
  } catch (err) {
    logError(err, { context: "createUser" });
    next(err);
  }
};

// 更新用户 (管理员)
export const updateUser = async (req, res, next) => {
  try {
    // 防止通过此路由更新密码
    if (req.body.password) {
      return next(
        new BadRequestError("此路由不用于密码更新。请使用 /resetUserPassword"),
      );
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return next(new NotFoundError("未找到此用户"));
    }

    res.status(200).json({
      status: "success",
      data: normalizeUserOutput(user),
    });
  } catch (err) {
    logError(err, { context: "updateUser", userId: req.params.id });
    next(err);
  }
};

// 软删除用户 (管理员)
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new NotFoundError("未找到此用户"));
    }

    await user.softDelete();

    log.info("用户已被软删除", { userId: user._id });

    res.status(200).json({ status: "success", data: true });
  } catch (err) {
    logError(err, { context: "deleteUser", userId: req.params.id });
    next(err);
  }
};

// 批量软删除用户 (管理员)
export const batchDeleteUsers = async (req, res, next) => {
  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return next(new BadRequestError("需要提供用户ID数组"));
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      {
        $set: {
          deletedAt: new Date(),
          active: false,
          status: "inactive",
        },
      },
    );

    if (result.modifiedCount === 0) {
      return next(new NotFoundError("未找到任何匹配的用户进行删除"));
    }

    log.info(`${result.modifiedCount} 个用户已被批量软删除`, { userIds });

    res.status(200).json({
      status: "success",
      data: { deletedCount: result.modifiedCount },
    });
  } catch (err) {
    logError(err, { context: "batchDeleteUsers" });
    next(err);
  }
};

// 更新用户状态 (管理员)
export const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !["active", "inactive", "banned"].includes(status)) {
      return next(new BadRequestError("无效的状态值"));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status }, // pre-save hook 将同步 active
      { new: true, runValidators: true },
    );

    if (!user) {
      return next(new NotFoundError("未找到此用户"));
    }

    res.status(200).json({
      status: "success",
      data: normalizeUserOutput(user),
    });
  } catch (err) {
    logError(err, { context: "updateUserStatus", userId: req.params.id });
    next(err);
  }
};

// 重置用户密码 (管理员)
export const resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return next(new BadRequestError("请提供新密码"));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new NotFoundError("未找到此用户"));
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date(); // 强制更新密码修改时间
    await user.save({ validateBeforeSave: true });

    log.info("管理员重置了用户密码", { userId: user._id });

    res.status(200).json({
      status: "success",
      message: "密码已成功重置",
    });
  } catch (err) {
    logError(err, { context: "resetUserPassword", userId: req.params.id });
    next(err);
  }
};

// --- 当前登录用户的路由 ---

// 更新当前登录用户的密码
export const updatePassword = async (req, res, next) => {
  try {
    // 1) 获取用户
    const user = await User.findById(req.user.id).select("+password");

    // 2) 检查旧密码是否正确
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new UnauthorizedError("当前密码不正确"));
    }

    // 3) 如果正确，更新密码
    user.password = req.body.password;
    user.passwordChangedAt = new Date();
    await user.save();

    // 4) 重新生成Token并发送
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// 获取当前用户信息
export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  getUser(req, res, next);
};

// 更新当前用户个人资料
export const updateMyProfile = async (req, res, next) => {
  try {
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new BadRequestError("此路由不用于密码更新。请使用 /update-password"),
      );
    }

    // 过滤掉不允许用户自行修改的字段
    const filteredBody = { ...req.body };
    delete filteredBody.role;
    delete filteredBody.status;
    delete filteredBody.permissions;
    delete filteredBody.active;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      status: "success",
      data: normalizeUserOutput(updatedUser),
    });
  } catch (err) {
    next(err);
  }
};

// 上传头像
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new BadRequestError("请上传图片文件"));
    }
    const user = await User.findById(req.user.id);
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      data: { avatar: user.avatar },
    });
  } catch (err) {
    next(err);
  }
};

// 获取用户统计信息
export const getUserStats = async (req, res) => {
  // 示例：可以添加更多统计逻辑
  res.status(200).json({
    status: "success",
    data: {
      message: "统计功能待实现",
    },
  });
};

// 获取我的活动日志
export const getMyActivityLog = async (req, res) => {
  // 示例：可以添加活动日志逻辑
  res.status(200).json({
    status: "success",
    data: {
      message: "活动日志功能待实现",
    },
  });
};

// 删除我的账户
export const deleteMyAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new NotFoundError("未找到用户"));
    }
    await user.softDelete();

    log.info("用户自行删除了账户", { userId: user._id });

    res.status(200).json({
      status: "success",
      message: "您的账户已成功删除。",
    });
  } catch (err) {
    next(err);
  }
};
