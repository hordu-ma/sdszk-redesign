import api from '@/utils/api'
import type { QueryParams, ApiResponse } from './api.types'

export abstract class BaseService<T> {
  constructor(
    protected endpoint: string,
    protected useCache = true
  ) {}

  async getAll(params?: QueryParams): Promise<ApiResponse<T[]>> {
    return api.get(this.endpoint, { params })
  }

  async get(id: string | number): Promise<ApiResponse<T>> {
    return api.get(`${this.endpoint}/${id}`)
  }

  async create(data: Partial<T> | FormData, options = {}): Promise<ApiResponse<T>> {
    return api.post(this.endpoint, data, options)
  }

  async update(id: string | number, data: Partial<T>): Promise<ApiResponse<T>> {
    return api.put(`${this.endpoint}/${id}`, data)
  }

  async delete(id: string | number): Promise<ApiResponse<void>> {
    return api.delete(`${this.endpoint}/${id}`)
  }
}
