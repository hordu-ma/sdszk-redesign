import { BaseApi } from '@/api/base'
import type { ApiResponse, PaginatedResponse } from '@/api/types'
import type { News, NewsQueryParams, CreateNewsDTO, UpdateNewsDTO } from '../../types'

export class NewsApi extends BaseApi {
  constructor() {
    super({ prefix: '/news' })
  }

  // 获取新闻列表
  async getList(params?: NewsQueryParams): Promise<PaginatedResponse<News>> {
    const response = await this.get<News[]>('', params)
    return {
      ...response,
      data: response.data,
      pagination: response.pagination || {
        total: 0,
        page: 1,
        limit: 10,
      },
    }
  }

  // 获取新闻详情
  async getDetail(id: string): Promise<ApiResponse<News>> {
    return await this.get<News>(`/${id}`)
  }

  // 创建新闻
  async create(data: CreateNewsDTO): Promise<ApiResponse<News>> {
    return await this.post<News>('', data)
  }

  // 更新新闻
  async update(id: string, data: UpdateNewsDTO): Promise<ApiResponse<News>> {
    return await this.put<News>(`/${id}`, data)
  }

  // 删除新闻
  async delete(id: string): Promise<ApiResponse<void>> {
    return await this.delete(`/${id}`)
  }

  // 更改新闻状态
  async updateStatus(id: string, status: News['status']): Promise<ApiResponse<News>> {
    return await this.patch<News>(`/${id}/status`, { status })
  }

  // 获取新闻分类
  async getCategories(): Promise<ApiResponse<string[]>> {
    return await this.get<string[]>('/categories')
  }

  // 获取新闻标签
  async getTags(): Promise<ApiResponse<string[]>> {
    return await this.get<string[]>('/tags')
  }
}
