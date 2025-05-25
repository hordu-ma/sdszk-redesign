import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import axios, { AxiosError, AxiosHeaders, AxiosRequestHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import api from '../api'
import { API_CONFIG, ERROR_CONFIG } from '../../config'

interface ApiResponse<T = any> {
  status: string
  data: T
  message?: string
}

type CustomAxiosRequestConfig = InternalAxiosRequestConfig<any> & {
  _retry?: boolean
  _retryCount?: number
}

type MockAxiosResponse<T = any> = AxiosResponse<ApiResponse<T>> & {
  config: CustomAxiosRequestConfig
}

type RequestInterceptor = (config: CustomAxiosRequestConfig) => Promise<CustomAxiosRequestConfig>
type ResponseInterceptor = (response: AxiosResponse<any>) => Promise<AxiosResponse<any>>
type ErrorHandler = (error: AxiosError<any>) => Promise<never>

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      },
      defaults: {
        baseURL: API_CONFIG.baseURL,
        timeout: API_CONFIG.timeout,
        headers: new AxiosHeaders()
      }
    })),
    AxiosError: vi.fn(),
    AxiosHeaders: vi.fn().mockImplementation(() => ({
      set: vi.fn(),
      get: vi.fn(),
      has: vi.fn(),
      delete: vi.fn()
    }))
  }
}))

describe('API Configuration', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('应该使用正确的基础配置创建axios实例', () => {
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    })
  })
})

describe('请求拦截器', () => {
  let requestInterceptor: RequestInterceptor
  let errorHandler: ErrorHandler

  beforeEach(() => {
    const mockAxiosInstance = axios.create()
    const mockInterceptors = vi.mocked(mockAxiosInstance.interceptors.request.use)
    requestInterceptor = mockInterceptors.mock.calls[0][0] as RequestInterceptor
    errorHandler = mockInterceptors.mock.calls[0][1] as ErrorHandler
  })

  it('应该在请求头中添加token', async () => {
    const token = 'test-token'
    localStorage.setItem('token', token)

    const headers = new AxiosHeaders()
    const config: CustomAxiosRequestConfig = {
      headers,
      transitional: {} as any
    }
    const result = await requestInterceptor(config)

    expect(result.headers['Authorization']).toBe(`Bearer ${token}`)
  })

  it('在没有token时不应该修改请求头', async () => {
    const headers = new AxiosHeaders()
    const config: CustomAxiosRequestConfig = {
      headers,
      transitional: {} as any
    }
    const result = await requestInterceptor(config)

    expect(result.headers['Authorization']).toBeUndefined()
  })

  it('应该正确处理请求错误', async () => {
    const headers = new AxiosHeaders()
    const error = new AxiosError(
      'Request failed',
      'ECONNABORTED',
      { headers } as CustomAxiosRequestConfig
    )
    await expect(errorHandler(error)).rejects.toThrow('Request failed')
  })
})

describe('响应拦截器', () => {
  let responseInterceptor: ResponseInterceptor
  let errorHandler: ErrorHandler

  beforeEach(() => {
    const mockAxiosInstance = axios.create()
    const mockInterceptors = vi.mocked(mockAxiosInstance.interceptors.response.use)
    responseInterceptor = mockInterceptors.mock.calls[0][0] as ResponseInterceptor
    errorHandler = mockInterceptors.mock.calls[0][1] as ErrorHandler
  })

  describe('响应转换', () => {
    it('应该直接返回blob响应', async () => {
      const headers = new AxiosHeaders()
      const response: AxiosResponse = {
        status: 200,
        statusText: 'OK',
        headers,
        config: {
          headers,
          transitional: {} as any,
          responseType: 'blob'
        } as CustomAxiosRequestConfig,
        data: {
          status: 'success',
          data: new Blob(['test'])
        }
      }

      const result = await responseInterceptor(response)
      expect(result.data.data).toBeInstanceOf(Blob)
    })

    it('应该保持标准格式的响应不变', async () => {
      const headers = new AxiosHeaders()
      const response: AxiosResponse = {
        status: 200,
        statusText: 'OK',
        headers,
        config: {
          headers,
          transitional: {} as any
        } as CustomAxiosRequestConfig,
        data: {
          status: 'success',
          data: { test: 'data' },
          message: 'Success'
        }
      }

      const result = await responseInterceptor(response)
      expect(result.data).toEqual(response.data)
    })

    it('应该转换非标准格式的响应', () => {
      const headers = new AxiosHeaders()
      const response: AxiosResponse = {
        status: 200,
        statusText: 'OK',
        headers,
        config: {
          headers,
          transitional: {} as any
        } as CustomAxiosRequestConfig,
        data: {
          status: 'error',
          data: { test: 'data' },
          message: 'Error occurred'
        }
      }

      expect(() => responseInterceptor(response)).toThrow()
    })
  })

  describe('错误重试机制', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('应该在网络错误时重试请求', async () => {
      const headers = new AxiosHeaders()
      const config: CustomAxiosRequestConfig = {
        headers,
        transitional: {} as any,
        _retryCount: 0
      }
      const error = new AxiosError(
        'Network Error',
        'ECONNABORTED',
        config
      )

      const retryPromise = errorHandler(error)
      vi.advanceTimersByTime(ERROR_CONFIG.retryDelay)

      await retryPromise

      expect(config._retryCount).toBe(1)
    })

    it('不应该重试401错误', async () => {
      const headers = new AxiosHeaders()
      const config: CustomAxiosRequestConfig = {
        headers,
        transitional: {} as any,
        _retryCount: 0
      }
      const error = new AxiosError(
        'Unauthorized',
        'UNAUTHORIZED',
        config,
        undefined,
        {
          status: 401,
          statusText: 'Unauthorized',
          headers,
          config,
          data: {
            status: 'error',
            message: 'Unauthorized'
          }
        }
      )

      await expect(errorHandler(error)).rejects.toThrow()
      expect(config._retryCount).toBeUndefined()
    })

    it('应该在达到最大重试次数后停止重试', async () => {
      const headers = new AxiosHeaders()
      const config: CustomAxiosRequestConfig = {
        headers,
        transitional: {} as any,
        _retryCount: ERROR_CONFIG.maxRetries
      }
      const error = new AxiosError(
        'Network Error',
        'ECONNABORTED',
        config
      )

      await expect(errorHandler(error)).rejects.toThrow()
    })
  })
})