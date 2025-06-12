<!-- NewsDetail.vue - 用于显示单个新闻文章详情 -->
<template>
  <div v-if="newsData" class="news-detail-container">
    <a-spin :spinning="loading" tip="加载中...">
      <!-- 面包屑导航 -->
      <breadcrumb-nav :items="breadcrumbItems" />

      <!-- 文章标题 -->
      <div class="article-header">
        <h1 class="article-title">{{ newsData.title }}</h1>
        <article-meta
          :date="newsData.publishDate || newsData.createdAt"
          :author="
            typeof newsData.author === 'object'
              ? (newsData.author as any).username || (newsData.author as any).name || ''
              : newsData.author
          "
          :source="newsData.source?.name"
          :view-count="newsData.viewCount"
        />
      </div>

      <!-- 文章内容 -->
      <div class="article-content">
        <!-- 文章摘要 -->
        <div class="article-summary" v-if="newsData.summary">
          <p>{{ newsData.summary }}</p>
        </div>

        <!-- 主要内容 -->
        <div class="article-body" v-html="newsData.content"></div>
      </div>

      <!-- 相关文章 -->
      <related-list
        v-if="relatedNews.length > 0"
        title="相关文章"
        icon="fas fa-newspaper"
        :items="relatedNews"
        link-prefix="/news/detail"
      />
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { newsApi } from '@/api'
import BreadcrumbNav from '../components/common/BreadcrumbNav.vue'
import ArticleMeta from '../components/common/ArticleMeta.vue'
import RelatedList from '../components/common/RelatedList.vue'
import type { News, NewsResponse, NewsListResponse } from '@/types/news'

const route = useRoute()
const newsId = computed(() => route.params.id as string)
const loading = ref(false)

// 面包屑导航项
const breadcrumbItems = computed(() => [
  { title: '首页', link: '/' },
  { title: '资讯中心', link: '/news' },
  { title: newsData.value.title || '文章详情' },
])

// 文章数据
const newsData = ref<News>({
  id: '',
  title: '',
  content: '',
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

// 相关文章
const relatedNews = ref<Array<{ id: string; title: string; date: string }>>([])

// 获取新闻数据
const fetchNewsData = async (id: string) => {
  loading.value = true
  try {
    const response = await newsApi.getDetail(id)
    console.log('新闻详情响应', response)
    // 兼容不同响应结构
    const resData = response.data || (response as any)
    if ((resData as any) && ((resData as any).success || (resData as any).status === 'success')) {
      newsData.value = (resData as any).data
      // 获取相关文章（同一分类的其他文章）
      if ((resData as any).data && (resData as any).data.category) {
        await fetchRelatedNews(
          (resData as any).data.category,
          (resData as any).data.id || (resData as any).data._id
        )
      }
    } else {
      message.error('找不到对应的文章')
    }
  } catch (error) {
    console.error('获取文章详情失败', error)
    message.error('获取文章详情失败')
  } finally {
    loading.value = false
  }
}

// 获取相关文章
const fetchRelatedNews = async (_category: any, currentId: string) => {
  try {
    const response = await newsApi.getList({
      limit: 5,
    })
    const resData = (response.data || response) as any
    if (resData && (resData.success || resData.status === 'success')) {
      relatedNews.value = resData.data
        .filter((item: any) => (item.id || item._id) !== currentId)
        .map((item: any) => ({
          id: item.id || item._id,
          title: item.title,
          date: item.publishDate || item.createdAt,
        }))
    }
  } catch (error) {
    console.error('获取相关文章失败', error)
  }
}

onMounted(() => {
  if (newsId.value) {
    fetchNewsData(newsId.value)
  }
})
</script>

<style scoped>
.news-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.article-header {
  margin-bottom: 30px;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 15px;
}

.article-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.article-content {
  line-height: 1.8;
}

.article-summary {
  background-color: #f8f9fa;
  padding: 15px;
  border-left: 4px solid #1890ff;
  margin-bottom: 25px;
  font-size: 16px;
}

.article-body {
  font-size: 16px;
}

.article-body p {
  margin-bottom: 20px;
}

.image-container {
  margin: 30px 0;
  text-align: center;
}

.image-container img {
  max-width: 100%;
  border-radius: 4px;
}

.image-caption {
  color: #666;
  font-size: 14px;
  margin-top: 8px;
}
</style>
