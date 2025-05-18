import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useResourceStore } from '../../stores/resource'
import type { ApiResponse, PaginatedResponse } from '../../api/types'
import type { Resource } from '../resource.service'

// 创建mock函数
const mockGetList = vi.fn()
const mockGetDetail = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockUpdateStatus = vi.fn()
const mockBatchDelete = vi.fn()
const mockBatchUpdateStatus = vi.fn()
const mockUpdateTags = vi.fn()
const mockGetCategories = vi.fn()
const mockGetTags = vi.fn()

// Mock ResourceService
vi.mock('../resource.service', () => {
  return {
    ResourceService: vi.fn().mockImplementation(() => {
      return {
        getList: mockGetList,
        getDetail: mockGetDetail,
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        updateStatus: mockUpdateStatus,
        batchDelete: mockBatchDelete,
        batchUpdateStatus: mockBatchUpdateStatus,
        updateTags: mockUpdateTags,
        getCategories: mockGetCategories,
        getTags: mockGetTags,
      }
    }),
  }
})

describe('Resource Integration Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Resource Store 基础功能', () => {
    it('应该能够成功加载资源列表', async () => {
      // Mock API 响应
      const mockResources = [
        {
          id: '1',
          title: '学术报告PPT',
          description: '数据可视化最新进展',
          type: 'document',
          url: 'https://example.com/ppt1.ppt',
          fileSize: 1024000,
          mimeType: 'application/vnd.ms-powerpoint',
          downloadCount: 120,
          status: 'active',
          tags: ['学术报告', '数据可视化'],
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
        },
        {
          id: '2',
          title: '教学视频',
          description: '深度学习基础课程',
          type: 'video',
          url: 'https://example.com/video1.mp4',
          fileSize: 102400000,
          mimeType: 'video/mp4',
          downloadCount: 350,
          status: 'active',
          tags: ['教学视频', '深度学习'],
          createdAt: '2023-01-02',
          updatedAt: '2023-01-02',
        },
      ]

      const mockResponse: PaginatedResponse<Resource> = {
        success: true,
        data: mockResources,
        message: '获取成功',
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
        },
      }

      mockGetList.mockResolvedValue(mockResponse)

      // 使用 store
      const store = useResourceStore()

      // 初始状态应该是空的
      expect(store.resources.length).toBe(0)

      // 加载资源
      await store.fetchResources()

      // 加载后应该有数据
      expect(store.resources.length).toBe(2)
      expect(store.resources[0].title).toBe('学术报告PPT')
      expect(store.resources[1].title).toBe('教学视频')

      // 过滤功能验证
      store.filterType = 'document'
      expect(store.filteredResources.length).toBe(1)
      expect(store.filteredResources[0].title).toBe('学术报告PPT')
    })

    it('应该能够获取资源详情', async () => {
      const mockResource = {
        id: '1',
        title: '学术报告PPT',
        description: '数据可视化最新进展',
        type: 'document',
        url: 'https://example.com/ppt1.ppt',
        fileSize: 1024000,
        mimeType: 'application/vnd.ms-powerpoint',
        downloadCount: 120,
        status: 'active',
        tags: ['学术报告', '数据可视化'],
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      }

      const mockResponse: ApiResponse<Resource> = {
        success: true,
        data: mockResource,
        message: '获取成功',
      }

      mockGetDetail.mockResolvedValue(mockResponse)

      // 使用 store
      const store = useResourceStore()

      // 获取资源详情
      await store.fetchResourceDetail('1')

      // 验证结果
      expect(store.currentResource).not.toBeNull()
      expect(store.currentResource?.title).toBe('学术报告PPT')
      expect(mockGetDetail).toHaveBeenCalledWith('1')
    })
  })

  describe('Resource 操作', () => {
    it('应该能够创建新资源', async () => {
      const newResource = {
        title: '新资源',
        description: '这是一个新资源',
        type: 'document',
        url: 'https://example.com/new-doc.pdf',
      }

      const mockResponse: ApiResponse<Resource> = {
        success: true,
        data: {
          ...newResource,
          id: '3',
          fileSize: 512000,
          downloadCount: 0,
          status: 'active',
          createdAt: '2023-01-03',
          updatedAt: '2023-01-03',
        } as Resource,
        message: '创建成功',
      }

      mockCreate.mockResolvedValue(mockResponse)

      const mockListResponse: PaginatedResponse<Resource> = {
        success: true,
        data: [mockResponse.data],
        message: '获取成功',
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
        },
      }

      mockGetList.mockResolvedValue(mockListResponse)

      // 使用 store
      const store = useResourceStore()

      // 创建资源
      await store.createResource(newResource)

      // 验证
      expect(mockCreate).toHaveBeenCalledWith(newResource)
      expect(mockGetList).toHaveBeenCalled()
    })

    it('应该能够更新资源状态', async () => {
      const mockResource = {
        id: '1',
        title: '学术报告PPT',
        status: 'inactive',
        type: 'document',
        url: 'https://example.com/ppt1.ppt',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-03',
      } as Resource

      const mockResponse: ApiResponse<Resource> = {
        success: true,
        data: mockResource,
        message: '更新成功',
      }

      mockUpdateStatus.mockResolvedValue(mockResponse)

      // 使用 store
      const store = useResourceStore()

      // 更新资源状态
      await store.updateResourceStatus('1', 'inactive')

      // 验证
      expect(mockUpdateStatus).toHaveBeenCalledWith('1', 'inactive')
    })

    it('应该能够删除资源', async () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined,
        message: '删除成功',
      }

      mockDelete.mockResolvedValue(mockResponse)

      // 使用 store
      const store = useResourceStore()

      // 删除资源
      await store.deleteResource('1')

      // 验证
      expect(mockDelete).toHaveBeenCalledWith('1')
    })
  })
})
