import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNewsCategoryStore } from '../../stores/newsCategory'
import type { ApiResponse } from '../../api/types'
import type { NewsCategory } from '../newsCategory.service'

// 创建mock函数
const mockGetList = vi.fn()
const mockGetCoreCategories = vi.fn()
const mockGetById = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockUpdateOrder = vi.fn()

// Mock NewsCategoryService
vi.mock('../newsCategory.service', () => {
  return {
    NewsCategoryService: vi.fn().mockImplementation(() => {
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

describe('NewsCategory Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Store 基础功能', () => {
    it('应该能够成功加载分类列表', async () => {
      // Mock API 响应
      const mockCategories = [
        {
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
        },
        {
          _id: '2',
          name: '通知公告',
          key: 'notice',
          description: '通知公告描述',
          order: 2,
          color: '#52c41a',
          isActive: true,
          isCore: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
        },
      ]

      const mockResponse: ApiResponse<NewsCategory[]> = {
        success: true,
        data: mockCategories,
        message: '获取成功',
      }

      mockGetList.mockResolvedValue(mockResponse)

      // 使用 store
      const store = useNewsCategoryStore()

      // 初始状态应该是空的
      expect(store.categories.length).toBe(0)

      // 加载分类
      await store.loadCategories()

      // 加载后应该有数据
      expect(store.categories.length).toBe(2)
      expect(store.categories[0].name).toBe('中心动态')
      expect(store.categories[1].name).toBe('通知公告')

      // 排序后的分类应该按照order升序排列
      expect(store.sortedCategories[0].name).toBe('中心动态')
      expect(store.sortedCategories[1].name).toBe('通知公告')
    })

    it('应该能够加载核心分类', async () => {
      // Mock API 响应
      const mockCoreCategories = [
        {
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
        },
      ]

      const mockResponse: ApiResponse<NewsCategory[]> = {
        success: true,
        data: mockCoreCategories,
        message: '获取成功',
      }

      mockGetCoreCategories.mockResolvedValue(mockResponse)

      // 使用 store
      const store = useNewsCategoryStore()

      // 初始状态应该是空的
      expect(store.coreCategories.length).toBe(0)

      // 加载核心分类
      await store.loadCoreCategories()

      // 加载后应该有数据
      expect(store.coreCategories.length).toBe(1)
      expect(store.coreCategories[0].name).toBe('中心动态')
    })
  })

  describe('NewsCategory 操作', () => {
    it('应该能够创建新分类', async () => {
      // Mock API 响应
      const mockNewCategory = {
        _id: '3',
        name: '新分类',
        key: 'new-category',
        description: '新分类描述',
        order: 3,
        color: '#f5222d',
        isActive: true,
        isCore: false,
        createdAt: '2023-01-02',
        updatedAt: '2023-01-02',
      }

      const mockCreateResponse: ApiResponse<NewsCategory> = {
        success: true,
        data: mockNewCategory,
        message: '创建成功',
      }

      mockCreate.mockResolvedValue(mockCreateResponse)

      const mockGetListResponse: ApiResponse<NewsCategory[]> = {
        success: true,
        data: [mockNewCategory],
        message: '获取成功',
      }

      mockGetList.mockResolvedValue(mockGetListResponse)

      // 使用 store
      const store = useNewsCategoryStore()

      const newCategoryData = {
        name: '新分类',
        key: 'new-category',
        description: '新分类描述',
        color: '#f5222d',
        order: 3,
      }

      await store.createCategory(newCategoryData)

      expect(mockCreate).toHaveBeenCalledWith(newCategoryData)
      expect(mockGetList).toHaveBeenCalled()
    })
  })
})
