import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NewsCategory, News, NewsQuery } from '@/services/news.service'
import { NewsService } from '@/services/news.service'
import { useStorage } from '@vueuse/core'

const newsService = new NewsService()

export const useNewsStore = defineStore('news', () => {
  // 状态
  const loading = ref(false)
  const items = ref<News[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(10)
  const currentNews = ref<News | null>(null)

  // 缓存最近访问的新闻
  const recentlyViewed = useStorage<News[]>('recently-viewed-news', [])

  // 筛选条件
  const filters = ref<{
    category: NewsCategory | ''
    keyword: string
    isPublished: boolean | undefined
  }>({
    category: '',
    keyword: '',
    isPublished: undefined,
  })

  // 计算属性
  const pagination = computed(() => ({
    current: page.value,
    pageSize: limit.value,
    total: total.value,
    showSizeChanger: true,
    showQuickJumper: true,
  }))

  // 方法
  const fetchList = async (query?: Partial<NewsQuery>) => {
    try {
      loading.value = true
      const { data, pagination: pager } = await newsService.getList({
        page: page.value,
        limit: limit.value,
        ...filters.value,
        ...query,
      })
      items.value = data
      if (pager) {
        total.value = pager.total
        page.value = pager.page
        limit.value = pager.limit
      }
    } catch (error) {
      console.error('Failed to fetch news list:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchById = async (id: string) => {
    try {
      loading.value = true
      const { data } = await newsService.getById(id)
      currentNews.value = data

      // 添加到最近访问
      if (data) {
        const existingIndex = recentlyViewed.value.findIndex(n => n._id === data._id)
        if (existingIndex > -1) {
          recentlyViewed.value.splice(existingIndex, 1)
        }
        recentlyViewed.value.unshift(data)
        if (recentlyViewed.value.length > 10) {
          recentlyViewed.value.pop()
        }
      }

      return data
    } catch (error) {
      console.error('Failed to fetch news by id:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const create = async (data: Partial<News>) => {
    const response = await newsService.create(data)
    await fetchList() // 刷新列表
    return response
  }

  const update = async (id: string, data: Partial<News>) => {
    const response = await newsService.update(id, data)
    await fetchList() // 刷新列表
    return response
  }

  const remove = async (id: string) => {
    await newsService.delete(id)
    await fetchList() // 刷新列表
  }

  const togglePublish = async (id: string) => {
    const response = await newsService.togglePublish(id)
    await fetchList() // 刷新列表
    return response
  }

  const setPage = async (newPage: number) => {
    page.value = newPage
    await fetchList()
  }

  const setLimit = async (newLimit: number) => {
    limit.value = newLimit
    page.value = 1
    await fetchList()
  }

  const setFilters = async (newFilters: typeof filters.value) => {
    filters.value = { ...newFilters }
    page.value = 1
    await fetchList()
  }

  const resetFilters = async () => {
    filters.value = {
      category: '',
      keyword: '',
      isPublished: undefined,
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
    filters,
    currentNews,
    recentlyViewed,
    pagination,

    // 方法
    fetchList,
    fetchById,
    create,
    update,
    remove,
    togglePublish,
    setPage,
    setLimit,
    setFilters,
    resetFilters,
  }
})
