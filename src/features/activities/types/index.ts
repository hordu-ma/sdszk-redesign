import type { BaseEntityType } from '@/types'

export interface ActivitySpeaker {
  name: string
  title?: string
  organization?: string
  bio?: string
  avatar?: string
}

export interface ActivityAgendaItem {
  time: string
  title: string
  description?: string
  speaker?: string
}

export interface ActivityLocation {
  name: string
  address?: string
  coordinates?: {
    longitude: number
    latitude: number
  }
  isOnline: boolean
  onlineUrl?: string
}

export interface ActivityOrganizer {
  name: string
  logo?: string
  description?: string
  contact?: string
}

export interface ActivityImage {
  url: string
  caption?: string
}

export interface ActivityAttachment {
  name: string
  url: string
  size: number
  type: string
}

export type ActivityCategory =
  | 'conference'
  | 'seminar'
  | 'workshop'
  | 'competition'
  | 'lecture'
  | 'other'
export type ActivityStatus = 'upcoming' | 'ongoing' | 'completed' | 'canceled' | 'postponed'

export interface Activity extends Record<string, unknown> {
  id: string
  title: string
  description: string
  summary?: string
  poster?: string
  startDate: string
  endDate: string
  location: ActivityLocation
  organizer: ActivityOrganizer
  coOrganizers?: Array<Pick<ActivityOrganizer, 'name' | 'logo'>>
  category: ActivityCategory
  status: ActivityStatus
  registrationRequired: boolean
  registrationDeadline?: string
  registrationUrl?: string
  maxAttendees?: number
  currentAttendees: number
  tags?: string[]
  attachments?: ActivityAttachment[]
  images?: ActivityImage[]
  agenda?: ActivityAgendaItem[]
  speakers?: ActivitySpeaker[]
  isPublished: boolean
  isFeatured: boolean
  viewCount: number
  createdBy: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
}

// 提取基本活动数据类型
export type ActivityBasicData = Omit<
  Activity,
  '_id' | 'viewCount' | 'currentAttendees' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'
>

// 包含文件上传的活动创建 DTO
export interface CreateActivityDTO
  extends Omit<ActivityBasicData, 'poster' | 'id'>,
    Record<string, unknown> {
  title: string
  description: string
  startDate: string
  endDate: string
  location: ActivityLocation
  organizer: ActivityOrganizer
  category: ActivityCategory
  files?: File[]
  poster?: File | string // 可以是 File 对象或者已上传的图片 URL
}

export interface UpdateActivityDTO
  extends Partial<Omit<ActivityBasicData, 'poster'>>,
    Record<string, unknown> {
  id: string
  files?: File[]
  poster?: File | string // 可以是 File 对象或者已上传的图片 URL
}

export interface ActivityQueryParams extends Record<string, unknown> {
  category?: ActivityCategory
  status?: ActivityStatus
  search?: string
  page?: number
  limit?: number
  upcoming?: boolean
  featured?: boolean
  registrationOpen?: boolean
  startDate?: string
  endDate?: string
  [key: string]: unknown
}
