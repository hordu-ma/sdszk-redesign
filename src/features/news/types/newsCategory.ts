export interface NewsCategory {
  _id: string
  name: string
  key: string
  description: string
  order: number
  color: string
  icon?: string
  isActive: boolean
  isCore: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateNewsCategoryDTO {
  name: string
  key: string
  description?: string
  color?: string
  icon?: string
  order?: number
}

export interface UpdateNewsCategoryDTO extends Partial<CreateNewsCategoryDTO> {
  isActive?: boolean
}
