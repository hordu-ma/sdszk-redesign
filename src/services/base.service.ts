import api from '@/utils/api'
import type { QueryParams, ApiResponse } from './api.types'
import { apiCache } from '@/utils/apiCache'

interface CacheOptions {
  ttl?: number
  tags?: string[]
}

export abstract class BaseService<T> {
  constructor(
    protected endpoint: string,
    protected useCache = true,
    protected defaultCacheOptions: CacheOptions = {}
  ) {}

  async getAll(params?: QueryParams): Promise<ApiResponse<T[]>> {
    if (this.useCache) {
      const cached = apiCache.get<ApiResponse<T[]>>(this.endpoint, params)
      if (cached) return cached
    }

    const response = await api.get(this.endpoint, { params })
    const apiResponse: ApiResponse<T[]> = {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      message: response.statusText,
    }

    if (this.useCache) {
      apiCache.set(this.endpoint, apiResponse, {
        params,
        tags: [this.endpoint, 'list'],
        ...this.defaultCacheOptions,
      })
    }

    return apiResponse
  }

  async get(id: string | number): Promise<ApiResponse<T>> {
    const url = `${this.endpoint}/${id}`

    if (this.useCache) {
      const cached = apiCache.get<ApiResponse<T>>(url)
      if (cached) return cached
    }

    const response = await api.get(url)
    const apiResponse: ApiResponse<T> = {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      message: response.statusText,
    }

    if (this.useCache) {
      apiCache.set(url, apiResponse, {
        tags: [this.endpoint, `${this.endpoint}:${id}`],
        ...this.defaultCacheOptions,
      })
    }

    return apiResponse
  }

  async create(data: Partial<T> | FormData, options = {}): Promise<ApiResponse<T>> {
    const response = await api.post(this.endpoint, data, options)
    const apiResponse: ApiResponse<T> = {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      message: response.statusText,
    }

    if (this.useCache) {
      // 清除列表缓存
      apiCache.deleteByTag(this.endpoint)
    }

    return apiResponse
  }

  async update(id: string | number, data: Partial<T>): Promise<ApiResponse<T>> {
    const response = await api.put(`${this.endpoint}/${id}`, data)
    const apiResponse: ApiResponse<T> = {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      message: response.statusText,
    }

    if (this.useCache) {
      // 清除相关缓存
      apiCache.deleteByTag(`${this.endpoint}:${id}`)
      apiCache.deleteByTag(this.endpoint)
    }

    return apiResponse
  }

  async delete(id: string | number): Promise<ApiResponse<void>> {
    const response = await api.delete(`${this.endpoint}/${id}`)
    const apiResponse: ApiResponse<void> = {
      success: response.status >= 200 && response.status < 300,
      data: void 0,
      message: response.statusText,
    }

    if (this.useCache) {
      // 清除相关缓存
      apiCache.deleteByTag(`${this.endpoint}:${id}`)
      apiCache.deleteByTag(this.endpoint)
    }

    return apiResponse
  }

  // 清除此服务相关的所有缓存
  clearCache(): void {
    if (this.useCache) {
      apiCache.deleteByPattern(`^${this.endpoint}`)
    }
  }

  // 启用/禁用缓存
  toggleCache(enabled: boolean): void {
    this.useCache = enabled
    if (!enabled) {
      this.clearCache()
    }
  }

  // 更新缓存选项
  updateCacheOptions(options: CacheOptions): void {
    this.defaultCacheOptions = {
      ...this.defaultCacheOptions,
      ...options,
    }
  }
}
