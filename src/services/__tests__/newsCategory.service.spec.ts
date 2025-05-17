import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NewsCategoryService } from '../newsCategory.service'
import { NewsCategoryApi } from '@/api/modules/newsCategory'
import type {
  NewsCategory,
  CreateNewsCategoryDTO,
  UpdateNewsCategoryDTO,
} from '@/api/modules/newsCategory'

// Mock NewsCategoryApi
vi.mock('@/api/modules/newsCategory', () => {
  return {
    NewsCategoryApi: vi.fn().mockImplementation(() => ({
      getList: vi.fn(),
      getCoreCategories: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateOrder: vi.fn(),
    })),
  }
})

describe('NewsCategoryService', () => {
  let service: NewsCategoryService
  let mockApi: jest.Mocked<NewsCategoryApi>

  beforeEach(() => {
    mockApi = new NewsCategoryApi() as jest.Mocked<NewsCategoryApi>
    service = new NewsCategoryService()
  })

  describe('getList', () => {
    it('应该返回分类列表', async () => {
      const mockCategories = [
        { _id: '1', name: '中心动态', key: 'center', isCore: true },
        { _id: '2', name: '通知公告', key: 'notice', isCore: true },
      ]

      mockApi.getList.mockResolvedValue({ data: mockCategories })

      const result = await service.getList()
      expect(result.data).toEqual(mockCategories)
      expect(mockApi.getList).toHaveBeenCalledWith({ includeInactive: false })
    })

    it('应该包含已禁用的分类', async () => {
      const mockCategories = [
        { _id: '1', name: '中心动态', key: 'center', isCore: true, isActive: true },
        { _id: '2', name: '已禁用分类', key: 'disabled', isCore: false, isActive: false },
      ]

      mockApi.getList.mockResolvedValue({ data: mockCategories })

      const result = await service.getList(true)
      expect(result.data).toEqual(mockCategories)
      expect(mockApi.getList).toHaveBeenCalledWith({ includeInactive: true })
    })
  })

  describe('getCoreCategories', () => {
    it('应该只返回核心分类', async () => {
      const mockCoreCategories = [
        { _id: '1', name: '中心动态', key: 'center', isCore: true },
        { _id: '2', name: '通知公告', key: 'notice', isCore: true },
        { _id: '3', name: '政策文件', key: 'policy', isCore: true },
      ]

      mockApi.getCoreCategories.mockResolvedValue({ data: mockCoreCategories })

      const result = await service.getCoreCategories()
      expect(result.data).toEqual(mockCoreCategories)
      expect(mockApi.getCoreCategories).toHaveBeenCalled()
    })
  })

  describe('create', () => {
    it('应该创建新分类', async () => {
      const newCategory: CreateNewsCategoryDTO = {
        name: '新分类',
        key: 'new',
        color: '#ff0000',
        order: 0,
      }

      const mockCreatedCategory = {
        _id: '4',
        ...newCategory,
        isCore: false,
        isActive: true,
      }

      mockApi.create.mockResolvedValue({ data: mockCreatedCategory })

      const result = await service.create(newCategory)
      expect(result.data).toEqual(mockCreatedCategory)
      expect(mockApi.create).toHaveBeenCalledWith(newCategory)
    })
  })

  describe('update', () => {
    it('应该更新现有分类', async () => {
      const categoryId = '4'
      const updateData: UpdateNewsCategoryDTO = {
        name: '更新的分类',
        color: '#00ff00',
      }

      const mockUpdatedCategory = {
        _id: categoryId,
        key: 'new',
        ...updateData,
        isCore: false,
        isActive: true,
      }

      mockApi.update.mockResolvedValue({ data: mockUpdatedCategory })

      const result = await service.update(categoryId, updateData)
      expect(result.data).toEqual(mockUpdatedCategory)
      expect(mockApi.update).toHaveBeenCalledWith(categoryId, updateData)
    })

    it('不应该更新核心分类的key', async () => {
      const categoryId = '1'
      const updateData: UpdateNewsCategoryDTO = {
        key: 'new-key', // 尝试更新key
        name: '更新的中心动态',
      }

      const mockCoreCategory = {
        _id: categoryId,
        key: 'center', // key保持不变
        name: '更新的中心动态',
        isCore: true,
        isActive: true,
      }

      mockApi.update.mockResolvedValue({ data: mockCoreCategory })

      const result = await service.update(categoryId, updateData)
      expect(result.data.key).toBe('center')
    })
  })

  describe('delete', () => {
    it('应该删除非核心分类', async () => {
      const categoryId = '4'
      mockApi.delete.mockResolvedValue({ data: void 0 })

      await service.delete(categoryId)
      expect(mockApi.delete).toHaveBeenCalledWith(categoryId)
    })
  })

  describe('updateOrder', () => {
    it('应该更新分类排序', async () => {
      const orderUpdates = [
        { id: '1', order: 0 },
        { id: '2', order: 1 },
        { id: '3', order: 2 },
      ]

      mockApi.updateOrder.mockResolvedValue({ data: void 0 })

      await service.updateOrder(orderUpdates)
      expect(mockApi.updateOrder).toHaveBeenCalledWith(orderUpdates)
    })
  })
})
