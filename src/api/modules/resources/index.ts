import type { ApiResponse, PaginatedResponse, QueryParams } from '../../types'
import { BaseApi } from '../../base'

export interface Resource {
  id: string
  title: string
  description?: string
  type: 'document' | 'video' | 'image' | 'audio' | 'other'
  category?: string
  url: string
  fileSize?: number
  mimeType?: string
  downloadCount?: number
  status: 'active' | 'inactive'
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateResourceDTO extends Partial<Resource> {
  title: string
  type: Resource['type']
  url: string
}

export interface UpdateResourceDTO extends Partial<Resource> {}

export interface ResourceQueryParams extends QueryParams {
  type?: string
  category?: string
  status?: string
  tag?: string
}

export class ResourceApi extends BaseApi {
  constructor() {
    super({ prefix: '/resources' })
  }

  // 获取资源列表
  async getList(params?: ResourceQueryParams): Promise<PaginatedResponse<Resource>> {
    const response = await this.get<Resource[]>('', params)
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

  // 获取资源详情
  async getDetail(id: string): Promise<ApiResponse<Resource>> {
    return await this.get<Resource>(`/${id}`)
  }

  // 创建资源
  async create(data: CreateResourceDTO | FormData): Promise<ApiResponse<Resource>> {
    return await this.post<Resource>('', data)
  }

  // 更新资源
  async update(id: string, data: UpdateResourceDTO): Promise<ApiResponse<Resource>> {
    return await this.put<Resource>(`/${id}`, data)
  }

  // 删除资源
  async delete(id: string): Promise<ApiResponse<void>> {
    return this.delete(`/${id}`)
  }

  // 更新资源状态
  async updateStatus(id: string, status: Resource['status']): Promise<ApiResponse<Resource>> {
    return await this.patch<Resource>(`/${id}/status`, { status })
  }

  // 获取资源分类
  async getCategories(): Promise<ApiResponse<string[]>> {
    return await this.get<string[]>('/categories')
  }

  // 获取资源标签
  async getTags(): Promise<ApiResponse<string[]>> {
    return await this.get<string[]>('/tags')
  }

  // 批量删除资源
  async batchDelete(ids: string[]): Promise<ApiResponse<void>> {
    return await this.post<void>('/batch-delete', { ids })
  }

  // 批量更新资源状态
  async batchUpdateStatus(
    ids: string[],
    status: Resource['status']
  ): Promise<ApiResponse<Resource[]>> {
    return await this.post<Resource[]>('/batch-status', { ids, status })
  }

  // 更新资源标签
  async updateTags(id: string, tags: string[]): Promise<ApiResponse<Resource>> {
    return await this.patch<Resource>(`/${id}/tags`, { tags })
  }

  // 下载资源
  async download(id: string): Promise<Blob> {
    const response = await this.api.get(`${this.prefix}/${id}/download`, {
      responseType: 'blob',
    })
    return response.data
  }
}
