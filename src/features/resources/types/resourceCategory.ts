export interface ResourceCategory {
  _id: string
  name: string
  description?: string
  order: number
  isActive: boolean
  resourceCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateResourceCategoryDTO {
  name: string
  description?: string
  order?: number
}

export interface UpdateResourceCategoryDTO extends Partial<CreateResourceCategoryDTO> {
  isActive?: boolean
}
