import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ResourceCategory } from '@/api/modules/resourceCategory'
import { ResourceCategoryService } from '@/services/resourceCategory.service'
import { message } from 'ant-design-vue'

const resourceCategoryService = new ResourceCategoryService()

export const useResourceCategoryStore = defineStore('resourceCategory', () => {
  // 状态
  const categories = ref<ResourceCategory[]>([])
  const loading = ref(false)

  // 计算属性
  const sortedCategories = computed(() => {
    return [...categories.value].sort((a, b) => a.order - b.order)
  })

  const categoryOptions = computed(() => {
    return sortedCategories.value.map(cat => ({
      label: cat.name,
      value: cat._id,
      disabled: !cat.isActive,
    }))
  })

  // 方法
  // 加载分类列表
  async function loadCategories(includeInactive = false) {
    try {
      loading.value = true
      const response = await resourceCategoryService.getList(includeInactive)
      categories.value = response.data
    } catch (error: any) {
      message.error('加载分类列表失败：' + error.message)
    } finally {
      loading.value = false
    }
  }

  // 创建分类
  async function createCategory(data: any) {
    try {
      loading.value = true
      await resourceCategoryService.create(data)
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
      await resourceCategoryService.update(id, data)
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
      await resourceCategoryService.delete(id)
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
      await resourceCategoryService.updateOrder(orderedCategories)
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
    loading,
    sortedCategories,
    categoryOptions,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    updateCategoryOrder,
  }
})
