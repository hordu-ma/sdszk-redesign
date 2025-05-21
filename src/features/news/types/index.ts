import type { NewsCategory } from './newsCategory'

export interface News {
  id: string
  title: string
  content: string
  summary?: string
  cover?: string
  category: string | NewsCategory
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
  status: 'draft' | 'published' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface NewsQueryParams {
  page?: number
  limit?: number
  category?: string
  keyword?: string
  tag?: string
  status?: string
  startDate?: string
  endDate?: string
}

export interface CreateNewsDTO extends Partial<News> {
  title: string
  content: string
  category: string
}

export interface UpdateNewsDTO extends Partial<CreateNewsDTO> {}

export * from './newsCategory'
