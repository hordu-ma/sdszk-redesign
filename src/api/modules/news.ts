// src/api/modules/news.ts
import { BaseApi } from '../base'

// 定义News类型
export interface News {
  id: string
  title: string
  content: string
  summary?: string
  thumbnail?: string
  category:
    | string
    | {
        id: string
        name: string
        key: string
        color?: string
        icon?: string
      }
  publishDate: string
  expiryDate?: string
  author: string
  createdBy: string
  updatedBy?: string
  source?: {
    name?: string
    url?: string
  }
  importance: number
  tags: string[]
  isPublished: boolean
  viewCount: number
  attachments: Array<{
    name: string
    url: string
    size: number
    type: string
  }>
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
  }
  createdAt: string
  updatedAt: string
  status: 'draft' | 'published' | 'archived'
}

// 定义查询参数接口
export interface NewsQueryParams {
  page?: number
  limit?: number
  category?: string
  keyword?: string
  tag?: string
  status?: string
  startDate?: string
  endDate?: string
  isPublished?: boolean
  importance?: number
}

// 定义创建新闻DTO
export interface CreateNewsDTO {
  title: string
  content: string
  summary?: string
  thumbnail?: string
  category: string
  publishDate?: string
  expiryDate?: string
  author: string
  source?: {
    name?: string
    url?: string
  }
  importance?: number
  tags?: string[]
  isPublished?: boolean
  attachments?: Array<{
    name: string
    url: string
    size: number
    type: string
  }>
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
  }
}

// 定义更新新闻DTO
export interface UpdateNewsDTO {
  title?: string
  content?: string
  summary?: string
  thumbnail?: string
  category?: string
  publishDate?: string
  expiryDate?: string
  author?: string
  source?: {
    name?: string
    url?: string
  }
  importance?: number
  tags?: string[]
  isPublished?: boolean
  attachments?: Array<{
    name: string
    url: string
    size: number
    type: string
  }>
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
  }
}

// NewsApi 类
export class NewsApi extends BaseApi {
  constructor() {
    super('/news')
  }

  // 获取新闻列表
  getList(params?: NewsQueryParams) {
    return this.get<News[]>('', { params })
  }

  // 获取新闻详情
  getDetail(id: string) {
    return this.get<News>(`/${id}`)
  }

  // 创建新闻
  create(data: CreateNewsDTO) {
    return this.post<News>('', data)
  }

  // 更新新闻
  update(id: string, data: UpdateNewsDTO) {
    return this.put<News>(`/${id}`, data)
  }

  // 删除新闻
  deleteNews(id: string) {
    return this.delete(`/${id}`)
  }

  // 更新新闻状态
  updateStatus(id: string, status: News['status']) {
    return this.patch<News>(`/${id}/status`, { status })
  }

  // 获取分类列表
  getCategories() {
    return this.get<string[]>('/categories')
  }

  // 获取标签列表
  getTags() {
    return this.get<string[]>('/tags')
  }
}
