// API 响应类型定义
export interface Pagination {
  total: number
  page: number
  limit: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  total?: number
  pagination?: Pagination
}

// 通用查询参数
export interface QueryParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 1 | -1
  [key: string]: any
}
