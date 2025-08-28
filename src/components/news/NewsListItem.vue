<template>
  <div class="news-item">
    <router-link :to="`/news/detail/${news.id}`" class="news-link">
      <div class="news-wrapper">
        <div class="date-block">
          <div class="day">
            {{ formatDateDay(news.publishDate || news.createdAt) }}
          </div>
          <div class="month-year">
            {{ formatDateMonthYear(news.publishDate || news.createdAt) }}
          </div>
        </div>
        <div class="news-content-inner">
          <h3 class="news-title">
            {{ news.title }}
          </h3>
          <div class="news-meta">
            <span
              class="category-tag"
              :class="`category-${news.categoryKey || 'center'}`"
            >
              {{ news.categoryName || "中心动态" }}
            </span>
            <span v-if="displayAuthor" class="news-author">作者：{{ displayAuthor }}</span>
            <span v-if="news.viewCount" class="news-views">阅读：{{ news.viewCount }}</span>
          </div>
          <p class="news-summary">
            {{ displaySummary }}
          </p>
        </div>
      </div>
    </router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import type { News } from "@/types/news";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

export default defineComponent({
  name: "NewsListItem",
  props: {
    news: {
      type: Object as () => any,
      required: true,
    },
  },
  setup(props) {
    // 优先显示摘要，无则取正文前100字
    const displaySummary = computed(() => {
      if (props.news.summary) return props.news.summary;
      if (props.news.content)
        return stripHtml(props.news.content).slice(0, 100) + "...";
      return "";
    });
    // 显示作者名
    const displayAuthor = computed(() => {
      const author = props.news.author as any;
      if (typeof author === "string") return author;
      if (author && (author.username || author.name)) {
        return author.username || author.name;
      }
      return "";
    });

    // 日期格式化 - 日
    const formatDateDay = (date: string) => {
      return new Date(date).getDate().toString().padStart(2, "0");
    };

    // 日期格式化 - 月年
    const formatDateMonthYear = (date: string) => {
      const d = new Date(date);
      return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    };

    return {
      displaySummary,
      displayAuthor,
      formatDateDay,
      formatDateMonthYear,
    };
  },
});
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
  background: linear-gradient(
    135deg,
    var(--primary-color) 0%,
    var(--primary-color-light) 100%
  );
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
  color: white;
  background-color: #1890ff;
}

.category-center {
  background-color: #2196f3;
}

.category-notice {
  background-color: #4caf50;
}

.category-policy {
  background-color: #ff9800;
}

.category-theory {
  background-color: #fa8c16;
}

.category-teaching {
  background-color: #eb2f96;
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
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
    line-clamp: 3;
  }
}
</style>
