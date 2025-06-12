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
    console.log('【调试】fetchNewsList 请求参数:', {
      page: currentPage.value,
      limit: pageSize.value,
      category: selectedCategory.value,
    })
    const response = await newsApi.getList({
      page: currentPage.value,
      limit: pageSize.value,
      category: selectedCategory.value || undefined,
    })

    if (response.success) {
      newsList.value = response.data
      total.value = response.pagination.total
    } else {
      message.error('获取新闻列表失败')
    }
  } catch (error) {
    console.error('获取新闻列表失败', error)
    message.error('获取新闻列表失败')
  } finally {
    loading.value = false
  }
}

const updateSelectedCategoryByRoute = () => {
  const key = route.path.split('/').pop() || ''
  console.log('【调试】当前路由key:', key)
  console.log(
    '【调试】categories.value 类型:',
    Array.isArray(categories.value),
    typeof categories.value
  )
  console.log('【调试】当前categories:', categories.value)
  if (categories.value.length > 0) {
    categories.value.forEach((c, i) => {
      console.log(`【调试】分类[${i}] key:`, c.key, typeof c.key)
    })
  }
  if (['center', 'notice', 'policy'].includes(key)) {
    const cat = categories.value.find((c: any) => c.key === key)
    console.log('【调试】匹配到的分类cat:', cat)
    if (cat) selectedCategory.value = cat._id
  } else {
    selectedCategory.value = ''
  }
}

const fetchCategories = async () => {
  try {
    const response = await newsCategoryApi.getList({ includeInactive: false })
    console.log('【调试】newsCategoryApi.getList返回：', response)
    console.log('【调试】response.data 类型:', Array.isArray(response.data), typeof response.data)
    console.log('【调试】response.data 详细:', response.data)
    if (response.success) {
      categories.value = (response.data as any).data
      console.log('【调试】赋值后的categories:', categories.value)
      updateSelectedCategoryByRoute()
    }
  } catch (error) {
    console.error('获取分类列表失败', error)
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
onMounted(() => {
  fetchCategories().then(fetchNewsList)
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
