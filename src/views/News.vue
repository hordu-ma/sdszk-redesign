<template>
  <page-layout
    title="资讯中心"
    description="大中小学思政课一体化教育相关新闻、通知、政策及研究资料"
  >
    <div class="news-content">
      <!-- 分类导航 -->
      <div class="category-nav">
        <a-tabs
          v-model:activeKey="activeCategory"
          @change="handleCategoryChange"
        >
          <a-tab-pane key="all" tab="全部资讯"></a-tab-pane>
          <a-tab-pane
            v-for="category in categories"
            :key="category.key"
            :tab="category.name"
          ></a-tab-pane>
        </a-tabs>
      </div>

      <!-- 新闻列表 -->
      <div class="news-list">
        <a-spin :spinning="loading">
          <div class="news-items">
            <news-list-item
              v-for="news in filteredNews"
              :key="news._id"
              :news="news"
            />
          </div>

          <!-- 分页 -->
          <div class="pagination-container" v-if="totalNews > 0">
            <a-pagination
              v-model:current="currentPage"
              :total="totalNews"
              :pageSize="pageSize"
              @change="handlePageChange"
              show-less-items
            />
          </div>

          <!-- 无数据提示 -->
          <a-empty
            v-if="filteredNews.length === 0"
            description="暂无相关资讯"
          />
        </a-spin>
      </div>
    </div>
  </page-layout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { newsApi, newsCategoryApi } from '@/api'
import PageLayout from '../components/common/PageLayout.vue'
import NewsListItem from '../components/news/NewsListItem.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const activeCategory = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const totalNews = ref(0)

// 数据状态
const newsList = ref([])
const categories = ref([])

// 初始化时从路由参数获取分类
onMounted(async () => {
  await fetchCategories() // 先获取分类
  if (route.query.category) {
    activeCategory.value = route.query.category as string
  } else {
    // 确保初始数据加载
    fetchNews()
  }
})

// 监听路由查询参数变化
watch(() => route.query.category, (newCategory) => {
  const targetCategory = (newCategory as string) || 'all';
  if (activeCategory.value !== targetCategory) {
    activeCategory.value = targetCategory;
  }
}, { immediate: false });

// 监听分类变化，更新路由参数
watch(activeCategory, newCategory => {
  const currentQueryCategory = route.query.category || 'all';
  // 只有当分类真正变化时才更新路由
  if (newCategory !== currentQueryCategory) {
    router.push({
      path: '/news',
      query: { ...(newCategory !== 'all' ? { category: newCategory } : {}) },
    });
  }
  currentPage.value = 1;
  fetchNews();
})

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await newsCategoryApi.getList()
    if (response.status === 'success') {
      categories.value = response.data
    }
  } catch (error) {
    console.error('获取分类失败:', error)
    message.error('获取分类失败')
  }
}

// 获取新闻数据
const fetchNews = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
    }

    // 如果有选择分类，添加分类筛选
    if (activeCategory.value !== 'all') {
      // 根据分类key查找分类ID
      const selectedCategory = categories.value.find(cat => cat.key === activeCategory.value)
      if (selectedCategory) {
        params.category = selectedCategory._id
      } else {
        console.warn('未找到分类:', activeCategory.value, '可用分类:', categories.value)
      }
    }

    const response = await newsApi.getList(params)
    console.log('新闻接口响应', response)

    if (response.success) {
      newsList.value = response.data.map(item => ({
        ...item,
        id: item._id // 映射字段
      }))
      totalNews.value = response.pagination?.total || 0
    } else {
      message.error('获取新闻失败')
    }
  } catch (error) {
    console.error('获取新闻失败:', error)
    message.error('获取新闻失败')
  } finally {
    loading.value = false
  }
}

// 计算显示的新闻列表
const filteredNews = computed(() => {
  return newsList.value.map(news => ({
    ...news,
    // 格式化显示数据
    date: new Date(news.publishDate || news.createdAt).toLocaleDateString('zh-CN'),
    categoryKey: news.category?.key || 'center',
    categoryName: news.category?.name || '中心动态',
  }))
})

// 分类变更处理
const handleCategoryChange = key => {
  activeCategory.value = key
}

// 分页变更处理
const handlePageChange = page => {
  currentPage.value = page
  fetchNews()
  window.scrollTo(0, 0) // 回到顶部
}
</script>

<style scoped>
.news-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.category-nav {
  margin-bottom: 24px;
  background: #fff;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.news-list {
  margin-top: 24px;
}

.news-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
