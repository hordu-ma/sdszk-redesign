import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Activity, ActivityQueryParams, CreateActivityDTO, UpdateActivityDTO } from '../types'
import { ActivityApi } from '../services/api'
import { message } from 'ant-design-vue'

const activityApi = new ActivityApi()

export const useActivityStore = defineStore('activity', () => {
  // 状态
  const loading = ref(false)
  const items = ref<Activity[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(10)
  const currentActivity = ref<Activity | null>(null)

  // 筛选条件
  const filters = ref<ActivityQueryParams>({
    category: undefined,
    status: undefined,
    search: undefined,
    upcoming: undefined,
    featured: undefined,
    registrationOpen: undefined,
    startDate: undefined,
    endDate: undefined,
  })

  // 计算属性
  const pagination = computed(() => ({
    total: total.value,
    current: page.value,
    pageSize: limit.value,
    showSizeChanger: true,
    showQuickJumper: true,
  }))

  // 获取查询参数
  const getQueryParams = () => ({
    ...filters.value,
    page: page.value,
    limit: limit.value,
  })

  // 方法
  const fetchList = async (params?: ActivityQueryParams) => {
    loading.value = true
    try {
      const response = await activityApi.getList({
        ...getQueryParams(),
        ...params,
      })
      items.value = response.data
      if (response.pagination) {
        total.value = response.pagination.total
        page.value = response.pagination.page
        limit.value = response.pagination.limit
      }
      return response
    } catch (error) {
      if (error instanceof Error) {
        message.error('获取活动列表失败：' + error.message)
      }
      throw error
    } finally {
      loading.value = false
    }
  }

  const getActivity = async (id: string) => {
    loading.value = true
    try {
      const response = await activityApi.getDetail(id)
      currentActivity.value = response.data
      return response.data
    } catch (error) {
      if (error instanceof Error) {
        message.error('获取活动详情失败：' + error.message)
      }
      throw error
    } finally {
      loading.value = false
    }
  }

  const createActivity = async (data: CreateActivityDTO) => {
    loading.value = true
    try {
      const response = await activityApi.create(data)
      message.success('创建活动成功')
      await fetchList()
      return response
    } catch (error) {
      if (error instanceof Error) {
        message.error('创建活动失败：' + error.message)
      }
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateActivity = async (id: string, data: UpdateActivityDTO) => {
    loading.value = true
    try {
      const response = await activityApi.update(id, data)
      message.success('更新活动成功')
      if (currentActivity.value?.id === id) {
        currentActivity.value = response.data
      }
      await fetchList()
      return response
    } catch (error) {
      if (error instanceof Error) {
        message.error('更新活动失败：' + error.message)
      }
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteActivity = async (id: string) => {
    loading.value = true
    try {
      await activityApi.deleteActivity(id)
      message.success('删除活动成功')
      if (currentActivity.value?.id === id) {
        currentActivity.value = null
      }
      await fetchList()
    } catch (error) {
      if (error instanceof Error) {
        message.error('删除活动失败：' + error.message)
      }
      throw error
    } finally {
      loading.value = false
    }
  }

  const togglePublishStatus = async (id: string) => {
    loading.value = true
    try {
      const response = await activityApi.togglePublishStatus(id)
      message.success('更新发布状态成功')
      if (currentActivity.value?.id === id) {
        currentActivity.value = response.data
      }
      await fetchList()
      return response
    } catch (error) {
      if (error instanceof Error) {
        message.error('更新发布状态失败：' + error.message)
      }
      throw error
    } finally {
      loading.value = false
    }
  }

  const toggleFeaturedStatus = async (id: string) => {
    loading.value = true
    try {
      const response = await activityApi.toggleFeaturedStatus(id)
      message.success('更新推荐状态成功')
      if (currentActivity.value?.id === id) {
        currentActivity.value = response.data
      }
      await fetchList()
      return response
    } catch (error) {
      if (error instanceof Error) {
        message.error('更新推荐状态失败：' + error.message)
      }
      throw error
    } finally {
      loading.value = false
    }
  }

  const getUpcomingActivities = async (limit?: number) => {
    loading.value = true
    try {
      return await activityApi.getUpcomingActivities({ limit })
    } catch (error) {
      if (error instanceof Error) {
        message.error('获取即将开始的活动失败：' + error.message)
      }
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteAttachment = async (activityId: string, attachmentId: string) => {
    loading.value = true
    try {
      await activityApi.deleteAttachment(activityId, attachmentId)
      message.success('删除附件成功')
      if (currentActivity.value?.id === activityId) {
        await getActivity(activityId)
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error('删除附件失败：' + error.message)
      }
      throw error
    } finally {
      loading.value = false
    }
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

  const setFilters = async (newFilters: Partial<ActivityQueryParams>) => {
    filters.value = { ...filters.value, ...newFilters }
    page.value = 1
    await fetchList()
  }

  const resetFilters = async () => {
    filters.value = {
      category: undefined,
      status: undefined,
      search: undefined,
      upcoming: undefined,
      featured: undefined,
      registrationOpen: undefined,
      startDate: undefined,
      endDate: undefined,
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
    currentActivity,
    pagination,

    // 方法
    fetchList,
    getActivity,
    createActivity,
    updateActivity,
    deleteActivity,
    togglePublishStatus,
    toggleFeaturedStatus,
    getUpcomingActivities,
    deleteAttachment,
    setPage,
    setLimit,
    setFilters,
    resetFilters,
  }
})
