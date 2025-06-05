<template>
  <div class="news-item">
    <router-link :to="`/news/detail/${news._id}`" class="news-link">
      <div class="news-wrapper">
        <div class="date-block">
          <span class="day">{{ formattedDate.day }}</span>
          <span class="month-year">{{ formattedDate.month }}/{{ formattedDate.year }}</span>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface NewsSource {
  name: string
}

interface News {
  _id: string
  title: string
  summary: string
  author?: string
  source?: NewsSource
  categoryKey: string
  categoryName: string
  publishDate?: string
  createdAt: string
}

const props = defineProps<{
  news: News
}>()

const formattedDate = computed(() => {
  const date = new Date(props.news.publishDate || props.news.createdAt)
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: (date.getMonth() + 1).toString().padStart(2, '0'),
    year: date.getFullYear().toString().slice(2),
  }
})
</script>

<style scoped>
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
}

.date-block .day {
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
}

.date-block .month-year {
  font-size: 14px;
  margin-top: 4px;
}

.news-content-inner {
  flex: 1;
}

.news-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px;
  line-height: 1.4;
}

.news-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
}

.category-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: var(--primary-color-light);
  color: var(--primary-color);
}

.news-author,
.news-source {
  color: #666;
}

.news-summary {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
