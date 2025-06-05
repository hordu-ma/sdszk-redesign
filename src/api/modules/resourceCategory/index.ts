import { BaseApi } from '../../base'
import type { ApiResponse } from '../../types'

export interface ResourceCategory {
  _id: string
  key: string
  name: string
  description?: string
  order: number
  isActive: boolean
  resourceCount: number
  createdAt: string
  updatedAt: string
  // UI properties
  color?: string
  sort?: number
  status?: boolean
  id?: string // alias for _id for easier component usage
}

export interface CreateResourceCategoryDTO {
  key: string
  name: string
  description?: string
  order?: number
}

export interface UpdateResourceCategoryDTO extends Partial<CreateResourceCategoryDTO> {
  isActive?: boolean
}

export class ResourceCategoryApi extends BaseApi {
  constructor() {
    super({ prefix: '/resource-categories' })
  }

  // 获取所有分类
  async getList(params?: { includeInactive?: boolean }): Promise<ApiResponse<ResourceCategory[]>> {
    return await this.get<ResourceCategory[]>('', params)
  }

  // 获取单个分类
  async getById(id: string): Promise<ApiResponse<ResourceCategory>> {
    return await this.get<ResourceCategory>(`/${id}`)
  }

  // 创建分类
  async create(data: CreateResourceCategoryDTO): Promise<ApiResponse<ResourceCategory>> {
    return await this.post<ResourceCategory>('', data)
  }

  // 更新分类
  async update(
    id: string,
    data: UpdateResourceCategoryDTO
  ): Promise<ApiResponse<ResourceCategory>> {
    return await this.put<ResourceCategory>(`/${id}`, data)
  }

  // 删除分类
  async delete(id: string): Promise<ApiResponse<void>> {
    return await this.delete(`/${id}`)
  }

  // 更新分类排序
  async updateOrder(categories: { id: string; order: number }[]): Promise<ApiResponse<void>> {
    return await this.post<void>('/reorder', { categories })
  }
}
