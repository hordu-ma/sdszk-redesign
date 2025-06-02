// viewHistory.ts - 浏览历史相关API
import { BaseApi } from '../base'
import type { ApiResponse } from '../types'

// 浏览历史记录接口
export interface ViewHistory {
  _id: string
  userId: string
  resourceType: 'news' | 'resource' | 'activity'
  resourceId: string
  resourceTitle: string
  resourceUrl: string
  viewDuration: number
  device: {
    type: string
    os: string
    browser: string
  }
  location?: {
    ip: string
    country: string
    region: string
    city: string
  }
  createdAt: string
  updatedAt: string
}

// 浏览历史统计接口
export interface HistoryStats {
  totalViews: number
  todayViews: number
  weekViews: number
  monthViews: number
  avgDuration: number
  mostViewedType: string
  mostActiveHour: number
}

// 热门内容接口
export interface PopularContent {
  _id: string
  title: string
  type: 'news' | 'resource' | 'activity'
  url: string
  viewCount: number
  avgDuration: number
  thumbnail?: string
}

// 推荐内容接口
export interface RecommendedContent {
  _id: string
  title: string
  type: 'news' | 'resource' | 'activity'
  url: string
  score: number
  reason: string
  thumbnail?: string
}

// 浏览历史查询参数
export interface ViewHistoryParams {
  page?: number
  limit?: number
  resourceType?: 'news' | 'resource' | 'activity'
  startDate?: string
  endDate?: string
  keyword?: string
}

// 浏览历史API类
export class ViewHistoryApi extends BaseApi {
  // 记录浏览历史
  recordView(data: {
    resourceType: 'news' | 'resource' | 'activity'
    resourceId: string
    resourceTitle: string
    resourceUrl: string
    viewDuration?: number
  }): Promise<ApiResponse<ViewHistory>> {
    return this.post('/view-history/record', data)
  }

  // 更新浏览时长
  updateViewDuration(historyId: string, duration: number): Promise<ApiResponse<ViewHistory>> {
    return this.patch(`/view-history/${historyId}/duration`, { duration })
  }

  // 获取浏览历史列表
  getViewHistory(params?: ViewHistoryParams): Promise<
    ApiResponse<{
      histories: ViewHistory[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>
  > {
    return this.get('/view-history', { params })
  }

  // 获取浏览历史统计
  getHistoryStats(params?: { days?: number }): Promise<ApiResponse<HistoryStats>> {
    return this.get('/view-history/stats', { params })
  }

  // 获取热门内容
  getPopularContent(params?: {
    limit?: number
    days?: number
    resourceType?: 'news' | 'resource' | 'activity'
  }): Promise<ApiResponse<PopularContent[]>> {
    return this.get('/view-history/popular', { params })
  }

  // 获取推荐内容
  getRecommendedContent(params?: { limit?: number }): Promise<ApiResponse<RecommendedContent[]>> {
    return this.get('/view-history/recommendations', { params })
  }

  // 删除指定浏览历史
  deleteViewHistory(historyId: string): Promise<ApiResponse<void>> {
    return this.delete(`/view-history/${historyId}`)
  }

  // 批量删除浏览历史
  batchDeleteHistory(historyIds: string[]): Promise<ApiResponse<void>> {
    return this.request<void>({
      method: 'DELETE',
      url: '/view-history/batch',
      data: { historyIds },
    })
  }

  // 清空浏览历史
  clearAllHistory(): Promise<ApiResponse<void>> {
    return this.delete('/view-history/clear')
  }

  // 导出浏览历史
  async exportHistory(params?: {
    format?: 'json' | 'csv' | 'excel'
    startDate?: string
    endDate?: string
    resourceType?: 'news' | 'resource' | 'activity'
  }): Promise<Blob> {
    const response = await this.request<Blob>({
      method: 'GET',
      url: '/view-history/export',
      params,
      responseType: 'blob',
    })

    if (response.success && response.data) {
      return response.data as unknown as Blob
    }

    throw new Error('导出失败')
  }
}

// 导出浏览历史API实例
export const viewHistoryApi = new ViewHistoryApi()
