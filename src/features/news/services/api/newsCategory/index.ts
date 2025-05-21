import { BaseApi } from '@/api/base'
import type { ApiResponse } from '@/utils/api'
import type { NewsCategory, CreateNewsCategoryDTO, UpdateNewsCategoryDTO } from '../../../types'

export class NewsCategoryApi extends BaseApi {
  constructor() {
    super({ prefix: '/news-categories' })
  }

  // 获取分类列表
  async getList(includeInactive = false): Promise<ApiResponse<NewsCategory[]>> {
    return this.get<NewsCategory[]>('', { includeInactive })
  }

  // 获取核心分类
  async getCoreCategories(): Promise<ApiResponse<NewsCategory[]>> {
    return this.get<NewsCategory[]>('/core')
  }

  // 获取单个分类
  async getDetail(id: string): Promise<ApiResponse<NewsCategory>> {
    return this.get<NewsCategory>(`/${id}`)
  }

  // 创建分类
  async create(data: CreateNewsCategoryDTO): Promise<ApiResponse<NewsCategory>> {
    return this.post<NewsCategory>('', data)
  }

  // 更新分类
  async update(id: string, data: UpdateNewsCategoryDTO): Promise<ApiResponse<NewsCategory>> {
    return this.put<NewsCategory>(`/${id}`, data)
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
