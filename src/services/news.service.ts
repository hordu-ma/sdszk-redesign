import { BaseService } from './base.service'

export enum NewsCategory {
  Notice = 'notice',
  News = 'news',
  Activity = 'activity',
}

export interface News {
  _id: string
  title: string
  content: string
  category: NewsCategory
  cover?: string
  isPublished?: boolean
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export interface NewsQuery {
  category?: NewsCategory | ''
  keyword?: string
  isPublished?: boolean
  page?: number
  limit?: number
}

export class NewsService extends BaseService<News> {
  constructor() {
    super('/api/news', true)
  }

  async getList(params: NewsQuery & { page?: number; limit?: number }) {
    return this.getAll(params)
  }

  async getById(id: string) {
    return this.get(id)
  }

  async togglePublish(id: string) {
    const { data } = await this.get(id)
    return this.update(id, {
      isPublished: !data.isPublished,
    })
  }

  async getByCategory(category: NewsCategory) {
    return this.getAll({ category })
  }

  async search(keyword: string) {
    return this.getAll({ keyword })
  }
}
