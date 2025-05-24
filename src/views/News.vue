<template>
  <div class="news-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>资讯中心</h1>
      <p>大中小学思政课一体化教育相关新闻、通知、政策及研究资料</p>
    </div>

    <!-- 分类导航 -->
    <div class="category-nav">
      <a-tabs v-model:activeKey="activeCategory" @change="handleCategoryChange">
        <a-tab-pane key="all" tab="全部资讯"></a-tab-pane>
        <a-tab-pane
          v-for="category in categories"
          :key="category.key"
          :tab="category.name"
        ></a-tab-pane>
      </a-tabs>
    </div>

    <!-- 新闻列表 -->
    <div class="news-content">
      <a-spin :spinning="loading">
        <div class="news-list">
          <div v-for="news in filteredNews" :key="news._id" class="news-item">
            <router-link :to="`/news/detail/${news._id}`" class="news-link">
              <div class="news-wrapper">
                <div class="date-block">
                  <span class="day">{{ news.date.split('/')[1] || news.date.split('-')[2] }}</span>
                  <span class="month-year"
                    >{{ news.date.split('/')[0] || news.date.split('-')[1] }}/{{
                      news.date.split('/')[2] || news.date.split('-')[0].slice(2)
                    }}</span
                  >
                </div>
                <div class="news-content-inner">
                  <h3 class="news-title">{{ news.title }}</h3>
                  <div class="news-meta">
                    <span class="category-tag" :class="'category-' + news.categoryKey">{{
                      news.categoryName
                    }}</span>
                    <span v-if="news.author" class="news-author">{{ news.author }}</span>
                    <span v-if="news.source?.name" class="news-source">{{ news.source.name }}</span>
                  </div>
                  <p class="news-summary">{{ news.summary }}</p>
                </div>
              </div>
            </router-link>
          </div>
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
        <a-empty v-if="filteredNews.length === 0" description="暂无相关资讯" />
      </a-spin>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { newsApi, newsCategoryApi } from '@/api'

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
  if (route.query.category) {
    activeCategory.value = route.query.category
  }
  await Promise.all([fetchCategories(), fetchNews()])
})

// 监听分类变化，更新路由参数
watch(activeCategory, newCategory => {
  router.push({
    path: '/news',
    query: { ...(newCategory !== 'all' ? { category: newCategory } : {}) },
  })
  currentPage.value = 1
  fetchNews()
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
      isPublished: true,
    }

    // 如果有选择分类，添加分类筛选
    if (activeCategory.value !== 'all') {
      // 根据分类key查找分类ID
      const selectedCategory = categories.value.find(cat => cat.key === activeCategory.value)
      if (selectedCategory) {
        params.category = selectedCategory._id
      }
    }

    const response = await newsApi.getList(params)

    if (response.status === 'success') {
      newsList.value = response.data
      totalNews.value = response.pagination?.total || 0
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
    categoryKey: categories.value.find(cat => cat._id === news.category)?.key || 'center',
    categoryName: categories.value.find(cat => cat._id === news.category)?.name || '中心动态',
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
.news-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h1 {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  font-family: 'STZhongsong', 'Microsoft YaHei', sans-serif;
}

.page-header p {
  font-size: 16px;
  color: #666;
}

.category-nav {
  margin-bottom: 30px;
  border-bottom: 1px solid #eaeaea;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.news-item {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  overflow: hidden;
}

.news-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.12);
}

.news-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.news-wrapper {
  display: flex;
  padding: 20px;
}

.date-block {
  min-width: 80px;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  border-radius: 8px;
  flex-shrink: 0;
}

.date-block .day {
  font-size: 28px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 5px;
}

.date-block .month-year {
  font-size: 14px;
}

.news-content-inner {
  flex: 1;
}

.news-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  line-height: 1.5;
  transition: color 0.3s;
}

.news-item:hover .news-title {
  color: #9a2314;
}

.news-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 10px;
}

.category-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
  background-color: #1890ff;
}

.category-center {
  background-color: #1890ff;
}

.category-notice {
  background-color: #52c41a;
}

.category-policy {
  background-color: #722ed1;
}

.category-theory {
  background-color: #fa8c16;
}

.category-teaching {
  background-color: #eb2f96;
}

.news-author,
.news-source {
  font-size: 13px;
  color: #666;
}

.news-summary {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-top: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

@media (max-width: 768px) {
  .news-wrapper {
    flex-direction: column;
  }

  .date-block {
    margin-bottom: 15px;
    margin-right: 0;
    width: 60px;
    height: 60px;
  }

  .news-title {
    font-size: 16px;
  }

  .news-summary {
    -webkit-line-clamp: 3;
  }
}
</style>
