import { BaseService } from '@/services/base.service'
import type { NewsCategory, CreateNewsCategoryDTO, UpdateNewsCategoryDTO } from '../types'
import type { ApiResponse } from '@/utils/api'
import { newsCategoryApi } from '@/api'

export class NewsCategoryService extends BaseService<NewsCategory> {
  constructor() {
    super('newsCategory')
  }

  // 获取分类列表
  async getList(includeInactive = false): Promise<ApiResponse<NewsCategory[]>> {
    const cacheKey = `list:${includeInactive}`
    if (this.useCache) {
      const cached = this.getCached<ApiResponse<NewsCategory[]>>(cacheKey)
      if (cached) return cached
    }

    const response = await newsCategoryApi.getList(includeInactive)
    if (this.useCache) {
      this.cacheResponse(cacheKey, response)
    }
    return response
  }

  // 获取核心分类
  async getCoreCategories(): Promise<ApiResponse<NewsCategory[]>> {
    const cacheKey = 'core'
    if (this.useCache) {
      const cached = this.getCached<ApiResponse<NewsCategory[]>>(cacheKey)
      if (cached) return cached
    }

    const response = await newsCategoryApi.getCoreCategories()
    if (this.useCache) {
      this.cacheResponse(cacheKey, response)
    }
    return response
  }

  // 创建分类
  async create(data: CreateNewsCategoryDTO): Promise<ApiResponse<NewsCategory>> {
    const response = await newsCategoryApi.create(data)
    if (this.useCache) {
      this.clearCache()
    }
    return response
  }

  // 更新分类
  async update(id: string, data: UpdateNewsCategoryDTO): Promise<ApiResponse<NewsCategory>> {
    const response = await newsCategoryApi.update(id, data)
    if (this.useCache) {
      this.clearCache()
    }
    return response
  }

  // 删除分类
  async remove(id: string): Promise<ApiResponse<void>> {
    const response = await newsCategoryApi.remove(id)
    if (this.useCache) {
      this.clearCache()
    }
    return response
  }

  // 更新分类顺序
  async updateOrder(
    orderedCategories: { id: string; order: number }[]
  ): Promise<ApiResponse<void>> {
    const response = await newsCategoryApi.updateOrder(orderedCategories)
    if (this.useCache) {
      this.clearCache()
    }
    return response
  }
}
