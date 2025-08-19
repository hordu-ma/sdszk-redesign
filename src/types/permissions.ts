/**
 * 后端返回的权限数据结构
 */
export interface BackendPermissions {
  [module: string]: {
    [action: string]: boolean;
  };
}

/**
 * 前端使用的权限格式
 * 格式: "module:action"
 */
export type FrontendPermission = string;

/**
 * 权限列表
 */
export type PermissionList = FrontendPermission[];
