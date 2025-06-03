// permissionMiddleware.js - 权限中间件
import { ForbiddenError } from '../utils/appError.js'

// 权限检查中间件
export const checkPermission = (resource, action) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('未认证的访问')
      }

      // 管理员拥有所有权限
      if (req.user.role === 'admin') {
        return next()
      }

      const { permissions } = req.user

      // 检查基本权限
      if (permissions?.[resource]?.[action]) {
        return next()
      }

      // 检查管理权限
      if (permissions?.[resource]?.['manage']) {
        return next()
      }

      throw new ForbiddenError(`没有${resource}的${action}权限`)
    } catch (error) {
      next(error)
    }
  }
}

// 多权限检查中间件（或关系）
export const checkAnyPermission = permissionChecks => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('未认证的访问')
      }

      // 管理员拥有所有权限
      if (req.user.role === 'admin') {
        return next()
      }

      const { permissions } = req.user
      const hasPermission = permissionChecks.some(
        ([resource, action]) => permissions?.[resource]?.[action]
      )

      if (!hasPermission) {
        throw new ForbiddenError('无权限执行此操作')
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// 多权限检查中间件（与关系）
export const checkAllPermissions = permissionChecks => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('未认证的访问')
      }

      // 管理员拥有所有权限
      if (req.user.role === 'admin') {
        return next()
      }

      const { permissions } = req.user
      const hasAllPermissions = permissionChecks.every(
        ([resource, action]) => permissions?.[resource]?.[action]
      )

      if (!hasAllPermissions) {
        throw new ForbiddenError('无权限执行此操作')
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
