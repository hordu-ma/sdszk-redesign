import type { ResourceCategory } from './resourceCategory'

export interface Resource {
  id: string
  title: string
  description: string
  category: string | ResourceCategory
  type: 'document' | 'video' | 'audio' | 'image' | 'other'
  url: string
  fileSize: number
  mimeType: string
  thumbUrl?: string
  downloadCount: number
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  isPublic: boolean
  author: string
  createdAt: string
  updatedAt: string
}

export interface ResourceQueryParams {
  page?: number
  limit?: number
  category?: string
  type?: string
  keyword?: string
  tags?: string[]
  status?: string
}

export interface CreateResourceDTO extends Partial<Resource> {
  title: string
  category: string
  file: File
}

export interface UpdateResourceDTO extends Partial<CreateResourceDTO> {}

export * from './resourceCategory'
