<!-- NewsList.vue - 新闻列表页面 -->
<template>
  <page-layout title="资讯中心" description="了解最新动态和重要信息">
    <template #header>
      <section-header
        title="资讯中心"
        description="了解最新动态和重要信息"
        icon="fas fa-newspaper"
      />
    </template>

    <template #content>
      <div class="news-list-container">
        <!-- 分类筛选 -->
        <div class="category-filter">
          <a-radio-group v-model:value="selectedCategory" button-style="solid">
            <a-radio-button value="">全部</a-radio-button>
            <a-radio-button
              v-for="category in categories"
              :key="category._id"
              :value="category._id"
            >
              {{ category.name }}
            </a-radio-button>
          </a-radio-group>
        </div>

        <!-- 新闻列表 -->
        <div class="news-list">
          <a-spin :spinning="loading">
            <template v-if="newsList.length > 0">
              <news-list-item v-for="news in newsList" :key="news.id" :news="news" />
            </template>
            <a-empty v-else description="暂无新闻" />
          </a-spin>
        </div>

        <!-- 分页 -->
        <div class="pagination">
          <a-pagination
            v-model:current="currentPage"
            :total="total"
            :page-size="pageSize"
            show-quick-jumper
            show-size-changer
            :page-size-options="['10', '20', '30', '50']"
            @change="handlePageChange"
            @showSizeChange="handleSizeChange"
          />
        </div>
      </div>
    </template>
  </page-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { newsApi, newsCategoryApi } from '@/api'
import type { News, NewsCategory } from '@/types/news'
import PageLayout from '@/components/common/PageLayout.vue'
import SectionHeader from '@/components/common/SectionHeader.vue'
import NewsListItem from '@/components/common/NewsListItem.vue'

// 状态定义
const loading = ref(false)
const newsList = ref<News[]>([])
const categories = ref<NewsCategory[]>([])
const selectedCategory = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const route = useRoute()

// 获取新闻列表
const fetchNewsList = async () => {
  loading.value = true
  try {
    console.log(
      '【调试】fetchNewsList 请求参数:',
      JSON.stringify({
        page: currentPage.value,
        limit: pageSize.value,
        category: selectedCategory.value,
      })
    )
    const response = await newsApi.getList({
      page: currentPage.value,
      limit: pageSize.value,
      category: selectedCategory.value || undefined,
    })

    // 根据curl测试，新闻API返回 {success: true, data: [...], pagination: {...}}
    console.log('【调试】fetchNewsList API响应:', response)
    console.log('【调试】response.data 类型:', Array.isArray(response.data))
    console.log('【调试】response.pagination:', (response as any).pagination)

    if ((response as any).success && Array.isArray(response.data)) {
      newsList.value = response.data
      total.value = (response as any).pagination?.total || 0
      console.log('【调试】成功获取新闻列表，数量:', response.data.length, '总数:', total.value)
    } else if (
      (response as any).data &&
      (response as any).data.success &&
      Array.isArray((response as any).data.data)
    ) {
      // 处理嵌套响应格式 {data: {success: true, data: [...], pagination: {...}}}
      newsList.value = (response as any).data.data
      total.value = (response as any).data.pagination?.total || 0
      console.log(
        '【调试】成功获取新闻列表(嵌套格式)，数量:',
        (response as any).data.data.length,
        '总数:',
        total.value
      )
    } else {
      console.error('获取新闻列表失败，API响应:', response)
      console.log('【调试】response.success:', (response as any).success)
      console.log('【调试】response.data 是否为数组:', Array.isArray(response.data))
      newsList.value = []
      total.value = 0
      message.error('获取新闻列表失败')
    }
  } catch (error) {
    console.error('获取新闻列表失败', error)
    message.error('获取新闻列表失败')
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const response = await newsCategoryApi.getList({ includeInactive: false })
    console.log('【调试】newsCategoryApi.getList返回：', response)
    console.log('【调试】response.data 详细:', response.data)

    // 根据控制台显示，response.data 包含 {status: "success", data: [...]}
    if (
      (response as any).data &&
      (response as any).data.status === 'success' &&
      Array.isArray((response as any).data.data)
    ) {
      categories.value = (response as any).data.data
      console.log('【调试】成功设置categories.value，数量:', categories.value.length)
      updateSelectedCategoryByRoute()
    } else {
      console.error('分类数据格式不符合预期:', response)
      categories.value = []
    }
  } catch (error) {
    console.error('获取分类列表失败', error)
    categories.value = []
    message.error('获取分类列表失败')
  }
}

const updateSelectedCategoryByRoute = () => {
  console.log('【调试】updateSelectedCategoryByRoute 被调用')
  console.log('【调试】当前路由路径:', route.path)
  console.log('【调试】categories.value 数量:', categories.value?.length || 0)

  // 确保 categories.value 是有效数组
  if (!Array.isArray(categories.value) || categories.value.length === 0) {
    console.warn('categories.value 不是有效数组或为空，跳过分类匹配')
    selectedCategory.value = ''
    return
  }

  // 从路由路径中提取分类key
  const pathParts = route.path.split('/')
  const key = pathParts[pathParts.length - 1] || ''
  console.log('【调试】从路径提取的key:', key)

  // 打印所有分类信息
  categories.value.forEach((c, i) => {
    console.log(`【调试】分类[${i}]:`, { key: c.key, name: c.name, _id: c._id })
  })

  if (['center', 'notice', 'policy'].includes(key)) {
    const cat = categories.value.find((c: any) => {
      return c.key && String(c.key).toLowerCase() === key.toLowerCase()
    })
    console.log('【调试】匹配到的分类:', cat)
    if (cat && cat._id) {
      selectedCategory.value = cat._id
      console.log('【调试】设置selectedCategory为:', cat._id)
    } else {
      console.warn(`未找到匹配的分类，key: ${key}`)
      selectedCategory.value = ''
    }
  } else {
    console.log('【调试】路径不包含分类key，设置为空')
    selectedCategory.value = ''
  }
}

// 处理分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchNewsList()
}

// 处理每页条数变化
const handleSizeChange = (current: number, size: number) => {
  currentPage.value = 1
  pageSize.value = size
  fetchNewsList()
}

// 监听分类变化
watch(selectedCategory, () => {
  currentPage.value = 1
  fetchNewsList()
})

watch(
  () => route.path,
  () => {
    updateSelectedCategoryByRoute()
    fetchNewsList()
  }
)

// 初始化
onMounted(async () => {
  console.log('【调试】NewsList 组件初始化开始')
  try {
    // 先获取分类数据
    await fetchCategories()
    // 分类数据获取完成后再获取新闻列表
    await fetchNewsList()
    console.log('【调试】NewsList 组件初始化完成')
  } catch (error) {
    console.error('【调试】NewsList 组件初始化失败:', error)
    message.error('页面初始化失败')
  }
})
</script>

<style scoped>
.news-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.category-filter {
  margin-bottom: 24px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.news-list {
  margin-bottom: 24px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
