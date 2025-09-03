/**
 * API端点常量定义
 * 统一管理所有API路径，确保一致性和可维护性
 *
 * 设计原则：
 * 1. 所有API路径必须以 /api 开头
 * 2. 按功能模块分组管理
 * 3. 使用常量避免硬编码
 * 4. 支持参数化路径
 */

// API基础配置
export const API_BASE = {
  PREFIX: "/api",
  VERSION: "", // 支持未来版本控制
} as const;

// 构建完整API路径的辅助函数
export const buildApiPath = (endpoint: string): string => {
  const prefix = API_BASE.PREFIX;
  const version = API_BASE.VERSION ? `/${API_BASE.VERSION}` : "";
  return `${prefix}${version}${endpoint}`;
};

// 认证相关API端点
export const AUTH_ENDPOINTS = {
  LOGIN: buildApiPath("/auth/login"),
  LOGOUT: buildApiPath("/auth/logout"),
  REGISTER: buildApiPath("/auth/register"),
  ME: buildApiPath("/auth/me"),
  PROFILE: buildApiPath("/auth/profile"),
  CHANGE_PASSWORD: buildApiPath("/auth/change-password"),
  SEND_CODE: buildApiPath("/auth/send-code"),
} as const;

// 新闻相关API端点
export const NEWS_ENDPOINTS = {
  LIST: buildApiPath("/news"),
  CREATE: buildApiPath("/news"),
  DETAIL: (id: string) => buildApiPath(`/news/${id}`),
  UPDATE: (id: string) => buildApiPath(`/news/${id}`),
  DELETE: (id: string) => buildApiPath(`/news/${id}`),
  CATEGORIES: buildApiPath("/news-categories"),
} as const;

// 管理员新闻API端点
export const ADMIN_NEWS_ENDPOINTS = {
  LIST: buildApiPath("/admin/news"),
  CREATE: buildApiPath("/admin/news"),
  DETAIL: (id: string) => buildApiPath(`/admin/news/${id}`),
  UPDATE: (id: string) => buildApiPath(`/admin/news/${id}`),
  DELETE: (id: string) => buildApiPath(`/admin/news/${id}`),
} as const;

// 资源相关API端点
export const RESOURCE_ENDPOINTS = {
  LIST: buildApiPath("/resources"),
  CREATE: buildApiPath("/resources"),
  DETAIL: (id: string) => buildApiPath(`/resources/${id}`),
  UPDATE: (id: string) => buildApiPath(`/resources/${id}`),
  DELETE: (id: string) => buildApiPath(`/resources/${id}`),
  CATEGORIES: buildApiPath("/resource-categories"),
} as const;

// 管理员资源API端点
export const ADMIN_RESOURCE_ENDPOINTS = {
  LIST: buildApiPath("/admin/resources"),
  CREATE: buildApiPath("/admin/resources"),
  DETAIL: (id: string) => buildApiPath(`/admin/resources/${id}`),
  UPDATE: (id: string) => buildApiPath(`/admin/resources/${id}`),
  DELETE: (id: string) => buildApiPath(`/admin/resources/${id}`),
} as const;

// 用户管理API端点
export const USER_ENDPOINTS = {
  LIST: buildApiPath("/users"),
  CREATE: buildApiPath("/users"),
  DETAIL: (id: string) => buildApiPath(`/users/${id}`),
  UPDATE: (id: string) => buildApiPath(`/users/${id}`),
  DELETE: (id: string) => buildApiPath(`/users/${id}`),
} as const;

// 管理员用户API端点
export const ADMIN_USER_ENDPOINTS = {
  LIST: buildApiPath("/admin/users"),
  CREATE: buildApiPath("/admin/users"),
  DETAIL: (id: string) => buildApiPath(`/admin/users/${id}`),
  UPDATE: (id: string) => buildApiPath(`/admin/users/${id}`),
  DELETE: (id: string) => buildApiPath(`/admin/users/${id}`),
} as const;

// 上传相关API端点
export const UPLOAD_ENDPOINTS = {
  GENERAL: buildApiPath("/uploads"),
  RESOURCE: buildApiPath("/uploads/resource"),
  IMAGE: buildApiPath("/uploads/image"),
  DOCUMENT: buildApiPath("/uploads/document"),
} as const;

// 活动相关API端点
export const ACTIVITY_ENDPOINTS = {
  LIST: buildApiPath("/activities"),
  CREATE: buildApiPath("/activities"),
  DETAIL: (id: string) => buildApiPath(`/activities/${id}`),
  UPDATE: (id: string) => buildApiPath(`/activities/${id}`),
  DELETE: (id: string) => buildApiPath(`/activities/${id}`),
} as const;

// 设置相关API端点
export const SETTING_ENDPOINTS = {
  LIST: buildApiPath("/settings"),
  UPDATE: buildApiPath("/settings"),
  GET: (key: string) => buildApiPath(`/settings/${key}`),
  SET: (key: string) => buildApiPath(`/settings/${key}`),
} as const;

// 日志相关API端点
export const LOG_ENDPOINTS = {
  LIST: buildApiPath("/logs"),
  ACTIVITY: buildApiPath("/logs/activity"),
  ERROR: buildApiPath("/logs/error"),
  SECURITY: buildApiPath("/logs/security"),
} as const;

// 仪表板相关API端点
export const DASHBOARD_ENDPOINTS = {
  STATS: buildApiPath("/admin/dashboard/stats"),
  ANALYTICS: buildApiPath("/admin/dashboard/analytics"),
  RECENT: buildApiPath("/admin/dashboard/recent"),
} as const;

// 收藏相关API端点
export const FAVORITE_ENDPOINTS = {
  LIST: buildApiPath("/favorites"),
  ADD: buildApiPath("/favorites"),
  REMOVE: (id: string) => buildApiPath(`/favorites/${id}`),
} as const;

// 浏览历史API端点
export const VIEW_HISTORY_ENDPOINTS = {
  LIST: buildApiPath("/view-history"),
  ADD: buildApiPath("/view-history"),
  CLEAR: buildApiPath("/view-history/clear"),
} as const;

// 角色权限API端点
export const ROLE_ENDPOINTS = {
  LIST: buildApiPath("/roles"),
  CREATE: buildApiPath("/roles"),
  DETAIL: (id: string) => buildApiPath(`/roles/${id}`),
  UPDATE: (id: string) => buildApiPath(`/roles/${id}`),
  DELETE: (id: string) => buildApiPath(`/roles/${id}`),
} as const;

export const PERMISSION_ENDPOINTS = {
  LIST: buildApiPath("/permissions"),
  CREATE: buildApiPath("/permissions"),
  DETAIL: (id: string) => buildApiPath(`/permissions/${id}`),
  UPDATE: (id: string) => buildApiPath(`/permissions/${id}`),
  DELETE: (id: string) => buildApiPath(`/permissions/${id}`),
} as const;

// 管理员角色权限API端点
export const ADMIN_ROLE_ENDPOINTS = {
  LIST: buildApiPath("/admin/roles"),
  CREATE: buildApiPath("/admin/roles"),
  DETAIL: (id: string) => buildApiPath(`/admin/roles/${id}`),
  UPDATE: (id: string) => buildApiPath(`/admin/roles/${id}`),
  DELETE: (id: string) => buildApiPath(`/admin/roles/${id}`),
} as const;

export const ADMIN_PERMISSION_ENDPOINTS = {
  LIST: buildApiPath("/admin/permissions"),
  CREATE: buildApiPath("/admin/permissions"),
  DETAIL: (id: string) => buildApiPath(`/admin/permissions/${id}`),
  UPDATE: (id: string) => buildApiPath(`/admin/permissions/${id}`),
  DELETE: (id: string) => buildApiPath(`/admin/permissions/${id}`),
} as const;

// 健康检查API端点
export const HEALTH_ENDPOINTS = {
  CHECK: buildApiPath("/health"),
  DETAILED: buildApiPath("/health/detailed"),
} as const;

// 性能监控API端点（预留）
export const PERFORMANCE_ENDPOINTS = {
  REPORT: buildApiPath("/performance/report"),
  METRICS: buildApiPath("/performance/metrics"),
} as const;

// 导出所有端点分组
export const API_ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  NEWS: NEWS_ENDPOINTS,
  ADMIN_NEWS: ADMIN_NEWS_ENDPOINTS,
  RESOURCES: RESOURCE_ENDPOINTS,
  ADMIN_RESOURCES: ADMIN_RESOURCE_ENDPOINTS,
  USERS: USER_ENDPOINTS,
  ADMIN_USERS: ADMIN_USER_ENDPOINTS,
  UPLOADS: UPLOAD_ENDPOINTS,
  ACTIVITIES: ACTIVITY_ENDPOINTS,
  SETTINGS: SETTING_ENDPOINTS,
  LOGS: LOG_ENDPOINTS,
  DASHBOARD: DASHBOARD_ENDPOINTS,
  FAVORITES: FAVORITE_ENDPOINTS,
  VIEW_HISTORY: VIEW_HISTORY_ENDPOINTS,
  ROLES: ROLE_ENDPOINTS,
  PERMISSIONS: PERMISSION_ENDPOINTS,
  ADMIN_ROLES: ADMIN_ROLE_ENDPOINTS,
  ADMIN_PERMISSIONS: ADMIN_PERMISSION_ENDPOINTS,
  HEALTH: HEALTH_ENDPOINTS,
  PERFORMANCE: PERFORMANCE_ENDPOINTS,
} as const;

// 类型定义
export type ApiEndpoint = string;
export type ApiEndpointFunction = (...args: string[]) => string;

// 验证API路径格式的辅助函数
export const validateApiPath = (path: string): boolean => {
  return path.startsWith(API_BASE.PREFIX);
};

// 获取相对路径（去除API前缀）的辅助函数
export const getRelativePath = (apiPath: string): string => {
  if (!validateApiPath(apiPath)) {
    throw new Error(
      `Invalid API path: ${apiPath}. Must start with ${API_BASE.PREFIX}`,
    );
  }
  return apiPath.replace(API_BASE.PREFIX, "");
};

// 导出默认对象
export default API_ENDPOINTS;
