<!-- NewsListItem.vue - 新闻列表项组件 -->
<template>
  <div class="news-item">
    <div class="news-content">
      <h3 class="news-title">
        <router-link :to="`/news/detail/${news.id}`">{{ news.title }}</router-link>
      </h3>
      <p class="news-summary" v-if="news.summary">{{ news.summary }}</p>
      <div class="news-meta">
        <span class="news-date">{{ formatDate(news.publishDate || news.createdAt) }}</span>
        <span class="news-author" v-if="news.author">作者：{{ news.author }}</span>
        <span class="news-views" v-if="news.viewCount">阅读：{{ news.viewCount }}</span>
      </div>
    </div>
    <div class="news-cover" v-if="news.cover">
      <img :src="news.cover" :alt="news.title" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { News } from '@/types/news'

export default defineComponent({
  name: 'NewsListItem',
  props: {
    news: {
      type: Object as () => News,
      required: true,
    },
  },
  methods: {
    formatDate(date: string) {
      return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    },
  },
})
</script>

<style scoped>
.news-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.news-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
  transform: translateY(-2px);
}

.news-content {
  flex: 1;
  min-width: 0;
}

.news-title {
  margin: 0 0 12px;
  font-size: 18px;
  line-height: 1.4;
}

.news-title a {
  color: var(--text-color);
  text-decoration: none;
}

.news-title a:hover {
  color: var(--primary-color);
}

.news-summary {
  margin: 0 0 12px;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-meta {
  display: flex;
  gap: 16px;
  color: var(--text-secondary);
  font-size: 13px;
}

.news-cover {
  width: 200px;
  height: 120px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
}

.news-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 768px) {
  .news-item {
    flex-direction: column;
  }

  .news-cover {
    width: 100%;
    height: 200px;
  }
}
</style>
