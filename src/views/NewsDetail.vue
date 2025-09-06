<!-- NewsDetail.vue - 用于显示单个新闻文章详情 -->
<template>
  <div class="news-detail-container">
    <a-spin :spinning="loading" tip="加载中...">
      <div v-if="newsData && newsData.id">
        <!-- 面包屑导航 -->
        <breadcrumb-nav :items="breadcrumbItems" />

        <!-- 文章标题 -->
        <div class="article-header">
          <h1 class="article-title">
            {{ newsData.title }}
          </h1>
          <article-meta
            :date="newsData.publishDate || newsData.createdAt"
            :author="
              typeof newsData.author === 'object'
                ? (newsData.author as any).username ||
                  (newsData.author as any).name ||
                  ''
                : newsData.author
            "
            :source="newsData.source?.name"
            :view-count="newsData.viewCount"
          />
        </div>

        <!-- 文章内容 -->
        <div class="article-content">
          <!-- 文章摘要 -->
          <div v-if="newsData.summary" class="article-summary">
            <p>{{ newsData.summary }}</p>
          </div>

          <!-- 主要内容 -->
          <div class="article-body" v-html="processedContent" />
        </div>

        <!-- 相关文章 -->
        <related-list
          v-if="relatedNews.length > 0"
          title="相关文章"
          icon="fas fa-newspaper"
          :items="relatedNews"
          link-prefix="/news/detail"
        />
      </div>

      <!-- 文章不存在的提示 -->
      <div v-else-if="!loading" class="not-found">
        <a-result
          status="404"
          title="文章未找到"
          sub-title="抱歉，您访问的文章不存在或已被删除。"
        >
          <template #extra>
            <a-button type="primary" @click="$router.push('/news')">
              返回新闻列表
            </a-button>
          </template>
        </a-result>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { message } from "ant-design-vue";
import { newsApi } from "@/api";
import BreadcrumbNav from "../components/common/BreadcrumbNav.vue";
import ArticleMeta from "../components/common/ArticleMeta.vue";
import RelatedList from "../components/common/RelatedList.vue";
import type { News } from "@/types/news";

const route = useRoute();
const newsId = computed(() => route.params.id as string);
const loading = ref(false);

// 面包屑导航项
const breadcrumbItems = computed(() => [
  { title: "首页", link: "/" },
  { title: "资讯中心", link: "/news" },
  { title: newsData.value.title || "文章详情" },
]);

// 文章数据
const newsData = ref<News>({
  id: "",
  title: "",
  content: "",
  status: "draft",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// 处理内容中的blob URL
const processedContent = computed(() => {
  if (!newsData.value.content) return "";

  // 将blob URL的图片标签替换为占位符
  return newsData.value.content
    .replace(
      /!\[([^\]]*)\]\(blob:https?:\/\/[^)]+\)/g,
      '<div class="image-placeholder">📷 图片暂不可用</div>',
    )
    .replace(
      /<img[^>]*src=["']blob:https?:\/\/[^"']*["'][^>]*>/gi,
      '<div class="image-placeholder">📷 图片暂不可用</div>',
    );
});

// 相关文章
const relatedNews = ref<Array<{ id: string; title: string; date: string }>>([]);

// 获取新闻数据
const fetchNewsData = async (id: string) => {
  loading.value = true;
  try {
    const response = await newsApi.instance.getDetail(id);
    console.log("新闻详情响应", response);

    // 检查API响应是否成功
    if (response.success) {
      const rawData = response.data;
      // 转换后端数据格式以匹配前端类型定义
      newsData.value = {
        ...rawData,
        id: rawData.id,
        author:
          typeof rawData.author === "object" && rawData.author
            ? (rawData.author as any).username || (rawData.author as any).name
            : rawData.author,
      };

      console.log("处理后的新闻数据", newsData.value);

      // 获取相关文章
      if (rawData.category) {
        await fetchRelatedNews(rawData.category, rawData.id);
      }
    } else {
      console.error("API响应失败:", response);
      message.error("找不到对应的文章");
    }
  } catch (error) {
    console.error("获取文章详情失败", error);
    message.error("获取文章详情失败");
  } finally {
    loading.value = false;
  }
};

// 获取相关文章
const fetchRelatedNews = async (_category: any, currentId: string) => {
  try {
    const response = await newsApi.instance.getList({
      limit: 5,
    });

    console.log("相关文章响应", response);

    if (response.success) {
      const articles = response.data || [];
      relatedNews.value = articles
        .filter((item: any) => (item._id || item.id) !== currentId)
        .slice(0, 4) // 只显示4篇相关文章
        .map((item: any) => ({
          id: item._id || item.id,
          title: item.title,
          date: item.publishDate || item.createdAt,
        }));
    }
  } catch (error) {
    console.error("获取相关文章失败", error);
  }
};

onMounted(() => {
  if (newsId.value) {
    fetchNewsData(newsId.value);
  }
});

// 监听路由参数的变化
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      fetchNewsData(newId as string);
      // 切换文章后滚动到页面顶部
      window.scrollTo(0, 0);
    }
  },
);
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

.not-found {
  text-align: center;
  padding: 60px 20px;
}

.not-found .ant-result {
  background: #fff;
}

.image-placeholder {
  display: inline-block;
  padding: 20px 40px;
  margin: 15px 0;
  background-color: #f5f5f5;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  text-align: center;
  color: #999;
  font-size: 16px;
  font-weight: 500;
}
</style>
