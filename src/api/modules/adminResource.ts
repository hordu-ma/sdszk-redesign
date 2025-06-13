import { BaseApi } from '../base'
import type { ApiResponse, QueryParams, PaginatedResponse } from '../types'

// 资源表单数据接口
export interface ResourceFormData {
  title: string
  description: string
  summary?: string
  categoryId: string
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
  type?: 'document' | 'video' | 'image' | 'audio' | 'other'
  publishDate?: string
  accessLevel?: 'public' | 'login' | 'vip'
  allowDownload?: boolean
  allowComment?: boolean
  sortOrder?: number
  tags?: string[]
  status: 'draft' | 'published' | 'archived'
  isTop?: boolean
  isFeatured?: boolean
  downloadPermission: 'public' | 'login' | 'vip'
}

// 资源列表项接口
export interface ResourceItem {
  id: string
  title: string
  description: string
  summary?: string
  categoryId: string
  categoryName: string
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
  type?: 'document' | 'video' | 'image' | 'audio' | 'other'
  publishDate?: string
  accessLevel?: 'public' | 'login' | 'vip'
  allowDownload?: boolean
  allowComment?: boolean
  sortOrder?: number
  viewCount?: number
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  isTop: boolean
  isFeatured: boolean
  downloadCount: number
  downloadPermission: 'public' | 'login' | 'vip'
  author?: {
    id: string
    username: string
    name: string
  }
  uploader: {
    id: string
    username: string
  }
  createdAt: string
  updatedAt: string
}

// 资源查询参数接口
export interface ResourceQueryParams extends QueryParams {
  keyword?: string
  categoryId?: string
  status?: 'draft' | 'published' | 'archived'
  fileType?: string
  isTop?: boolean
  isFeatured?: boolean
  downloadPermission?: 'public' | 'login' | 'vip'
  startDate?: string
  endDate?: string
}

// 资源 API 类
export class AdminResourceApi extends BaseApi {
  constructor() {
    super('/admin/resources')
  }

  // 获取资源列表
  getList(params?: ResourceQueryParams): Promise<ApiResponse<PaginatedResponse<ResourceItem>>> {
    return this.get('', { params })
  }

  // 获取资源详情
  getDetail(id: string): Promise<ApiResponse<ResourceItem>> {
    return this.get(`/${id}`)
  }

  // 创建资源
  create(data: ResourceFormData): Promise<ApiResponse<ResourceItem>> {
    return this.post('', data)
  }

  // 更新资源
  update(id: string, data: Partial<ResourceFormData>): Promise<ApiResponse<ResourceItem>> {
    return this.put(`/${id}`, data)
  }

  // 删除资源
  deleteResource(id: string): Promise<ApiResponse<void>> {
    return this.delete(`/${id}`)
  }

  // 批量删除资源
  batchDelete(ids: string[]): Promise<ApiResponse<void>> {
    return this.post('/batch-delete', { ids })
  }

  // 发布/取消发布资源
  togglePublish(id: string): Promise<ApiResponse<ResourceItem>> {
    return this.patch(`/${id}/toggle-publish`)
  }

  // 置顶/取消置顶资源
  toggleTop(id: string): Promise<ApiResponse<ResourceItem>> {
    return this.patch(`/${id}/toggle-top`)
  }

  // 设置/取消精选资源
  toggleFeatured(id: string): Promise<ApiResponse<ResourceItem>> {
    return this.patch(`/${id}/toggle-featured`)
  }

  // 更新资源状态
  updateStatus(
    id: string,
    status: 'draft' | 'published' | 'archived'
  ): Promise<ApiResponse<ResourceItem>> {
    return this.patch(`/${id}/status`, { status })
  }

  // 批量更新资源状态
  batchUpdateStatus(
    ids: string[],
    status: 'draft' | 'published' | 'archived'
  ): Promise<ApiResponse<void>> {
    return this.post('/batch-status', { ids, status })
  }

  // 上传文件
  upload(
    formData: FormData,
    onProgress?: (progressEvent: any) => void
  ): Promise<ApiResponse<{ fileUrl: string; fileName: string; fileSize: number }>> {
    return this.request<{ fileUrl: string; fileName: string; fileSize: number }>({
      method: 'POST',
      url: '/upload/resource',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    })
  }
}

// 导出单例
export const adminResourceApi = new AdminResourceApi()
