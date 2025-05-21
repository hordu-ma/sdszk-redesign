import { BaseService } from './base.service'
import type { ApiResponse } from '../api/types'
import type {
  ResourceCategory,
  CreateResourceCategoryDTO,
  UpdateResourceCategoryDTO,
} from '../api/modules/resourceCategory'
import { resourceCategoryApi } from '../api'

export class ResourceCategoryService extends BaseService<ResourceCategory> {
  constructor() {
    super('resourceCategory')
  }

  // 获取分类列表
  async getList(includeInactive = false): Promise<ApiResponse<ResourceCategory[]>> {
    const cacheKey = `list:${includeInactive}`
    if (this.useCache) {
      const cached = this.getCached<ApiResponse<ResourceCategory[]>>(cacheKey)
      if (cached) return cached
    }

    const response = await resourceCategoryApi.getList({ includeInactive })
    if (this.useCache) {
      this.cacheResponse(cacheKey, response)
    }
    return response
  }

  // 获取单个分类
  async getById(id: string): Promise<ApiResponse<ResourceCategory>> {
    const cacheKey = `detail:${id}`
    if (this.useCache) {
      const cached = this.getCached<ApiResponse<ResourceCategory>>(cacheKey)
      if (cached) return cached
    }

    const response = await resourceCategoryApi.getById(id)
    if (this.useCache) {
      this.cacheResponse(cacheKey, response)
    }
    return response
  }

  // 创建分类
  async create(data: CreateResourceCategoryDTO): Promise<ApiResponse<ResourceCategory>> {
    try {
      this.validateCategoryData(data)
      const response = await resourceCategoryApi.create(data)
      if (this.useCache) {
        this.clearCache()
      }
      return response
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          throw new Error('分类名称已存在')
        }
      }
      throw error
    }
  }

  // 更新分类
  async update(
    id: string,
    data: UpdateResourceCategoryDTO
  ): Promise<ApiResponse<ResourceCategory>> {
    try {
      this.validateCategoryData(data, true)
      const response = await resourceCategoryApi.update(id, data)
      if (this.useCache) {
        this.clearCache()
        this.deleteCached(`detail:${id}`)
      }
      return response
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw new Error('分类不存在')
        }
      }
      throw error
    }
  }

  // 删除分类
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await resourceCategoryApi.delete(id)
      if (this.useCache) {
        this.clearCache()
      }
      return response
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new Error('分类不存在')
      }
      throw error
    }
  }

  // 更新分类排序
  async updateOrder(categories: { id: string; order: number }[]): Promise<ApiResponse<void>> {
    const response = await resourceCategoryApi.updateOrder(categories)
    if (this.useCache) {
      this.clearCache()
    }
    return response
  }

  // 验证分类数据
  private validateCategoryData(data: Partial<CreateResourceCategoryDTO>, isUpdate = false): void {
    if (!isUpdate && !data.name) {
      throw new Error('分类名称不能为空')
    }

    if (data.name && (data.name.length < 2 || data.name.length > 50)) {
      throw new Error('分类名称长度应在2-50个字符之间')
    }

    if (data.description && data.description.length > 200) {
      throw new Error('分类描述不能超过200个字符')
    }

    if (data.order !== undefined && (data.order < 0 || data.order > 999)) {
      throw new Error('排序值必须在0-999之间')
    }
  }
}
