import { api } from '../base'
import type { ApiResponse, PaginatedResponse } from '../types'

// 分页参数接口
export interface PaginationParams {
  page?: number
  limit?: number
}

// 新闻表单数据接口
export interface NewsFormData {
  title: string
  content: string
  summary?: string
  categoryId: number
  featuredImage?: string
  tags?: string[]
  status: 'draft' | 'published' | 'archived'
  isTop?: boolean
  isFeatured?: boolean
  publishTime?: string
}

// 新闻列表项接口
export interface NewsItem {
  id: number
  title: string
  summary: string
  content: string
  categoryId: number
  categoryName: string
  featuredImage?: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  isTop: boolean
  isFeatured: boolean
  views: number
  author: {
    id: number
    username: string
  }
  publishTime: string
  createdAt: string
  updatedAt: string
}

// 新闻查询参数接口
export interface NewsQueryParams extends PaginationParams {
  keyword?: string
  categoryId?: number
  status?: 'draft' | 'published' | 'archived'
  isTop?: boolean
  isFeatured?: boolean
  startDate?: string
  endDate?: string
}

export const adminNewsApi = {
  // 获取新闻列表
  getList(params?: NewsQueryParams): Promise<ApiResponse<PaginatedResponse<NewsItem>>> {
    return api.get('/admin/news', { params })
  },

  // 获取新闻详情
  getDetail(id: number): Promise<ApiResponse<NewsItem>> {
    return api.get(`/admin/news/${id}`)
  },

  // 创建新闻
  create(data: NewsFormData): Promise<ApiResponse<NewsItem>> {
    return api.post('/admin/news', data)
  },

  // 更新新闻
  update(id: number, data: Partial<NewsFormData>): Promise<ApiResponse<NewsItem>> {
    return api.put(`/admin/news/${id}`, data)
  },

  // 删除新闻
  delete(id: number): Promise<ApiResponse<void>> {
    return api.delete(`/admin/news/${id}`)
  },

  // 批量删除新闻
  batchDelete(ids: number[]): Promise<ApiResponse<void>> {
    return api.post('/admin/news/batch-delete', { ids })
  },

  // 发布/取消发布新闻
  togglePublish(id: number): Promise<ApiResponse<NewsItem>> {
    return api.patch(`/admin/news/${id}/toggle-publish`)
  },

  // 置顶/取消置顶新闻
  toggleTop(id: number): Promise<ApiResponse<NewsItem>> {
    return api.patch(`/admin/news/${id}/toggle-top`)
  },

  // 设置/取消精选新闻
  toggleFeatured(id: number): Promise<ApiResponse<NewsItem>> {
    return api.patch(`/admin/news/${id}/toggle-featured`)
  },
}
