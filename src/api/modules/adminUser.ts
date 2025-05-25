import { BaseApi } from '../base'
import type { ApiResponse, QueryParams, PaginatedResponse } from '../types'

// 用户信息接口
export interface AdminUserItem {
  id: number
  username: string
  email: string
  phone?: string
  avatar?: string
  status: 'active' | 'inactive' | 'banned'
  role: string
  permissions: string[]
  lastLoginAt?: string
  lastLoginIp?: string
  loginCount: number
  createdAt: string
  updatedAt: string
}

// 用户表单数据接口
export interface UserFormData {
  username: string
  email: string
  phone?: string
  password?: string
  status: 'active' | 'inactive' | 'banned'
  role: string
  permissions?: string[]
}

// 角色信息接口
export interface RoleItem {
  id: number
  name: string
  displayName: string
  description?: string
  permissions: string[]
  userCount: number
  createdAt: string
  updatedAt: string
}

// 权限信息接口
export interface PermissionItem {
  id: number
  name: string
  displayName: string
  description?: string
  module: string
  action: string
  resource: string
}

// 用户查询参数接口
export interface UserQueryParams extends QueryParams {
  keyword?: string
  status?: 'active' | 'inactive' | 'banned'
  role?: string
  startDate?: string
  endDate?: string
}

// 用户管理 API 类
export class AdminUserApi extends BaseApi {
  constructor() {
    super('/admin')
  }

  // 获取用户列表
  getList(params?: UserQueryParams): Promise<ApiResponse<PaginatedResponse<AdminUserItem>>> {
    return this.get('/users', { params })
  }

  // 获取用户详情
  getDetail(id: number): Promise<ApiResponse<AdminUserItem>> {
    return this.get(`/users/${id}`)
  }

  // 创建用户
  create(data: UserFormData): Promise<ApiResponse<AdminUserItem>> {
    return this.post('/users', data)
  }

  // 更新用户
  update(id: number, data: Partial<UserFormData>): Promise<ApiResponse<AdminUserItem>> {
    return this.put(`/users/${id}`, data)
  }

  // 删除用户
  deleteUser(id: number): Promise<ApiResponse<void>> {
    return this.delete(`/users/${id}`)
  }

  // 批量删除用户
  batchDelete(ids: number[]): Promise<ApiResponse<void>> {
    return this.post('/users/batch-delete', { ids })
  }

  // 更新用户状态
  updateStatus(
    id: number,
    status: 'active' | 'inactive' | 'banned'
  ): Promise<ApiResponse<AdminUserItem>> {
    return this.patch(`/users/${id}/status`, { status })
  }

  // 重置用户密码
  resetPassword(id: number, newPassword: string): Promise<ApiResponse<void>> {
    return this.patch(`/users/${id}/reset-password`, { newPassword })
  }

  // 获取角色列表
  getRoles(): Promise<ApiResponse<RoleItem[]>> {
    return this.get('/roles')
  }

  // 创建角色
  createRole(
    data: Omit<RoleItem, 'id' | 'userCount' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<RoleItem>> {
    return this.post('/roles', data)
  }

  // 更新角色
  updateRole(
    id: number,
    data: Partial<Omit<RoleItem, 'id' | 'userCount' | 'createdAt' | 'updatedAt'>>
  ): Promise<ApiResponse<RoleItem>> {
    return this.put(`/roles/${id}`, data)
  }

  // 删除角色
  deleteRole(id: number): Promise<ApiResponse<void>> {
    return this.delete(`/roles/${id}`)
  }

  // 获取权限列表
  getPermissions(): Promise<ApiResponse<PermissionItem[]>> {
    return this.get('/permissions')
  }

  // 获取权限树（按模块分组）
  getPermissionTree(): Promise<ApiResponse<Record<string, PermissionItem[]>>> {
    return this.get('/permissions/tree')
  }
}
