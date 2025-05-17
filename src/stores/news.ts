import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { News, NewsQueryParams, CreateNewsDTO, UpdateNewsDTO } from '@/api/modules/news'
import { NewsService } from '@/services/news.service'
import { useRecentlyViewed } from '@/composables/useRecentlyViewed'

const newsService = new NewsService()

export const useNewsStore = defineStore('news', () => {
  // 状态
  const loading = ref(false)
  const items = ref<News[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(10)
  const currentNews = ref<News | null>(null)
  const categories = ref<string[]>([])
  const tags = ref<string[]>([])

  // 缓存最近访问的新闻
  const { items: recentlyViewed, addItem: addToRecentlyViewed } =
    useRecentlyViewed<News>('recently-viewed-news')

  // 筛选条件
  const filters = ref({
    keyword: '',
    category: '',
    status: '',
    tag: '',
    startDate: '',
    endDate: '',
  })

  // 计算属性
  const totalPages = computed(() => Math.ceil(total.value / limit.value))
  const hasMore = computed(() => page.value < totalPages.value)
  const isEmpty = computed(() => items.value.length === 0)

  const pagination = computed(() => ({
    current: page.value,
    pageSize: limit.value,
    total: total.value,
    showSizeChanger: true,
    showQuickJumper: true,
  }))

  // 获取查询参数
  const getQueryParams = (): Partial<NewsQueryParams> => ({
    ...filters.value,
  })

  // 方法
  // 获取新闻列表
  const fetchList = async (params?: Partial<NewsQueryParams>) => {
    try {
      loading.value = true
      const response = await newsService.getList({
        ...getQueryParams(),
        ...params,
      })

      items.value = response.data
      if (response.pagination) {
        total.value = response.pagination.total
        page.value = response.pagination.page
        limit.value = response.pagination.limit
      }
    } finally {
      loading.value = false
    }
  }

  // 获取新闻详情
  const fetchById = async (id: string) => {
    try {
      loading.value = true
      const response = await newsService.getDetail(id)
      currentNews.value = response.data

      // 添加到最近访问
      if (response.data) {
        addToRecentlyViewed(response.data)
      }

      return response.data
    } finally {
      loading.value = false
    }
  }

  // 创建新闻
  const create = async (data: CreateNewsDTO) => {
    const response = await newsService.create(data)
    await fetchList()
    return response
  }

  // 更新新闻
  const update = async (id: string, data: UpdateNewsDTO) => {
    const response = await newsService.update(id, data)
    if (currentNews.value?.id === id) {
      currentNews.value = response.data
    }
    await fetchList()
    return response
  }

  // 删除新闻
  const remove = async (id: string) => {
    await newsService.delete(id)
    if (currentNews.value?.id === id) {
      currentNews.value = null
    }
    await fetchList()
  }

  // 更新新闻状态
  const updateStatus = async (id: string, status: News['status']) => {
    const response = await newsService.updateStatus(id, status)
    if (currentNews.value?.id === id) {
      currentNews.value = response.data
    }
    await fetchList()
    return response
  }

  // 获取分类
  const fetchCategories = async () => {
    const response = await newsService.getCategories()
    categories.value = response.data
    return response.data
  }

  // 获取标签
  const fetchTags = async () => {
    const response = await newsService.getTags()
    tags.value = response.data
    return response.data
  }

  // 分页相关方法
  const setPage = async (newPage: number) => {
    page.value = newPage
    await fetchList()
  }

  const setLimit = async (newLimit: number) => {
    limit.value = newLimit
    page.value = 1
    await fetchList()
  }

  // 筛选相关方法
  const setFilters = async (newFilters: typeof filters.value) => {
    filters.value = { ...newFilters }
    page.value = 1
    await fetchList()
  }

  const resetFilters = async () => {
    filters.value = {
      keyword: '',
      category: '',
      status: '',
      tag: '',
      startDate: '',
      endDate: '',
    }
    page.value = 1
    await fetchList()
  }

  return {
    // 状态
    loading,
    items,
    total,
    page,
    limit,
    currentNews,
    recentlyViewed,
    categories,
    tags,
    filters,

    // 计算属性
    totalPages,
    hasMore,
    isEmpty,
    pagination,

    // 方法
    fetchList,
    fetchById,
    create,
    update,
    remove,
    updateStatus,
    fetchCategories,
    fetchTags,
    setPage,
    setLimit,
    setFilters,
    resetFilters,
  }
})
