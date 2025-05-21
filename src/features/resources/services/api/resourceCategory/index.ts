import { BaseApi } from '@/api/base'
import type { ApiResponse } from '@/utils/api'
import type {
  ResourceCategory,
  CreateResourceCategoryDTO,
  UpdateResourceCategoryDTO,
} from '../../../types/resourceCategory'

export class ResourceCategoryApi extends BaseApi {
  constructor() {
    super({ prefix: '/resource-categories' })
  }

  // 获取分类列表
  async getList(includeInactive = false): Promise<ApiResponse<ResourceCategory[]>> {
    return this.get<ResourceCategory[]>('', { includeInactive })
  }

  // 获取单个分类
  async getDetail(id: string): Promise<ApiResponse<ResourceCategory>> {
    return this.get<ResourceCategory>(`/${id}`)
  }

  // 创建分类
  async create(data: CreateResourceCategoryDTO): Promise<ApiResponse<ResourceCategory>> {
    return this.post<ResourceCategory>('', data)
  }

  // 更新分类
  async update(
    id: string,
    data: UpdateResourceCategoryDTO
  ): Promise<ApiResponse<ResourceCategory>> {
    return this.put<ResourceCategory>(`/${id}`, data)
  }

  // 删除分类
  async remove(id: string): Promise<ApiResponse<void>> {
    return this.delete(`/${id}`)
  }

  // 更新排序
  async updateOrder(
    orderedCategories: { id: string; order: number }[]
  ): Promise<ApiResponse<void>> {
    return this.post<void>('/reorder', orderedCategories)
  }
}
