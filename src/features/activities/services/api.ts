import { BaseApi } from '@/api/base'
import type { ApiResponse } from '@/api/types'
import type { Activity, CreateActivityDTO, UpdateActivityDTO, ActivityQueryParams } from '../types'

export type { Activity, CreateActivityDTO, UpdateActivityDTO, ActivityQueryParams }

export class ActivityApi extends BaseApi {
  constructor() {
    super({ prefix: '/activities' })
  }

  // 获取活动列表
  async getList(params?: ActivityQueryParams): Promise<ApiResponse<Activity[]>> {
    return await this.get<Activity[]>('', params)
  }

  // 获取活动详情
  async getDetail(id: string): Promise<ApiResponse<Activity>> {
    return await this.get<Activity>(`/${id}`)
  }

  // 创建活动
  async create(data: CreateActivityDTO): Promise<ApiResponse<Activity>> {
    return await this.post<Activity>('', data)
  }

  // 更新活动
  async update(id: string, data: UpdateActivityDTO): Promise<ApiResponse<Activity>> {
    return await this.put<Activity>(`/${id}`, data)
  }

  // 删除活动
  async deleteActivity(id: string): Promise<ApiResponse<void>> {
    return await this.request<void>({
      method: 'DELETE',
      url: `/${id}`,
    })
  }

  // 切换发布状态
  async togglePublishStatus(id: string): Promise<ApiResponse<Activity>> {
    return await this.patch<Activity>(`/${id}/publish`)
  }

  // 切换推荐状态
  async toggleFeaturedStatus(id: string): Promise<ApiResponse<Activity>> {
    return await this.patch<Activity>(`/${id}/featured`)
  }

  // 获取即将开始的活动
  async getUpcomingActivities(params?: { limit?: number }): Promise<ApiResponse<Activity[]>> {
    return await this.get<Activity[]>('/upcoming', params)
  }
}
