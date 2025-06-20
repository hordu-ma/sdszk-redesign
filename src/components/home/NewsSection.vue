<template>
  <div class="news-section">
    <div class="carousel-container">
      <el-carousel height="400px">
        <el-carousel-item v-for="item in carouselItems" :key="item.id">
          <img :src="item.image" :alt="item.title" class="carousel-img" />
        </el-carousel-item>
      </el-carousel>
    </div>
    <div class="center-news">
      <h3>
        <i class="fas fa-newspaper header-icon"></i>
        <span class="title-text">中心动态</span>
        <router-link to="/news?category=center" class="more-link">
          更多<i class="fas fa-angle-right"></i>
        </router-link>
      </h3>
      <div class="news-container">
        <div
          v-for="news in centerNews as any[]"
          :key="news.id"
          class="news-item"
        >
          <router-link :to="`/news/detail/${news.id}`" class="news-link">
            <div class="news-wrapper">
              <div class="date-block">
                <span class="day">{{ formatDay(news.date) }}</span>
                <span class="month-year">{{ formatMonthYear(news.date) }}</span>
              </div>
              <div class="news-content">
                <h3 class="news-title">{{ news.title }}</h3>
                <p class="news-summary">{{ news.summary }}</p>
              </div>
            </div>
          </router-link>
        </div>
        <div v-if="!centerLoading && centerNews.length === 0" class="no-data">
          暂无中心动态
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { newsApi, newsCategoryApi } from "@/api";
import carousel1 from "../../assets/images/carousel1.jpg";
import carousel2 from "../../assets/images/carousel2.jpg";
import carousel3 from "../../assets/images/carousel3.jpg";

interface CarouselItem {
  id: number;
  image: string;
  title: string;
}

interface NewsItem {
  id: string;
  title: string;
  date: string;
  summary: string;
}

const carouselItems = ref<CarouselItem[]>([
  { id: 1, image: carousel1, title: "新闻1" },
  { id: 2, image: carousel2, title: "新闻2" },
  { id: 3, image: carousel3, title: "新闻3" },
]);

const centerNews = ref<NewsItem[]>([]);
const centerLoading = ref(true);

const fetchCenterNews = async () => {
  try {
    // 获取分类列表
    const categoryRes = await newsCategoryApi.getList();
    if (!categoryRes.success) return;

    // 查找中心动态分类
    const centerCategory = categoryRes.data.find((cat: any) => cat.key === "center");
    if (!centerCategory) return;

    // 获取中心动态新闻
    const newsRes = await newsApi.getList({
      category: centerCategory._id,
      limit: 3,
    });

    if (newsRes.success && Array.isArray(newsRes.data)) {
      centerNews.value = newsRes.data.map((item: any) => ({
        id: item._id || item.id,
        title: item.title,
        date: item.publishDate
          ? item.publishDate.slice(0, 10)
          : item.createdAt
            ? item.createdAt.slice(0, 10)
            : "",
        summary: item.summary || "",
      }));
    }
  } catch (error) {
    console.error("获取中心动态失败:", error);
  } finally {
    centerLoading.value = false;
  }
};

const formatDay = (date: string): string => date.split("-")[2] || "";
const formatMonthYear = (date: string): string => {
  const parts = date.split("-");
  return parts.length >= 2 ? `${parts[1]}/${parts[0].slice(2)}` : "";
};

onMounted(() => {
  fetchCenterNews();
});
</script>

<style scoped>
.news-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.carousel-container {
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: var(--card-shadow);
}

.carousel-img {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

.center-news {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  height: 400px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.center-news h3 {
  font-family:
    "STZhongsong", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB",
    "Heiti SC", sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  padding: 12px 20px;
  background: linear-gradient(to right, #9a2314, #c44836);
  margin: 0;
  border-radius: 0;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.center-news .header-icon {
  margin-right: 10px;
  color: #fff;
}

.center-news .title-text {
  flex: 1;
}

.center-news .more-link {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.center-news .more-link:hover {
  color: #fff;
}

.center-news .more-link i {
  margin-left: 5px;
}

.news-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 1;
  overflow-y: auto;
  padding: 0 20px;
}

.news-container::-webkit-scrollbar {
  width: 6px;
}

.news-container::-webkit-scrollbar-track {
  background: var(--scrollbar-track-color, #f1f1f1);
  border-radius: 3px;
}

.news-container::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 3px;
}

.news-container::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color-dark);
}

.news-item {
  background: var(--background-color);
  border-radius: 8px;
  box-shadow: var(--card-shadow-sm);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.news-link {
  text-decoration: none;
  color: inherit;
}

.news-wrapper {
  display: flex;
  gap: 25px;
  padding: 15px 15px 15px 5px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.news-wrapper:hover {
  transform: translateX(5px);
  box-shadow: var(--card-shadow-hover);
}

.date-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  height: 70px;
  padding: var(--spacing-sm);
  background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
  border-radius: var(--border-radius-base);
  box-shadow: 0 2px 8px rgba(229, 57, 53, 0.2);
  color: #ffffff;
  transition: var(--transition-base);
}

.news-wrapper:hover .date-block {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(229, 57, 53, 0.3);
  background: linear-gradient(135deg, #c62828 0%, #e53935 100%);
}

.day {
  font-size: var(--font-size-huge);
  font-weight: 700;
  line-height: 1;
  margin-bottom: var(--spacing-xs);
  font-family: var(--font-family-number);
}

.month-year {
  font-size: var(--font-size-sm);
  font-weight: 500;
  opacity: 0.95;
  letter-spacing: 0.5px;
}

.news-content {
  flex: 1;
}

.news-title {
  margin: 0 0 var(--spacing-sm);
  font-size: var(--font-size-md);
  font-weight: 500;
  color: var(--text-color);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  transition: var(--transition-base);
}

.news-wrapper:hover .news-title {
  color: var(--primary-color);
}

.news-summary {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--text-color-light);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.no-data {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 40px 20px;
}
</style>
