# News Preview Component
<template>
  <div class="news-preview">
    <div class="news-preview-header">
      <h1 class="news-title">{{ news.title }}</h1>
      <div class="news-meta">
        <span v-if="news.category">
          <TagOutlined />
          {{ getCategory(news.categoryKey) }}
        </span>
        <span>
          <CalendarOutlined />
          {{ formatDate(news.publishDate) }}
        </span>
        <span v-if="news.author">
          <UserOutlined />
          {{ news.author }}
        </span>
        <span v-if="news.source">
          <LinkOutlined />
          {{ news.source }}
        </span>
      </div>
      <div v-if="news.tags && news.tags.length" class="news-tags">
        <template v-for="tag in news.tags" :key="tag">
          <a-tag>{{ tag }}</a-tag>
        </template>
      </div>
    </div>

    <div v-if="news.cover" class="news-cover">
      <img :src="news.cover" :alt="news.title" />
    </div>

    <div v-if="news.summary" class="news-summary">
      {{ news.summary }}
    </div>

    <div class="news-content" v-html="news.content"></div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { TagOutlined, CalendarOutlined, UserOutlined, LinkOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'

export default defineComponent({
  name: 'NewsPreview',

  components: {
    TagOutlined,
    CalendarOutlined,
    UserOutlined,
    LinkOutlined,
  },

  props: {
    news: {
      type: Object,
      required: true,
    },
    categories: {
      type: Array,
      default: () => [],
    },
  },

  setup(props) {
    const formatDate = date => {
      if (!date) return ''
      return dayjs(date).format('YYYY-MM-DD')
    }

    const getCategory = categoryKey => {
      const category = props.categories.find(c => c.key === categoryKey)
      return category ? category.name : categoryKey
    }

    return {
      formatDate,
      getCategory,
    }
  },
})
</script>

<style scoped>
.news-preview {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.news-preview-header {
  margin-bottom: 24px;
  text-align: center;
}

.news-title {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.news-meta {
  display: flex;
  justify-content: center;
  gap: 16px;
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 16px;
}

.news-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.news-tags {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.news-cover {
  margin-bottom: 24px;
  text-align: center;
}

.news-cover img {
  max-width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 8px;
}

.news-summary {
  font-size: 16px;
  color: #4b5563;
  margin-bottom: 24px;
  padding: 16px;
  background: #f3f4f6;
  border-radius: 8px;
  line-height: 1.6;
}

.news-content {
  font-size: 16px;
  line-height: 1.8;
  color: #1f2937;
}

.news-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 16px 0;
}

.news-content :deep(h1),
.news-content :deep(h2),
.news-content :deep(h3),
.news-content :deep(h4),
.news-content :deep(h5),
.news-content :deep(h6) {
  margin: 24px 0 16px;
  color: #111827;
}

.news-content :deep(p) {
  margin-bottom: 16px;
}

.news-content :deep(a) {
  color: #2563eb;
  text-decoration: none;
}

.news-content :deep(a:hover) {
  text-decoration: underline;
}

.news-content :deep(blockquote) {
  margin: 16px 0;
  padding: 8px 16px;
  border-left: 4px solid #e5e7eb;
  background: #f9fafb;
  color: #4b5563;
}

.news-content :deep(pre) {
  margin: 16px 0;
  padding: 16px;
  background: #1f2937;
  color: #f9fafb;
  border-radius: 4px;
  overflow-x: auto;
}

.news-content :deep(code) {
  font-family: monospace;
  padding: 2px 4px;
  background: #f3f4f6;
  border-radius: 4px;
}

.news-content :deep(ul),
.news-content :deep(ol) {
  margin: 16px 0;
  padding-left: 24px;
}

.news-content :deep(li) {
  margin-bottom: 8px;
}

@media (max-width: 640px) {
  .news-preview {
    padding: 16px;
  }

  .news-title {
    font-size: 24px;
  }

  .news-meta {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
}
</style>
