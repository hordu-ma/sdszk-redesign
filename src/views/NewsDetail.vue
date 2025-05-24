<!-- NewsDetail.vue - 用于显示单个新闻文章详情 -->
<template>
  <div class="news-detail-container">
    <a-spin :spinning="loading" tip="加载中...">
      <!-- 面包屑导航 -->
      <div class="breadcrumb-nav">
        <a-breadcrumb>
          <a-breadcrumb-item>
            <router-link to="/">首页</router-link>
          </a-breadcrumb-item>
          <a-breadcrumb-item>
            <router-link to="/news">资讯中心</router-link>
          </a-breadcrumb-item>
          <a-breadcrumb-item>{{ newsData.title || '文章详情' }}</a-breadcrumb-item>
        </a-breadcrumb>
      </div>

      <!-- 文章标题 -->
      <div class="article-header">
        <h1 class="article-title">{{ newsData.title }}</h1>
        <div class="article-meta">
          <span class="meta-item">
            <i class="fas fa-calendar-alt"></i>
            {{ new Date(newsData.publishDate || newsData.createdAt).toLocaleDateString('zh-CN') }}
          </span>
          <span class="meta-item" v-if="newsData.author">
            <i class="fas fa-user"></i> {{ newsData.author }}
          </span>
          <span class="meta-item" v-if="newsData.source?.name">
            <i class="fas fa-bookmark"></i> {{ newsData.source.name }}
          </span>
          <span class="meta-item" v-if="newsData.viewCount">
            <i class="fas fa-eye"></i> 浏览 {{ newsData.viewCount }} 次
          </span>
        </div>
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
      <div class="related-articles" v-if="relatedNews.length > 0">
        <div class="block-header">
          <h3>
            <i class="fas fa-newspaper header-icon"></i>
            <span class="title-text">相关文章</span>
          </h3>
        </div>
        <ul class="styled-list">
          <li v-for="item in relatedNews" :key="item._id">
            <router-link :to="`/news/detail/${item._id}`" class="info-link">
              <div class="info-content">
                <div class="info-header">
                  <span class="info-title">{{ item.title }}</span>
                </div>
                <div class="info-footer">
                  <span class="info-date"
                    >发布日期：{{
                      new Date(item.publishDate || item.createdAt).toLocaleDateString('zh-CN')
                    }}</span
                  >
                </div>
              </div>
            </router-link>
          </li>
        </ul>
      </div>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { message, Breadcrumb } from 'ant-design-vue'
import { newsApi } from '@/api'

const route = useRoute()
const newsId = computed(() => route.params.id)
const loading = ref(false)

// 文章数据
const newsData = ref({
  _id: null,
  title: '',
  publishDate: '',
  author: '',
  source: null,
  summary: '',
  content: '',
  category: null,
  viewCount: 0,
})

// 相关文章
const relatedNews = ref([])

// 获取新闻数据
const fetchNewsData = async id => {
  loading.value = true
  try {
    const response = await newsApi.getDetail(id)
    if (response.status === 'success') {
      newsData.value = response.data
      // 获取相关文章（同一分类的其他文章）
      await fetchRelatedNews(response.data.category, response.data._id)
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
const fetchRelatedNews = async (categoryId, currentId) => {
  try {
    const response = await newsApi.getList({
      category: categoryId,
      limit: 5,
      isPublished: true,
    })

    if (response.status === 'success') {
      // 过滤掉当前文章
      relatedNews.value = response.data.filter(item => item._id !== currentId)
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

.breadcrumb-nav {
  margin-bottom: 20px;
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

.article-meta {
  color: #666;
  font-size: 14px;
}

.meta-item {
  margin-right: 15px;
}

.meta-item i {
  margin-right: 5px;
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

.block-header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.block-header h3 {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.header-icon {
  margin-right: 8px;
  color: #1890ff;
}

.related-articles {
  margin-top: 40px;
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 4px;
}

.styled-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.styled-list li {
  padding: 12px 0;
  border-bottom: 1px dashed #e8e8e8;
}

.styled-list li:last-child {
  border-bottom: none;
}

.info-link {
  display: block;
  text-decoration: none;
  color: #333;
}

.info-title {
  font-weight: 500;
  transition: color 0.3s;
}

.info-link:hover .info-title {
  color: #1890ff;
}

.info-footer {
  color: #999;
  font-size: 13px;
  margin-top: 5px;
}
</style>
