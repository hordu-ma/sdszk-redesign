import { BaseService } from './base.service'
import type { AxiosProgressEvent } from 'axios'
import api from '../utils/api'

export enum ResourceType {
  Document = 'document',
  Video = 'video',
  Image = 'image',
  Other = 'other',
}

export enum ResourceCategory {
  Course = 'course',
  Teaching = 'teaching',
  Training = 'training',
  Research = 'research',
  Other = 'other',
}

export enum ResourceStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export interface ResourceQuery {
  category?: ResourceCategory | ''
  type?: ResourceType | ''
  keyword?: string
  status?: ResourceStatus | ''
  tags?: string[]
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface Resource {
  _id: string
  title: string
  description?: string
  type: ResourceType
  category: ResourceCategory
  fileUrl: string
  fileName: string
  fileSize: number
  downloadCount: number
  status: ResourceStatus
  tags?: string[]
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export class ResourceService extends BaseService<Resource> {
  constructor() {
    super('/api/resources', true) // 启用缓存
  }

  async getList(params?: ResourceQuery) {
    return this.getAll(params)
  }

  async getById(id: string) {
    return this.get(id)
  }

  async upload(
    file: File,
    data: Partial<Resource>,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
  ) {
    const formData = new FormData()
    formData.append('file', file)
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value))
      }
    })

    return this.create(formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    })
  }

  async download(id: string) {
    const response = await api.get(`${this.endpoint}/${id}/download`, {
      responseType: 'blob',
    })
    await this.incrementDownloads(id)
    return response
  }

  async getByCategory(category: ResourceCategory, params?: Omit<ResourceQuery, 'category'>) {
    return this.getList({ ...params, category })
  }

  async getByType(type: ResourceType, params?: Omit<ResourceQuery, 'type'>) {
    return this.getList({ ...params, type })
  }

  async search(keyword: string, params?: Omit<ResourceQuery, 'keyword'>) {
    return this.getList({ ...params, keyword })
  }

  async incrementDownloads(id: string) {
    return api.post(`${this.endpoint}/${id}/downloads`)
  }

  async batchDelete(ids: string[]) {
    return api.post(`${this.endpoint}/batch-delete`, { ids })
  }

  async batchUpdateStatus(ids: string[], status: ResourceStatus) {
    return api.post(`${this.endpoint}/batch-update-status`, { ids, status })
  }

  async updateTags(id: string, tags: string[]) {
    return this.update(id, { tags })
  }
}
