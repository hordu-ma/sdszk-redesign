// API 响应基础类型
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  total?: number
  pagination?: {
    total: number
    page: number
    limit: number
  }
}

// 通用查询参数
export interface QueryParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 1 | -1
  [key: string]: any
}

// 分页响应
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number
    page: number
    limit: number
  }
}

// API 模块基础配置
export interface ApiModuleConfig {
  baseURL?: string
  prefix?: string
  timeout?: number
  headers?: Record<string, string>
}
