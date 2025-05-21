// 统一的 API 响应类型定义
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  pagination?: PaginationInfo
}

export interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages?: number
}

// 分页响应类型
export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: PaginationInfo
}

// 错误响应类型
export interface ErrorResponse {
  success: false
  message: string
  code: string
  details?: unknown
  errors?: Record<string, string[]>
  timestamp?: string
  path?: string
}

// API 模块配置类型
export interface ApiModuleConfig {
  baseURL?: string
  prefix?: string
}
