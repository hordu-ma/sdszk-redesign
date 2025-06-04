import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useResourceStore } from '../resource'
import { ResourceService } from '../../services/resource.service'

interface MockResourceService {
  getList: ReturnType<typeof vi.fn>
  getDetail: ReturnType<typeof vi.fn>
  create: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  download: ReturnType<typeof vi.fn>
}

// Mock ResourceService
vi.mock('../../services/resource.service', () => ({
  ResourceService: vi.fn().mockImplementation(() => ({
    getList: vi.fn(),
    getDetail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    download: vi.fn(),
  })),
}))

// Mock useRecentlyViewed composable
vi.mock('../../composables/useRecentlyViewed', () => ({
  useRecentlyViewed: () => ({
    items: [],
    addItem: vi.fn(),
  }),
}))

describe('Resource Store', () => {
  let store: ReturnType<typeof useResourceStore>
  let resourceService: MockResourceService

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useResourceStore()
    resourceService = new ResourceService() as unknown as MockResourceService
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      expect(store.loading).toBe(false)
      expect(store.items).toEqual([])
      expect(store.total).toBe(0)
      expect(store.page).toBe(1)
      expect(store.limit).toBe(10)
      expect(store.currentResource).toBeNull()
      expect(store.selectedResources).toEqual([])
    })

    it('应该有正确的初始筛选条件', () => {
      expect(store.filters).toEqual({
        category: '',
        type: '',
        keyword: '',
        status: '',
        tags: [],
      })
    })

    it('应该正确计算分页属性', () => {
      expect(store.pagination).toEqual({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
      })
    })
  })

  describe('获取资源列表', () => {
    const mockResources = [
      { id: '1', title: 'Resource 1', type: 'document' },
      { id: '2', title: 'Resource 2', type: 'video' },
    ]

    const mockPagination = {
      total: 20,
      page: 1,
      limit: 10,
    }

    it('应该正确获取资源列表', async () => {
      resourceService.getList.mockResolvedValueOnce({
        data: mockResources,
        pagination: mockPagination,
      })

      await store.fetchList()

      expect(store.loading).toBe(false)
      expect(store.items).toEqual(mockResources)
      expect(store.total).toBe(mockPagination.total)
      expect(store.page).toBe(mockPagination.page)
      expect(store.limit).toBe(mockPagination.limit)
    })

    it('应该使用筛选条件获取资源列表', async () => {
      store.filters.category = 'test-category'
      store.filters.type = 'document'
      store.filters.keyword = 'test'

      await store.fetchList()

      expect(resourceService.getList).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'test-category',
          type: 'document',
          keyword: 'test',
        })
      )
    })

    it('应该处理获取列表时的错误', async () => {
      resourceService.getList.mockRejectedValueOnce(new Error('Failed to fetch'))

      await expect(store.fetchList()).rejects.toThrow('Failed to fetch')
      expect(store.loading).toBe(false)
      expect(store.items).toEqual([])
    })
  })

  describe('获取资源详情', () => {
    const mockResource = {
      id: '1',
      title: 'Test Resource',
      type: 'document',
      content: 'Test Content',
    }

    it('应该正确获取资源详情', async () => {
      resourceService.getDetail.mockResolvedValueOnce({
        data: mockResource,
      })

      const result = await store.fetchById('1')

      expect(store.loading).toBe(false)
      expect(store.currentResource).toEqual(mockResource)
      expect(result).toEqual(mockResource)
    })

    it('应该处理获取详情时的错误', async () => {
      resourceService.getDetail.mockRejectedValueOnce(new Error('Failed to fetch'))

      await expect(store.fetchById('1')).rejects.toThrow('Failed to fetch')
      expect(store.loading).toBe(false)
    })
  })

  describe('资源选择功能', () => {
    const mockResource = { id: '1', title: 'Test Resource' }

    it('应该正确计算是否有选中的资源', () => {
      expect(store.hasSelected).toBe(false)
      store.selectedResources.push(mockResource)
      expect(store.hasSelected).toBe(true)
    })
  })
})
