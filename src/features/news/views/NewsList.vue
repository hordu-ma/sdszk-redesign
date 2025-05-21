<template>
  <div class="news-list-wrapper">
    <a-spin :spinning="loading">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <a-input-search
          v-model:value="searchKeyword"
          placeholder="搜索新闻..."
          style="width: 300px"
          @search="handleSearch"
        />
      </div>
      <!-- 新闻列表 -->
      <div class="news-list">
        <a-list :dataSource="items" :loading="loading" itemLayout="vertical">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #title>
                  <router-link :to="'/news/detail/' + item.id">
                    {{ item.title }}
                  </router-link>
                </template>
                <template #description>
                  <div class="news-meta">
                    <span v-if="item.author"> <UserOutlined /> {{ item.author }} </span>
                    <span>
                      <CalendarOutlined />
                      {{ formatDate(item.publishDate) }}
                    </span>
                    <span v-if="item.source">
                      <LinkOutlined />
                      {{ item.source }}
                    </span>
                    <span> <EyeOutlined /> {{ item.viewCount || 0 }} </span>
                  </div>
                </template>
              </a-list-item-meta>
              <div class="news-content">
                <div class="news-summary" v-if="item.summary">
                  {{ item.summary }}
                </div>
                <div v-if="item.thumbnail" class="news-thumbnail">
                  <img :src="item.thumbnail" :alt="item.title" />
                </div>
              </div>
            </a-list-item>
          </template>
        </a-list>
      </div>
      <!-- 分页器 -->
      <div class="pagination-wrapper">
        <a-pagination
          v-model:current="currentPage"
          :total="total"
          :pageSize="pageSize"
          show-quick-jumper
          @change="handlePageChange"
        />
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { UserOutlined, CalendarOutlined, LinkOutlined, EyeOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { useNewsStore } from '@/stores/news'
import type { News } from '@/types/news'

const route = useRoute()
const newsStore = useNewsStore()

// 状态
const loading = computed(() => newsStore.loading)
const items = computed(() => newsStore.items)
const total = computed(() => newsStore.total)
const currentPage = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')

// 获取当前分类
const category = route.path.split('/').pop()

// 监听路由变化
watch(
  () => route.path,
  () => {
    // 重置分页和搜索条件
    currentPage.value = 1
    searchKeyword.value = ''
    // 加载新数据
    loadNews()
  }
)

// 加载新闻数据
const loadNews = async () => {
  try {
    await newsStore.fetchList({
      page: currentPage.value,
      limit: pageSize.value,
      category,
      keyword: searchKeyword.value,
    })
  } catch (error) {
    console.error('加载新闻失败:', error)
  }
}

// 处理页码变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadNews()
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  loadNews()
}

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD')
}

// 初始加载
onMounted(() => {
  loadNews()
})
</script>

<style scoped>
.news-list-wrapper {
  padding: 24px;
}
.search-bar {
  margin-bottom: 24px;
}
.news-list {
  background: #fff;
  padding: 24px;
  margin-bottom: 24px;
  border-radius: 4px;
}
.news-meta {
  display: flex;
  gap: 16px;
  color: rgba(0, 0, 0, 0.45);
}
.news-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.news-content {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}
.news-summary {
  flex: 1;
  color: rgba(0, 0, 0, 0.65);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.news-thumbnail {
  flex-shrink: 0;
  width: 200px;
  height: 120px;
  overflow: hidden;
  border-radius: 4px;
}
.news-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.pagination-wrapper {
  text-align: center;
  margin-top: 24px;
}
</style>
