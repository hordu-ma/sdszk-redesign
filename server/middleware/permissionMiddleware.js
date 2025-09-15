// permissionMiddleware.js - 权限中间件
import { ForbiddenError } from "../utils/appError.js";

// 权限检查辅助函数
const hasPermission = (permissions, resource, action) => {
  if (!permissions) return false;

  // 支持字符串数组格式的权限（如 ['news:create', 'news:read']）
  if (Array.isArray(permissions)) {
    const permissionKey = `${resource}:${action}`;
    const manageKey = `${resource}:manage`;
    return (
      permissions.includes(permissionKey) || permissions.includes(manageKey)
    );
  }

  // 支持对象格式的权限（如 {news: {create: true, read: true}}）
  if (typeof permissions === "object") {
    return (
      permissions?.[resource]?.[action] || permissions?.[resource]?.["manage"]
    );
  }

  return false;
};

// 权限检查中间件
export const checkPermission = (resource, action) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError("未认证的访问");
      }

      // 管理员拥有所有权限
      if (req.user.role === "admin") {
        return next();
      }

      const { permissions } = req.user;

      // 使用统一的权限检查函数
      if (hasPermission(permissions, resource, action)) {
        return next();
      }

      throw new ForbiddenError(`没有${resource}的${action}权限`);
    } catch (error) {
      next(error);
    }
  };
};

// 多权限检查中间件（或关系）
export const checkAnyPermission = (permissionChecks) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError("未认证的访问");
      }

      // 管理员拥有所有权限
      if (req.user.role === "admin") {
        return next();
      }

      const { permissions } = req.user;
      const hasAnyPermission = permissionChecks.some(([resource, action]) =>
        hasPermission(permissions, resource, action),
      );

      if (!hasAnyPermission) {
        throw new ForbiddenError("无权限执行此操作");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// 多权限检查中间件（与关系）
export const checkAllPermissions = (permissionChecks) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError("未认证的访问");
      }

      // 管理员拥有所有权限
      if (req.user.role === "admin") {
        return next();
      }

      const { permissions } = req.user;
      const hasAllPermissions = permissionChecks.every(([resource, action]) =>
        hasPermission(permissions, resource, action),
      );

      if (!hasAllPermissions) {
        throw new ForbiddenError("无权限执行此操作");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
