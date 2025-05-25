import type { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import type { ApiModuleConfig, ApiResponse, QueryParams } from './types'
import api from '@/utils/api'
import type { ApiErrorResponse } from '@/types/error.types'
import { handleApiError } from '@/utils/apiErrorHandler'

export abstract class BaseApi {
  protected api: AxiosInstance
  protected baseURL: string
  protected prefix: string

  constructor(config: ApiModuleConfig | string = {}) {
    this.api = api
    if (typeof config === 'string') {
      this.baseURL = ''
      this.prefix = config
    } else {
      this.baseURL = config.baseURL || ''
      this.prefix = config.prefix || ''
    }
  }

  protected getUrl(path: string): string {
    return `/api${this.prefix}${path}`
  }

  protected async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      return await this.api.request<any, ApiResponse<T>>({
        ...config,
        url: this.getUrl(config.url || ''),
      })
    } catch (error) {
      if (error instanceof Error) {
        return handleApiError(error as AxiosError<ApiErrorResponse>)
      }
      throw error
    }
  }

  protected async get<T>(path: string, params?: QueryParams): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url: path,
      params,
    })
  }

  protected async post<T>(path: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url: path,
      data,
    })
  }

  protected async put<T>(path: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url: path,
      data,
    })
  }

  protected async delete(path: string): Promise<ApiResponse<void>> {
    return this.request<void>({
      method: 'DELETE',
      url: path,
    })
  }

  protected async patch<T>(path: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url: path,
      data,
    })
  }
}

export { api }
