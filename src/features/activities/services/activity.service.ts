import { BaseService } from '@/services/base.service'
import type { ApiResponse } from '@/api/types'
import type { Activity, ActivityQueryParams, CreateActivityDTO, UpdateActivityDTO } from '../types'
import { activityApi } from '@/api'

export { Activity, ActivityQueryParams, CreateActivityDTO, UpdateActivityDTO }

export class ActivityService extends BaseService<Activity> {
  constructor() {
    super('activities', true)
  }

  // 获取活动列表
  async getList(params?: ActivityQueryParams) {
    const cacheKey = 'list'
    if (this.useCache) {
      const cached = this.getCached(cacheKey, params)
      if (cached) return cached
    }

    const response = await activityApi.getList(params)
    if (this.useCache) {
      this.cacheResponse(cacheKey, response, params)
    }
    return response
  }

  // 获取活动详情
  async getDetail(id: string): Promise<ApiResponse<Activity>> {
    const cacheKey = `detail:${id}`
    if (this.useCache) {
      const cached = this.getCached<ApiResponse<Activity>>(cacheKey)
      if (cached) return cached
    }

    const response = await activityApi.getDetail(id)
    if (this.useCache) {
      this.cacheResponse(cacheKey, response)
    }
    return response
  }

  // 创建活动
  async create(data: Partial<Activity> | FormData): Promise<ApiResponse<Activity>> {
    const response = await activityApi.create(data as CreateActivityDTO)
    if (this.useCache) {
      this.clearCache()
    }
    return response
  }

  // 更新活动
  async update(id: string | number, data: Partial<Activity>): Promise<ApiResponse<Activity>> {
    const response = await activityApi.update(id.toString(), data as UpdateActivityDTO)
    if (this.useCache) {
      this.clearCache()
      this.deleteCached(`detail:${id}`)
    }
    return response
  }

  // 删除活动
  async delete(id: string | number): Promise<ApiResponse<void>> {
    const response = await activityApi.deleteActivity(id.toString())
    if (this.useCache) {
      this.clearCache()
      this.deleteCached(`detail:${id}`)
    }
    return response
  }

  // 切换发布状态
  async togglePublishStatus(id: string) {
    const response = await activityApi.togglePublishStatus(id)
    if (this.useCache) {
      this.clearCache()
      this.deleteCached(`detail:${id}`)
    }
    return response
  }

  // 切换推荐状态
  async toggleFeaturedStatus(id: string) {
    const response = await activityApi.toggleFeaturedStatus(id)
    if (this.useCache) {
      this.clearCache()
      this.deleteCached(`detail:${id}`)
    }
    return response
  }

  // 获取即将开始的活动
  async getUpcoming(limit?: number) {
    const cacheKey = 'upcoming'
    if (this.useCache) {
      const cached = this.getCached<ApiResponse<Activity[]>>(cacheKey, { limit })
      if (cached) return cached
    }

    const response = await activityApi.getUpcomingActivities({ limit })
    if (this.useCache) {
      this.cacheResponse(cacheKey, response, { limit })
    }
    return response
  }
}
