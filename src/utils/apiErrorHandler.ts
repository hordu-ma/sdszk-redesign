import type { AxiosError } from 'axios'
import router from '../router'
import { message } from 'ant-design-vue'
import { useUserStore } from '../stores/user'

export interface ApiErrorResponse {
  message: string
  code?: string
  errors?: Record<string, string[]>
  details?: any
}

export class ApiError extends Error {
  code: string
  details?: any
  status: number

  constructor(message: string, code: string, status: number, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

// 保存 store 实例
let userStore: ReturnType<typeof useUserStore>

// 初始化 store
const initStore = () => {
  if (!userStore) {
    userStore = useUserStore()
  }
  return userStore
}

export const handleApiError = (error: AxiosError<ApiErrorResponse>) => {
  if (error.response) {
    const { status, data } = error.response
    const errorMessage = data?.message || '请求失败'
    const code = data?.code || String(status)
    const details = data?.details

    // 创建自定义错误对象
    const apiError = new ApiError(errorMessage, code, status, details)

    switch (status) {
      case 400:
        message.error(errorMessage)
        break
      case 401:
        // 未授权，清除用户信息并重定向到登录页
        const store = initStore()
        store.logout()
        router.push('/admin/login')
        break
      case 403:
        message.error(errorMessage || '您没有权限执行此操作')
        break
      case 404:
        message.error(errorMessage || '请求的资源不存在')
        break
      case 422:
        // 验证错误
        if (data?.errors) {
          Object.values(data.errors).forEach((errors: string[]) => {
            errors.forEach(error => message.error(error))
          })
        } else {
          message.error(errorMessage)
        }
        break
      case 429:
        message.error('请求过于频繁，请稍后重试')
        break
      case 500:
        message.error('服务器内部错误，请稍后重试')
        break
      default:
        if (status >= 500) {
          message.error('服务器出错，请稍后重试')
        } else {
          message.error(errorMessage || '操作失败，请重试')
        }
    }

    return Promise.reject(apiError)
  } else if (error.request) {
    message.error('网络连接失败，请检查您的网络')
  } else {
    message.error('发生未知错误')
  }
  return Promise.reject(error)
}
