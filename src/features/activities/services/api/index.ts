import { BaseApi } from '@/api/base'
import type { ApiResponse, PaginatedResponse } from '@/api/types'
import type {
  Activity,
  ActivityQueryParams,
  CreateActivityDTO,
  UpdateActivityDTO,
} from '../../types'

export class ActivityApi extends BaseApi {
  constructor() {
    super({ prefix: '/activities' })
  }

  // 获取活动列表
  async getList(params?: ActivityQueryParams): Promise<PaginatedResponse<Activity>> {
    const response = await this.get<Activity[]>('', params)
    return {
      ...response,
      data: response.data,
      pagination: response.pagination || {
        total: 0,
        page: 1,
        limit: 10,
      },
    }
  }

  // 获取活动详情
  async getDetail(id: string): Promise<ApiResponse<Activity>> {
    return await this.get<Activity>(`/${id}`)
  }

  // 创建活动
  async create(data: CreateActivityDTO): Promise<ApiResponse<Activity>> {
    // 处理文件上传
    const formData = this.createFormDataWithFiles(data)

    if (formData) {
      return await this.post<Activity>('', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }

    return await this.post<Activity>('', data)
  }

  // 更新活动
  async update(id: string, data: UpdateActivityDTO): Promise<ApiResponse<Activity>> {
    // 处理文件上传
    const formData = this.createFormDataWithFiles(data)

    if (formData) {
      return await this.put<Activity>(`/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }

    return await this.put<Activity>(`/${id}`, data)
  }

  // 删除活动
  async deleteActivity(id: string): Promise<ApiResponse<void>> {
    return await this.delete(`/${id}`)
  }

  // 更改发布状态
  async togglePublishStatus(id: string): Promise<ApiResponse<Activity>> {
    return await this.patch<Activity>(`/${id}/publish`)
  }

  // 更改推荐状态
  async toggleFeaturedStatus(id: string): Promise<ApiResponse<Activity>> {
    return await this.patch<Activity>(`/${id}/featured`)
  }

  // 获取即将开始的活动
  async getUpcomingActivities(params?: { limit?: number }): Promise<ApiResponse<Activity[]>> {
    return await this.get<Activity[]>('/upcoming', params)
  }

  // 删除附件
  async deleteAttachment(activityId: string, attachmentId: string): Promise<ApiResponse<void>> {
    return await this.delete(`/${activityId}/attachments/${attachmentId}`)
  }

  // 处理文件上传的辅助方法
  private createFormDataWithFiles(data: CreateActivityDTO | UpdateActivityDTO): FormData | null {
    // 如果没有文件需要上传，返回 null
    if (!data.files?.length && !(data.poster instanceof File)) {
      return null
    }

    const formData = new FormData()

    // 添加基本数据
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'files' && key !== 'poster' && value !== undefined) {
        if (typeof value === 'object' && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value))
        } else if (typeof value !== 'object' || value instanceof File) {
          formData.append(key, value as string | Blob)
        }
      }
    })

    // 添加海报文件
    if (data.poster instanceof File) {
      formData.append('poster', data.poster)
    }

    // 添加附件文件
    if (data.files?.length) {
      data.files.forEach(file => {
        formData.append('files', file)
      })
    }

    return formData
  }
}
