import { BaseService } from './base.service'
import type { ApiResponse } from './api.types'
import type {
  NewsCategory,
  CreateNewsCategoryDTO,
  UpdateNewsCategoryDTO,
} from '@/api/modules/newsCategory'
import { NewsCategoryApi } from '@/api/modules/newsCategory'
import {
  NewsCategoryError,
  CoreCategoryError,
  DuplicateCategoryError,
  CategoryNotFoundError,
  InvalidCategoryDataError,
} from './errors/newsCategory.errors'

const newsCategoryApi = new NewsCategoryApi()

export {
  NewsCategory,
  CreateNewsCategoryDTO,
  UpdateNewsCategoryDTO,
  NewsCategoryError,
  CoreCategoryError,
  DuplicateCategoryError,
  CategoryNotFoundError,
  InvalidCategoryDataError,
}

export class NewsCategoryService extends BaseService<NewsCategory> {
  constructor() {
    super('newsCategory')
  }

  // 获取分类列表
  async getList(includeInactive = false): Promise<ApiResponse<NewsCategory[]>> {
    const cacheKey = `list:${includeInactive}`
    if (this.useCache) {
      const cached = this.getCached<ApiResponse<NewsCategory[]>>(cacheKey)
      if (cached) return cached
    }

    const response = await newsCategoryApi.getList({ includeInactive })
    if (this.useCache) {
      this.cacheResponse(cacheKey, response)
    }
    return response
  }

  // 获取核心分类
  async getCoreCategories(): Promise<ApiResponse<NewsCategory[]>> {
    const cacheKey = 'core'
    if (this.useCache) {
      const cached = this.getCached<ApiResponse<NewsCategory[]>>(cacheKey)
      if (cached) return cached
    }

    const response = await newsCategoryApi.getCoreCategories()
    if (this.useCache) {
      this.cacheResponse(cacheKey, response)
    }
    return response
  }

  // 创建分类
  async create(data: CreateNewsCategoryDTO): Promise<ApiResponse<NewsCategory>> {
    try {
      this.validateCategoryData(data)
      const response = await newsCategoryApi.create(data)
      if (this.useCache) {
        this.clearCache()
      }
      return response
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          throw new DuplicateCategoryError(data.key)
        }
        if (error.message.includes('validation failed')) {
          throw new InvalidCategoryDataError(error.message)
        }
      }
      throw error
    }
  }

  // 更新分类
  async update(id: string, data: UpdateNewsCategoryDTO): Promise<ApiResponse<NewsCategory>> {
    try {
      const currentCategory = await this.findCategoryById(id)

      if (currentCategory.isCore) {
        // 核心分类不允许修改 key
        if (data.key && data.key !== currentCategory.key) {
          throw new CoreCategoryError('不能修改核心分类的标识符')
        }
        // 核心分类不允许禁用
        if (data.isActive === false) {
          throw new CoreCategoryError('不能禁用核心分类')
        }
      }

      this.validateCategoryData(data, true)
      const response = await newsCategoryApi.update(id, data)
      if (this.useCache) {
        this.clearCache()
      }
      return response
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          throw new DuplicateCategoryError(data.key!)
        }
        if (error.message.includes('not found')) {
          throw new CategoryNotFoundError(id)
        }
      }
      throw error
    }
  }

  // 删除分类
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const category = await this.findCategoryById(id)
      if (category.isCore) {
        throw new CoreCategoryError('不能删除核心分类')
      }

      const response = await newsCategoryApi.delete(id)
      if (this.useCache) {
        this.clearCache()
      }
      return response
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new CategoryNotFoundError(id)
      }
      throw error
    }
  }

  // 更新分类排序
  async updateOrder(categories: { id: string; order: number }[]): Promise<ApiResponse<void>> {
    const response = await newsCategoryApi.updateOrder(categories)
    if (this.useCache) {
      this.clearCache()
    }
    return response
  }

  // 验证分类数据
  private validateCategoryData(data: Partial<CreateNewsCategoryDTO>, isUpdate = false): void {
    if (!isUpdate) {
      if (!data.name) {
        throw new InvalidCategoryDataError('分类名称不能为空')
      }
      if (!data.key) {
        throw new InvalidCategoryDataError('分类标识符不能为空')
      }
    }

    if (data.key && !/^[a-z][a-z0-9-]*$/.test(data.key)) {
      throw new InvalidCategoryDataError(
        '分类标识符只能包含小写字母、数字和连字符，且必须以字母开头'
      )
    }

    if (data.name && (data.name.length < 2 || data.name.length > 50)) {
      throw new InvalidCategoryDataError('分类名称长度应在2-50个字符之间')
    }

    if (data.description && data.description.length > 200) {
      throw new InvalidCategoryDataError('分类描述不能超过200个字符')
    }

    if (data.order !== undefined && (data.order < 0 || data.order > 999)) {
      throw new InvalidCategoryDataError('排序值必须在0-999之间')
    }
  }

  // 查找分类
  private async findCategoryById(id: string): Promise<NewsCategory> {
    try {
      const response = await newsCategoryApi.getById(id)
      return response.data
    } catch (error) {
      throw new CategoryNotFoundError(id)
    }
  }
}
