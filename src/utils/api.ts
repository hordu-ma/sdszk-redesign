// api.ts - Axios API 配置
import axios from 'axios'
import { setupInterceptors } from './interceptors'

// 定义API响应的通用接口
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

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 允许跨域携带 cookie
})

// 添加响应转换器
api.interceptors.response.use(
  response => {
    // 如果响应是blob类型（文件下载），直接返回
    if (response.config.responseType === 'blob') {
      return response.data
    }

    // 转换为 ApiResponse 格式
    const apiResponse: ApiResponse = {
      success: response.status >= 200 && response.status < 300,
      data: response.data?.data ?? response.data,
      message: response.data?.message,
      total: response.data?.total,
      pagination: response.data?.pagination,
    }

    return apiResponse
  },
  error => Promise.reject(error)
)

// 设置拦截器
setupInterceptors(api)

export interface UploadConfig {
  uploadUrl: string
  assetsUrl: string
}

export const uploadConfig: UploadConfig = {
  uploadUrl: import.meta.env.VITE_UPLOAD_URL as string,
  assetsUrl: import.meta.env.VITE_ASSETS_URL as string,
}

export default api
