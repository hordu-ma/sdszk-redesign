import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNewsStore } from '../../stores/news'
import type { ApiResponse, PaginatedResponse } from '../../api/types'
import type { News } from '../news.service'

// 创建mock函数
const mockGetList = vi.fn()
const mockGetDetail = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockUpdateStatus = vi.fn()
const mockGetCategories = vi.fn()
const mockGetTags = vi.fn()

// Mock NewsService
vi.mock('../news.service', () => {
  return {
    NewsService: vi.fn().mockImplementation(() => {
      return {
        getList: mockGetList,
        getDetail: mockGetDetail,
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        updateStatus: mockUpdateStatus,
        getCategories: mockGetCategories,
        getTags: mockGetTags,
      }
    }),
  }
})

describe('News Integration Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('News Store 基础功能', () => {
    it('应该能够成功加载新闻列表', async () => {
      // Mock API 响应
      const mockNews = [
        {
          id: '1',
          title: '中心举办2023年学术交流会',
          content: '详细内容...',
          summary: '本次交流会邀请了多位专家...',
          cover: 'https://example.com/images/cover1.jpg',
          author: '宣传部',
          category: '中心动态',
          tags: ['学术交流', '2023年度'],
          publishDate: '2023-01-15',
          status: 'published',
          viewCount: 520,
          createdAt: '2023-01-10',
          updatedAt: '2023-01-15',
        },
        {
          id: '2',
          title: '关于开展2023年度项目申报的通知',
          content: '详细内容...',
          summary: '根据年度工作计划，现开展...',
          author: '科研部',
          category: '通知公告',
          status: 'published',
          viewCount: 310,
          createdAt: '2023-01-05',
          updatedAt: '2023-01-05',
        },
      ]

      const mockResponse: PaginatedResponse<News> = {
        success: true,
        data: mockNews,
        message: '获取成功',
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
        },
      }

      mockGetList.mockResolvedValue(mockResponse)

      // 使用 store
      const store = useNewsStore()

      // 初始状态应该是空的
      expect(store.newsList.length).toBe(0)

      // 加载新闻
      await store.fetchNews()

      // 加载后应该有数据
      expect(store.newsList.length).toBe(2)
      expect(store.newsList[0].title).toBe('中心举办2023年学术交流会')
      expect(store.newsList[1].title).toBe('关于开展2023年度项目申报的通知')

      // 验证过滤功能
      store.currentCategory = '中心动态'
      expect(store.filteredNews.length).toBe(1)
      expect(store.filteredNews[0].title).toBe('中心举办2023年学术交流会')
    })

    it('应该能够获取新闻详情', async () => {
      const mockNewsDetail = {
        id: '1',
        title: '中心举办2023年学术交流会',
        content: '详细内容...',
        summary: '本次交流会邀请了多位专家...',
        cover: 'https://example.com/images/cover1.jpg',
        author: '宣传部',
        category: '中心动态',
        tags: ['学术交流', '2023年度'],
        publishDate: '2023-01-15',
        status: 'published',
        viewCount: 520,
        createdAt: '2023-01-10',
        updatedAt: '2023-01-15',
      }

      const mockResponse: ApiResponse<News> = {
        success: true,
        data: mockNewsDetail,
        message: '获取成功',
      }

      mockGetDetail.mockResolvedValue(mockResponse)

      // 使用 store
      const store = useNewsStore()
      
      // 获取新闻详情
      await store.fetchNewsDetail('1')

      // 验证结果
      expect(store.currentNews).not.toBeNull()
      expect(store.currentNews?.title).toBe('中心举办2023年学术交流会')
      expect(mockGetDetail).toHaveBeenCalledWith('1')
    })

    it('应该能够加载分类列表', async () => {
      const mockCategories = ['中心动态', '通知公告', '学术活动', '研究成果']

      const mockResponse: ApiResponse<string[]> = {
        success: true,
        data: mockCategories,
        message: '获取成功',
      }

      mockGetCategories.mockResolvedValue(mockResponse)

      // 使用 store
      const store = useNewsStore()
      
      // 加载分类
      await store.fetchCategories()

      // 验证结果
      expect(store.categories.length).toBe(4)
      expect(store.categories).toContain('中心动态')
      expect(mockGetCategories).toHaveBeenCalled()
    })

    it('应该能够加载标签列表', async () => {
      const mockTags = ['学术交流', '项目申报', '人才引进', '科研成果']

      const mockResponse: ApiResponse<string[]> = {
        success: true,
        data: mockTags,
        message: '获取成功',
      }

      mockGetTags.mockResolvedValue(mockResponse)

      // 使用 store
      const store = useNewsStore()
      
      // 加载标签
      await store.fetchTags()

      // 验证结果
      expect(store.tags.length).toBe(4)
      expect(store.tags).toContain('项目申报')
      expect(mockGetTags).toHaveBeenCalled()
    })
  })

  describe('News 操作', () => {
    it('应该能够创建新闻', async () => {
      const newNews = {
        title: '新的研究成果发布',
        content: '<p>我们的团队最近取得了重大突破...</p>',
        summary: '团队在人工智能领域取得新突破',
        category: '研究成果',
        tags: ['人工智能', '突破']
      }

      const mockResponse: ApiResponse<News> = {
        success: true,
        data: {
          ...newNews,
          id: '3',
          status: 'draft',
          viewCount: 0,
          createdAt: '2023-01-20',
          updatedAt: '2023-01-20',
        } as News,
        message: '创建成功',
      }

      mockCreate.mockResolvedValue(mockResponse)

      const mockListResponse: PaginatedResponse<News> = {
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
      const store = useNewsStore()
      
      // 创建新闻
      await store.createNews(newNews)

      // 验证
      expect(mockCreate).toHaveBeenCalledWith(newNews)
      expect(mockGetList).toHaveBeenCalled()
    })

    it('应该能够更新新闻', async () => {
      const updateData = {
        title: '更新后的标题',
        content: '<p>更新后的内容...</p>'
      }

      const mockResponse: ApiResponse<News> = {
        success: true,
        data: {
          id: '1',
          title: '更新后的标题',
          content: '<p>更新后的内容...</p>',
          category: '中心动态',
          status: 'published',
          createdAt: '2023-01-10',
          updatedAt: '2023-01-21',
        } as News,
        message: '更新成功',
      }

      mockUpdate.mockResolvedValue(mockResponse)

      // 使用 store
      const store = useNewsStore()
      
      // 更新新闻
      await store.updateNews('1', updateData)

      // 验证
      expect(mockUpdate).toHaveBeenCalledWith('1', updateData)
    })

    it('应该能够更新新闻状态', async () => {
      const mockResponse: ApiResponse<News> = {
        success: true,
        data: {
          id: '1',
          title: '中心举办2023年学术交流会',
          status: 'archived',
          createdAt: '2023-01-10',
          updatedAt: '2023-01-22',
        } as News,
        message: '状态更新成功',
      }

      mockUpdateStatus.mockResolvedValue(mockResponse)

      // 使用 store
      const store = useNewsStore()
      
      // 更新新闻状态
      await store.updateNewsStatus('1', 'archived')

      // 验证
      expect(mockUpdateStatus).toHaveBeenCalledWith('1', 'archived')
    })

    it('应该能够删除新闻', async () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined,
        message: '删除成功',
      }

      mockDelete.mockResolvedValue(mockResponse)

      // 使用 store
      const store = useNewsStore()
      
      // 删除新闻
      await store.deleteNews('1')

      // 验证
      expect(mockDelete).toHaveBeenCalledWith('1')
    })
  })
})
