import type { AxiosError } from 'axios'
import router from '../router'
import { message, notification } from 'ant-design-vue'
import { useUserStore } from '../stores/user'
import { ERROR_CODES, STATUS_CODES } from '@/config'

// 错误响应类型
export interface ApiErrorResponse {
  message: string
  code: string
  status: number
  errors?: Record<string, string[]>
  details?: unknown
  timestamp?: string
  path?: string
}

// 自定义 API 错误类
export class ApiError extends Error {
  code: string
  status: number
  errors?: Record<string, string[]>
  details?: unknown
  timestamp?: string
  path?: string

  constructor(
    message: string,
    code: string,
    status: number,
    options?: {
      errors?: Record<string, string[]>
      details?: unknown
      timestamp?: string
      path?: string
    }
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.errors = options?.errors
    this.details = options?.details
    this.timestamp = options?.timestamp
    this.path = options?.path

    // 设置 prototype 链
    Object.setPrototypeOf(this, new.target.prototype)
  }

  // 格式化错误信息
  getFormattedMessage(): string {
    if (this.errors) {
      const errorMessages = Object.entries(this.errors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('\n')
      return `${this.message}\n${errorMessages}`
    }
    return this.message
  }

  // 是否是特定类型的错误
  is(code: string): boolean {
    return this.code === code
  }

  // 是否是认证错误
  isAuthError(): boolean {
    return this.status === STATUS_CODES.UNAUTHORIZED || this.is(ERROR_CODES.AUTH_EXPIRED)
  }

  // 是否是权限错误
  isPermissionError(): boolean {
    return this.status === STATUS_CODES.FORBIDDEN || this.is(ERROR_CODES.PERMISSION_DENIED)
  }

  // 是否是验证错误
  isValidationError(): boolean {
    return this.status === STATUS_CODES.BAD_REQUEST || this.is(ERROR_CODES.VALIDATION_ERROR)
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

// 日志记录函数
const logError = (error: ApiError) => {
  if (import.meta.env.DEV || import.meta.env.VITE_APP_DEBUG === 'true') {
    console.error(
      `API Error:
      Code: ${error.code}
      Status: ${error.status}
      Message: ${error.message}
      Path: ${error.path}
      Time: ${error.timestamp}
      Details:`,
      error.details
    )
  }
}

// 错误通知函数
const showErrorNotification = (error: ApiError) => {
  notification.error({
    message: '请求错误',
    description: error.getFormattedMessage(),
    duration: 5,
  })
}

// 处理验证错误
const handleValidationError = (error: ApiError) => {
  if (error.errors) {
    Object.values(error.errors).forEach((errors: string[]) => {
      errors.forEach(errorMessage => message.error(errorMessage))
    })
  } else {
    message.error(error.message)
  }
}

// 处理认证错误
const handleAuthError = async (error: ApiError) => {
  const store = initStore()
  await store.logout()
  message.error(error.message || '登录已过期，请重新登录')
  router.push('/admin/login')
}

// 处理权限错误
const handlePermissionError = (error: ApiError) => {
  message.error(error.message || '您没有权限执行此操作')
  router.push('/admin/403')
}

// 主要的错误处理函数
export const handleApiError = async (error: AxiosError<ApiErrorResponse>) => {
  // 处理响应错误
  if (error.response) {
    const { status, data } = error.response

    // 构造 API 错误对象
    const apiError = new ApiError(
      data?.message || '请求失败',
      data?.code || ERROR_CODES.SERVER_ERROR,
      status,
      {
        errors: data?.errors,
        details: data?.details,
        timestamp: data?.timestamp || new Date().toISOString(),
        path: error.config?.url,
      }
    )

    // 记录错误日志
    logError(apiError)

    // 根据错误类型处理
    if (apiError.isAuthError()) {
      await handleAuthError(apiError)
    } else if (apiError.isPermissionError()) {
      handlePermissionError(apiError)
    } else if (apiError.isValidationError()) {
      handleValidationError(apiError)
    } else {
      // 根据状态码处理其他错误
      switch (status) {
        case STATUS_CODES.NOT_FOUND:
          message.error(apiError.message || '请求的资源不存在')
          break
        case STATUS_CODES.TIMEOUT:
          message.error('请求超时，请稍后重试')
          break
        case 429: // Too Many Requests
          message.error('请求过于频繁，请稍后重试')
          break
        case STATUS_CODES.SERVER_ERROR:
          showErrorNotification(apiError)
          break
        default:
          if (status >= 500) {
            showErrorNotification(apiError)
          } else {
            message.error(apiError.message || '操作失败，请重试')
          }
      }
    }

    return Promise.reject(apiError)
  }

  // 处理请求错误（网络问题等）
  if (error.request) {
    const networkError = new ApiError('网络连接失败，请检查您的网络', ERROR_CODES.NETWORK_ERROR, 0)
    logError(networkError)
    message.error(networkError.message)
    return Promise.reject(networkError)
  }

  // 处理其他错误
  const unknownError = new ApiError('发生未知错误', ERROR_CODES.SERVER_ERROR, 0, { details: error })
  logError(unknownError)
  showErrorNotification(unknownError)
  return Promise.reject(unknownError)
}

// 导出错误处理相关的工具函数
type CreateErrorOptions = {
  errors?: Record<string, string[]>
  details?: unknown
  timestamp?: string
  path?: string
}

export const ErrorUtils = {
  isApiError: (error: unknown): error is ApiError => error instanceof ApiError,
  createError: (
    message: string,
    code: string,
    status: number,
    options?: CreateErrorOptions
  ): ApiError => new ApiError(message, code, status, options),
}
