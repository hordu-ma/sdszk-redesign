import { BaseApi } from '@/api/base'
import type { ApiResponse, PaginatedResponse } from '@/api/types'
import type {
  Resource,
  ResourceQueryParams,
  CreateResourceDTO,
  UpdateResourceDTO,
} from '../../types'
import type { Comment } from '../../types/comment'

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
  async create(data: CreateResourceDTO): Promise<ApiResponse<Resource>> {
    // 使用 FormData 处理文件上传
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value)
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value))
      } else if (value !== undefined) {
        formData.append(key, value.toString())
      }
    })
    return await this.post<Resource>('', formData)
  }

  // 更新资源
  async update(id: string, data: UpdateResourceDTO): Promise<ApiResponse<Resource>> {
    return await this.put<Resource>(`/${id}`, data)
  }

  // 删除资源
  async delete(id: string): Promise<ApiResponse<void>> {
    return await this.delete(`/${id}`)
  }

  // 更改资源状态
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

  // 获取资源评论
  async getComments(
    id: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<Comment>> {
    const response = await this.get<Comment[]>(`/${id}/comments`, params)
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

  // 添加评论
  async addComment(
    id: string,
    data: { content: string; parentId?: string }
  ): Promise<ApiResponse<Comment>> {
    return await this.post<Comment>(`/${id}/comments`, data)
  }

  // 删除评论
  async deleteComment(resourceId: string, commentId: string): Promise<ApiResponse<void>> {
    return await this.delete(`/${resourceId}/comments/${commentId}`)
  }

  // 分享资源
  async share(
    id: string,
    data: { shareType: 'email' | 'link' | 'wechat'; recipientEmail?: string; message?: string }
  ): Promise<ApiResponse<{ shareUrl: string }>> {
    return await this.post<{ shareUrl: string }>(`/${id}/share`, data)
  }
}
