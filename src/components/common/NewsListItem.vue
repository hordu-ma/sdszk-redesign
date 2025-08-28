<template>
  <div class="news-item">
    <div class="news-content">
      <h3 class="news-title">
        <router-link :to="`/news/detail/${news._id || news.id}`">
          {{ news.title }}
        </router-link>
      </h3>
      <p v-if="news.summary" class="news-summary">
        {{ news.summary }}
      </p>
      <div class="news-meta">
        <span class="news-date">
          {{ formatDate(news.publishDate || news.createdAt) }}
        </span>
        <span v-if="news.author" class="news-author">
          作者：{{ getAuthorName(news.author) }}
        </span>
        <span v-if="news.viewCount" class="news-views">
          阅读：{{ news.viewCount }}
        </span>
        <span v-if="getCategoryName(news.category)" class="news-category">
          分类：{{ getCategoryName(news.category) }}
        </span>
      </div>
    </div>
    <div v-if="news.cover" class="news-cover">
      <!-- eslint-disable-next-line vue/html-self-closing -->
      <img :src="news.cover" :alt="news.title" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { News } from "@/types/news";

interface Props {
  news: News;
}

defineProps<Props>();

// 格式化日期
const formatDate = (date: string): string => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// 获取作者名称
const getAuthorName = (author: News["author"]): string => {
  if (!author) return "";
  if (typeof author === "string") return author;
  if (typeof author === "object" && author.username) return author.username;
  if (typeof author === "object" && author.name) return author.name;
  return "";
};

// 获取分类名称
const getCategoryName = (category: News["category"]): string => {
  if (!category) return "";
  if (typeof category === "string") return category;
  if (typeof category === "object" && "name" in category) {
    return (category as { name?: string }).name || "";
  }
  return "";
};
</script>

<style scoped>
.news-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
}

.news-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
  border-color: #e6f7ff;
}

.news-content {
  flex: 1;
  min-width: 0;
}

.news-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.news-title a {
  color: #262626;
  text-decoration: none;
  transition: color 0.2s ease;
}

.news-title a:hover {
  color: #1890ff;
}

.news-summary {
  margin: 0 0 16px;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.news-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #999;
  font-size: 13px;
}

.news-meta span {
  display: flex;
  align-items: center;
}

.news-date::before {
  content: "📅";
  margin-right: 4px;
}

.news-author::before {
  content: "👤";
  margin-right: 4px;
}

.news-views::before {
  content: "👁";
  margin-right: 4px;
}

.news-category::before {
  content: "🏷";
  margin-right: 4px;
}

.news-cover {
  width: 200px;
  height: 120px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.news-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.news-item:hover .news-cover img {
  transform: scale(1.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .news-item {
    flex-direction: column;
    padding: 16px;
    gap: 16px;
  }

  .news-cover {
    width: 100%;
    height: 200px;
  }

  .news-title {
    font-size: 16px;
  }

  .news-meta {
    gap: 12px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .news-item {
    padding: 12px;
  }

  .news-cover {
    height: 180px;
  }

  .news-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
