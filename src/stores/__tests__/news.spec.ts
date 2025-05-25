import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNewsStore } from '../news'
import { NewsService } from '../../services/news.service'

// Mock NewsService
vi.mock('../../services/news.service', () => ({
  NewsService: vi.fn().mockImplementation(() => ({
    getList: vi.fn(),
    getDetail: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  }))
}))

// Mock useRecentlyViewed composable
vi.mock('../../composables/useRecentlyViewed', () => ({
  useRecentlyViewed: () => ({
    items: [],
    addItem: vi.fn()
  })
}))

describe('News Store', () => {
  let store: ReturnType<typeof useNewsStore>
  interface MockNewsService {
    getList: ReturnType<typeof vi.fn>
    getDetail: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }

  let newsService: MockNewsService

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useNewsStore()
    newsService = new NewsService() as unknown as MockNewsService
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      expect(store.loading).toBe(false)
      expect(store.items).toEqual([])
      expect(store.total).toBe(0)
      expect(store.page).toBe(1)
      expect(store.limit).toBe(10)
      expect(store.currentNews).toBeNull()
      expect(store.categories).toEqual([])
      expect(store.tags).toEqual([])
    })

    it('应该有正确的初始筛选条件', () => {
      expect(store.filters).toEqual({
        keyword: '',
        category: '',
        status: '',
        tag: '',
        startDate: '',
        endDate: ''
      })
    })
  })

  describe('获取新闻列表', () => {
    const mockNewsList = [
      { id: '1', title: 'News 1', content: 'Content 1' },
      { id: '2', title: 'News 2', content: 'Content 2' }
    ]

    const mockPagination = {
      total: 20,
      page: 1,
      limit: 10
    }

    it('应该正确获取新闻列表', async () => {
      vi.mocked(newsService.getList).mockResolvedValueOnce({
        data: mockNewsList,
        pagination: mockPagination
      })

      await store.fetchList()

      expect(store.loading).toBe(false)
      expect(store.items).toEqual(mockNewsList)
      expect(store.total).toBe(mockPagination.total)
      expect(store.page).toBe(mockPagination.page)
      expect(store.limit).toBe(mockPagination.limit)
    })

    it('应该处理获取列表时的错误', async () => {
      vi.mocked(newsService.getList).mockRejectedValueOnce(new Error('Failed to fetch'))

      await store.fetchList()

      expect(store.loading).toBe(false)
      expect(store.items).toEqual([])
    })
  })

  describe('获取新闻详情', () => {
    const mockNews = {
      id: '1',
      title: 'Test News',
      content: 'Test Content'
    }

    it('应该正确获取新闻详情', async () => {
      newsService.getDetail.mockResolvedValueOnce({
        data: mockNews
      })

      const result = await store.fetchById('1')

      expect(store.loading).toBe(false)
      expect(store.currentNews).toEqual(mockNews)
      expect(result).toEqual(mockNews)
    })

    it('应该处理获取详情时的错误', async () => {
      newsService.getDetail.mockRejectedValueOnce(new Error('Failed to fetch'))

      await store.fetchById('1')

      expect(store.loading).toBe(false)
      expect(store.currentNews).toBeNull()
    })
  })

  describe('创建和更新新闻', () => {
    const mockNewsData = {
      title: 'New News',
      content: 'New Content'
    }

    it('应该正确创建新闻', async () => {
      newsService.create.mockResolvedValueOnce({
        data: { id: '1', ...mockNewsData }
      })
      newsService.getList.mockResolvedValueOnce({
        data: [{ id: '1', ...mockNewsData }],
        pagination: { total: 1, page: 1, limit: 10 }
      })

      await store.create(mockNewsData)

      expect(newsService.create).toHaveBeenCalledWith(mockNewsData)
      expect(newsService.getList).toHaveBeenCalled()
    })

    it('应该正确更新新闻', async () => {
      const updateData = { title: 'Updated News' }
      newsService.update.mockResolvedValueOnce({
        data: { id: '1', ...mockNewsData, ...updateData }
      })

      await store.update('1', updateData)

      expect(newsService.update).toHaveBeenCalledWith('1', updateData)
    })
  })
})