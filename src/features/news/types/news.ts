import type { BaseEntityType, BaseQueryParams } from '@/types'
import type { NewsCategory } from '@/api/modules/newsCategory'

export interface News extends BaseEntityType {
  title: string
  content: string
  summary?: string
  category: string | NewsCategory
  categoryId?: string
  categoryKey?: string
  thumbnail?: string
  publishDate: string
  expiryDate?: string
  author: string
  source?: {
    name?: string
    url?: string
  }
  importance: number
  tags: string[]
  isPublished: boolean
  viewCount: number
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
  status: 'draft' | 'published' | 'archived'
}

export interface NewsQueryParams extends BaseQueryParams {
  category?: string
  status?: string
  tag?: string
  startDate?: string
  endDate?: string
  isPublished?: boolean
  importance?: number
}

export interface CreateNewsDTO {
  title: string
  content: string
  summary?: string
  thumbnail?: string
  category: string
  categoryId: string
  categoryKey?: string
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

export interface UpdateNewsDTO
  extends Partial<Omit<CreateNewsDTO, 'title' | 'content' | 'category' | 'categoryId'>> {
  title?: string
  content?: string
  category?: string
  categoryId?: string
  status?: News['status']
}
