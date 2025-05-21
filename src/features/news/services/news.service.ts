import { BaseService } from '@/services/base.service'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { News, CreateNewsDTO, UpdateNewsDTO, NewsQueryParams } from '../types/news'
import { newsApi } from '@/api'

export interface News {
  [key: string]: unknown;
}

export class NewsService extends BaseService<News> {
  constructor() {
    super('news')
  }

  // 获取新闻列表
  async getList(params?: NewsQueryParams): Promise<PaginatedResponse<News>> {
    const response = await newsApi.getList(params)
    if (this.useCache) {
      this.cacheResponse('list', response, params)
    }
    return response as PaginatedResponse<News>
  }

  // 获取新闻详情
  async getDetail(id: string): Promise<ApiResponse<News>> {
    const cacheKey = `detail:${id}`
    if (this.useCache) {
      const cached = this.getCached<ApiResponse<News>>(cacheKey)
      if (cached) return cached
    }

    const response = await newsApi.getDetail(id)
    if (this.useCache) {
      this.cacheResponse(cacheKey, response)
    }
    return response as ApiResponse<News>
  }

  // 创建新闻
  async create(data: CreateNewsDTO): Promise<ApiResponse<News>> {
    const response = await newsApi.create(data)
    if (this.useCache) {
      this.clearCache()
    }
    return response as ApiResponse<News>
  }

  // 更新新闻
  async update(id: string | number, data: UpdateNewsDTO): Promise<ApiResponse<News>> {
    const response = await newsApi.update(id.toString(), data)
    if (this.useCache) {
      this.clearCache()
      this.deleteCached(`detail:${id}`)
    }
    return response as ApiResponse<News>
  }

  // 删除新闻
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await newsApi.delete(id)
    if (this.useCache) {
      this.clearCache()
      this.deleteCached(`detail:${id}`)
    }
    return response
  }

  // 更新新闻状态
  async updateStatus(id: string, status: News['status']): Promise<ApiResponse<News>> {
    const response = await newsApi.updateStatus(id, status)
    if (this.useCache) {
      this.clearCache()
      this.deleteCached(`detail:${id}`)
    }
    return response as ApiResponse<News>
  }

  // 获取分类列表
  async getCategories(): Promise<ApiResponse<string[]>> {
    const cacheKey = 'categories'
    if (this.useCache) {
      const cached = this.getCached<ApiResponse<string[]>>(cacheKey)
      if (cached) return cached
    }

    const response = await newsApi.getCategories()
    if (this.useCache) {
      this.cacheResponse(cacheKey, response)
    }
    return response
  }

  // 获取标签列表
  async getTags(): Promise<ApiResponse<string[]>> {
    const cacheKey = 'tags'
    if (this.useCache) {
      const cached = this.getCached<ApiResponse<string[]>>(cacheKey)
      if (cached) return cached
    }

    const response = await newsApi.getTags()
    if (this.useCache) {
      this.cacheResponse(cacheKey, response)
    }
    return response
  }
}
