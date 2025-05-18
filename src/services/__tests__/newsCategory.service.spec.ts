import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  NewsCategoryService,
  NewsCategory,
  CreateNewsCategoryDTO,
  UpdateNewsCategoryDTO,
} from '../newsCategory.service'
import { CategoryNotFoundError } from '../errors/newsCategory.errors'
import type { ApiResponse } from '../../api/types'

// 创建 mock 分类数据
const mockCategory: NewsCategory = {
  _id: '1',
  name: '中心动态',
  key: 'center',
  description: '中心动态描述',
  order: 1,
  color: '#1890ff',
  isActive: true,
  isCore: true,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
}

// 创建 mock API 函数
const mockGetList = vi.fn()
const mockGetCoreCategories = vi.fn()
const mockGetById = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockUpdateOrder = vi.fn()

// Mock NewsCategoryApi
vi.mock('../../api/modules/newsCategory', () => {
  return {
    NewsCategoryApi: vi.fn().mockImplementation(() => {
      return {
        getList: mockGetList,
        getCoreCategories: mockGetCoreCategories,
        getById: mockGetById,
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        updateOrder: mockUpdateOrder,
      }
    }),
  }
})

describe('NewsCategoryService', () => {
  let service: NewsCategoryService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new NewsCategoryService()
  })

  describe('getList', () => {
    it('应该返回分类列表', async () => {
      const mockCategories = [mockCategory]
      mockGetList.mockResolvedValue({
        success: true,
        data: mockCategories,
      })

      const result = await service.getList()
      expect(result.data).toEqual(mockCategories)
      expect(mockGetList).toHaveBeenCalled()
    })

    it('应该使用缓存当调用多次时', async () => {
      const mockCategories = [mockCategory]
      mockGetList.mockResolvedValue({
        success: true,
        data: mockCategories,
      })

      await service.getList()
      await service.getList() // 第二次调用应该使用缓存

      expect(mockGetList).toHaveBeenCalledTimes(1)
    })

    it('应该在禁用缓存时每次都调用API', async () => {
      const mockCategories = [mockCategory]
      mockGetList.mockResolvedValue({
        success: true,
        data: mockCategories,
      })

      service.toggleCache(false) // 禁用缓存
      await service.getList()
      await service.getList()

      expect(mockGetList).toHaveBeenCalledTimes(2)
    })
  })

  describe('getCoreCategories', () => {
    it('应该返回核心分类列表', async () => {
      const mockCategories = [mockCategory]
      mockGetCoreCategories.mockResolvedValue({
        success: true,
        data: mockCategories,
      })

      const result = await service.getCoreCategories()
      expect(result.data).toEqual(mockCategories)
      expect(mockGetCoreCategories).toHaveBeenCalled()
    })

    it('应该使用缓存当调用多次时', async () => {
      const mockCategories = [mockCategory]
      mockGetCoreCategories.mockResolvedValue({
        success: true,
        data: mockCategories,
      })

      await service.getCoreCategories()
      await service.getCoreCategories()

      expect(mockGetCoreCategories).toHaveBeenCalledTimes(1)
    })
  })

  describe('create', () => {
    it('应该创建新分类', async () => {
      const newCategory: CreateNewsCategoryDTO = {
        name: '新分类',
        key: 'new-category',
        description: '新分类描述',
      }

      const createdCategory = {
        ...newCategory,
        _id: '3',
        order: 3,
        isActive: true,
        isCore: false,
        createdAt: '2023-01-03',
        updatedAt: '2023-01-03',
      }

      mockCreate.mockResolvedValue({
        success: true,
        data: createdCategory,
        message: '创建成功',
      })

      const result = await service.create(newCategory)
      expect(result.data).toEqual(createdCategory)
      expect(mockCreate).toHaveBeenCalledWith(newCategory)
    })

    it('应该在创建新分类后清除缓存', async () => {
      // 先加载列表到缓存
      const mockCategories = [mockCategory]
      mockGetList.mockResolvedValue({
        success: true,
        data: mockCategories,
      })
      await service.getList()

      // 创建新分类
      const newCategory: CreateNewsCategoryDTO = { name: '新分类', key: 'new-category' }
      mockCreate.mockResolvedValue({
        success: true,
        data: { ...newCategory, _id: '3' } as NewsCategory,
      })
      await service.create(newCategory)

      // 再次调用getList应该重新请求API
      await service.getList()
      expect(mockGetList).toHaveBeenCalledTimes(2)
    })
  })

  describe('update', () => {
    it('应该更新分类', async () => {
      const updateData: UpdateNewsCategoryDTO = { name: '更新的分类' }
      const updatedCategory = {
        ...mockCategory,
        name: '更新的分类',
        updatedAt: '2023-01-04',
      }

      mockGetById.mockResolvedValue({
        success: true,
        data: mockCategory,
      })

      mockUpdate.mockResolvedValue({
        success: true,
        data: updatedCategory,
        message: '更新成功',
      })

      const result = await service.update('1', updateData)
      expect(result.data).toEqual(updatedCategory)
      expect(mockUpdate).toHaveBeenCalledWith('1', updateData)
    })

    it('不能修改核心分类的key', async () => {
      mockGetById.mockResolvedValue({
        success: true,
        data: mockCategory, // 这是一个核心分类
      })

      await expect(service.update('1', { key: 'changed-key' })).rejects.toThrow(
        /不能修改核心分类的标识符/
      )
    })

    it('不能禁用核心分类', async () => {
      mockGetById.mockResolvedValue({
        success: true,
        data: mockCategory, // 这是一个核心分类
      })

      await expect(service.update('1', { isActive: false })).rejects.toThrow(/不能禁用核心分类/)
    })

    it('应该在分类不存在时抛出异常', async () => {
      mockGetById.mockRejectedValue(new Error('分类不存在'))

      await expect(service.update('99', { name: '更新' })).rejects.toBeInstanceOf(
        CategoryNotFoundError
      )
    })
  })

  describe('delete', () => {
    it('应该删除分类', async () => {
      const nonCoreCategory = {
        ...mockCategory,
        isCore: false,
      }

      mockGetById.mockResolvedValue({
        success: true,
        data: nonCoreCategory,
      })

      mockDelete.mockResolvedValue({
        success: true,
        message: '删除成功',
        data: undefined,
      })

      const result = await service.delete('1')
      expect(result.success).toBe(true)
      expect(mockDelete).toHaveBeenCalledWith('1')
    })

    it('不能删除核心分类', async () => {
      mockGetById.mockResolvedValue({
        success: true,
        data: mockCategory, // 这是一个核心分类
      })

      await expect(service.delete('1')).rejects.toThrow(/不能删除核心分类/)
    })

    it('应该在分类不存在时抛出异常', async () => {
      mockGetById.mockRejectedValue(new Error('分类不存在'))

      await expect(service.delete('99')).rejects.toBeInstanceOf(CategoryNotFoundError)
    })
  })
})
