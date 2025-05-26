// favorite.ts - 收藏功能API
import { BaseApi } from '../base'
import type { ApiResponse } from '../types'

// 收藏项目接口
export interface FavoriteItem {
  _id: string
  user: string
  itemType: 'news' | 'resource'
  itemId: {
    _id: string
    title: string
    description?: string
    image?: string
    status: string
    createdAt: string
  }
  category: string
  tags: string[]
  notes?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// 添加收藏请求接口
export interface AddFavoriteRequest {
  itemType: 'news' | 'resource'
  itemId: string
  category?: string
  tags?: string[]
  notes?: string
  isPublic?: boolean
}

// 收藏列表查询参数接口
export interface FavoriteQueryParams {
  itemType?: 'news' | 'resource'
  category?: string
  page?: number
  limit?: number
  sort?: string
}

// 收藏统计接口
export interface FavoriteStats {
  total: number
  byType: Array<{
    _id: string
    count: number
    categories: string[]
  }>
  byCategory: Array<{
    _id: string
    count: number
  }>
}

// 收藏API类
export class FavoriteApi extends BaseApi {
  // 添加收藏
  addFavorite(data: AddFavoriteRequest): Promise<ApiResponse<{ favorite: FavoriteItem }>> {
    return this.post('/api/favorites', data)
  }

  // 移除收藏
  removeFavorite(itemType: string, itemId: string): Promise<ApiResponse<void>> {
    return this.delete(`/api/favorites/${itemType}/${itemId}`)
  }

  // 检查是否已收藏
  checkFavorite(itemType: string, itemId: string): Promise<ApiResponse<{ isFavorited: boolean }>> {
    return this.get(`/api/favorites/check/${itemType}/${itemId}`)
  }

  // 获取收藏列表
  getFavorites(params?: FavoriteQueryParams): Promise<
    ApiResponse<{
      favorites: FavoriteItem[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>
  > {
    return this.get('/api/favorites', { params })
  }

  // 获取收藏统计
  getFavoriteStats(): Promise<ApiResponse<FavoriteStats>> {
    return this.get('/api/favorites/stats')
  }

  // 更新收藏分类
  updateFavoriteCategory(
    id: string,
    category: string
  ): Promise<ApiResponse<{ favorite: FavoriteItem }>> {
    return this.patch(`/api/favorites/${id}/category`, { category })
  }

  // 批量更新收藏分类
  batchUpdateCategory(
    favoriteIds: string[],
    category: string
  ): Promise<ApiResponse<{ modifiedCount: number }>> {
    return this.patch('/api/favorites/batch/category', { favoriteIds, category })
  }

  // 批量删除收藏
  batchDeleteFavorites(favoriteIds: string[]): Promise<ApiResponse<{ deletedCount: number }>> {
    return this.request<{ deletedCount: number }>({
      method: 'DELETE',
      url: '/api/favorites/batch',
      data: { favoriteIds },
    })
  }

  // 添加收藏标签
  addFavoriteTag(id: string, tag: string): Promise<ApiResponse<{ favorite: FavoriteItem }>> {
    return this.post(`/api/favorites/${id}/tags`, { tag })
  }

  // 移除收藏标签
  removeFavoriteTag(id: string, tag: string): Promise<ApiResponse<{ favorite: FavoriteItem }>> {
    return this.request<{ favorite: FavoriteItem }>({
      method: 'DELETE',
      url: `/api/favorites/${id}/tags`,
      data: { tag },
    })
  }
}

// 导出收藏API实例
export const favoriteApi = new FavoriteApi()
