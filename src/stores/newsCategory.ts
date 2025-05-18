import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NewsCategory } from '../api/modules/newsCategory'
import { NewsCategoryService } from '../services/newsCategory.service'
import { message } from 'ant-design-vue'

const newsCategoryService = new NewsCategoryService()

export const useNewsCategoryStore = defineStore('newsCategory', () => {
  // 状态
  const categories = ref<NewsCategory[]>([])
  const coreCategories = ref<NewsCategory[]>([])
  const loading = ref(false)

  // 计算属性
  const sortedCategories = computed(() => {
    return [...categories.value].sort((a, b) => a.order - b.order)
  })

  const categoryOptions = computed(() => {
    return sortedCategories.value.map(cat => ({
      label: cat.name,
      value: cat._id,
      isCore: cat.isCore,
      disabled: !cat.isActive,
    }))
  })

  // 方法
  // 加载分类列表
  async function loadCategories(includeInactive = false) {
    try {
      loading.value = true
      const response = await newsCategoryService.getList(includeInactive)
      categories.value = response.data
    } catch (error: any) {
      message.error('加载分类列表失败：' + error.message)
    } finally {
      loading.value = false
    }
  }

  // 加载核心分类
  async function loadCoreCategories() {
    try {
      const response = await newsCategoryService.getCoreCategories()
      coreCategories.value = response.data
    } catch (error: any) {
      message.error('加载核心分类失败：' + error.message)
    }
  }

  // 创建分类
  async function createCategory(data: any) {
    try {
      loading.value = true
      await newsCategoryService.create(data)
      message.success('创建分类成功')
      await loadCategories()
    } catch (error: any) {
      message.error('创建分类失败：' + error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新分类
  async function updateCategory(id: string, data: any) {
    try {
      loading.value = true
      await newsCategoryService.update(id, data)
      message.success('更新分类成功')
      await loadCategories()
    } catch (error: any) {
      message.error('更新分类失败：' + error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 删除分类
  async function deleteCategory(id: string) {
    try {
      loading.value = true
      await newsCategoryService.delete(id)
      message.success('删除分类成功')
      await loadCategories()
    } catch (error: any) {
      message.error('删除分类失败：' + error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新分类排序
  async function updateCategoryOrder(orderedCategories: { id: string; order: number }[]) {
    try {
      loading.value = true
      await newsCategoryService.updateOrder(orderedCategories)
      message.success('更新排序成功')
      await loadCategories()
    } catch (error: any) {
      message.error('更新排序失败：' + error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    categories,
    coreCategories,
    loading,
    sortedCategories,
    categoryOptions,
    loadCategories,
    loadCoreCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    updateCategoryOrder,
  }
})
