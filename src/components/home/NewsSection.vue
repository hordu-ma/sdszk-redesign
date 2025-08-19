<template>
  <div class="news-section">
    <div class="carousel-container">
      <el-carousel height="400px">
        <el-carousel-item v-for="item in carouselItems" :key="item.id">
          <div class="carousel-item-wrapper" @click="handleCarouselClick(item)">
            <img :src="item.image" :alt="item.title" class="carousel-img" />
            <div class="carousel-overlay">
              <div class="carousel-title">{{ item.title }}</div>
            </div>
          </div>
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
                {{ news.title }}
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
import { useRouter } from "vue-router";
import { newsApi, newsCategoryApi } from "@/api";
import carousel1 from "../../assets/images/carousel1.jpg";
import carousel2 from "../../assets/images/carousel2.jpg";
import carousel3 from "../../assets/images/carousel3.jpg";

interface CarouselItem {
  id: number;
  image: string;
  title: string;
  newsId?: string; // 添加新闻ID用于跳转
}

interface NewsItem {
  id: string;
  title: string;
  date: string;
}

const router = useRouter();

// 默认轮播图数据（作为后备）
const defaultCarouselItems: CarouselItem[] = [
  { id: 1, image: carousel1, title: "新闻1" },
  { id: 2, image: carousel2, title: "新闻2" },
  { id: 3, image: carousel3, title: "新闻3" },
];

const carouselItems = ref<CarouselItem[]>(defaultCarouselItems);
const centerNews = ref<NewsItem[]>([]);
const centerLoading = ref(true);

// 轮播图点击处理函数
const handleCarouselClick = (item: CarouselItem) => {
  if (item.newsId) {
    router.push(`/news/detail/${item.newsId}`);
  }
};

const fetchCenterNews = async () => {
  try {
    // 获取分类列表
    const categoryRes = await newsCategoryApi.instance.getList();
    if (!categoryRes.success) return;

    // 查找中心动态分类
    const centerCategory = categoryRes.data.find(
      (cat: any) => cat.key === "center",
    );
    if (!centerCategory) return;

    // 获取中心动态新闻（获取前3条用于轮播图）
    const newsRes = await newsApi.instance.getList({
      category: centerCategory._id,
      limit: 3,
    });

    if (newsRes.success && Array.isArray(newsRes.data)) {
      console.log("获取到的新闻数据:", newsRes.data);

      // 更新中心动态新闻列表
      centerNews.value = newsRes.data.map((item: any) => ({
        id: item._id || item.id,
        title: item.title,
        date: item.publishDate
          ? item.publishDate.slice(0, 10)
          : item.createdAt
            ? item.createdAt.slice(0, 10)
            : "",
      }));

      // 更新轮播图数据 - 使用获取到的新闻数据
      carouselItems.value = newsRes.data.map((item: any, index: number) => ({
        id: index + 1,
        image:
          item.thumbnail || defaultCarouselItems[index]?.image || carousel1,
        title: item.title,
        newsId: item._id || item.id, // 添加新闻ID用于跳转
      }));

      console.log("更新后的轮播图数据:", carouselItems.value);
      console.log("处理后的新闻数据:", centerNews.value);
    }
  } catch (error) {
    console.error("获取中心动态失败:", error);
    // 如果获取失败，使用默认轮播图数据
    carouselItems.value = defaultCarouselItems;
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

.carousel-item-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.carousel-item-wrapper:hover {
  transform: scale(1.02);
}

.carousel-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 20px;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.carousel-item-wrapper:hover .carousel-overlay {
  transform: translateY(0);
}

.carousel-title {
  color: white;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  line-height: 1.4;
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
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  padding: 10px 20px;
  background: linear-gradient(to right, #9a2314, #c44836);
  margin: 0;
  border-radius: 0;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  line-height: 1.3;
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
  gap: 8px;
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px 20px 20px;
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
  gap: 0;
  padding: 15px;
  border-radius: 8px;
  transition: all 0.3s ease;
  height: 96px;
  align-items: flex-start;
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
  width: 70px;
  height: 66px;
  padding: var(--spacing-sm);
  background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
  border-radius: var(--border-radius-base);
  box-shadow: 0 2px 8px rgba(229, 57, 53, 0.2);
  color: #ffffff;
  transition: var(--transition-base);
  flex-shrink: 0;
  align-self: flex-start;
  margin: 0;
  margin-right: 15px;
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
  height: 66px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  align-self: flex-start;
  padding: 10px 15px;
  margin: 0;
  background: linear-gradient(135deg, #9a2314 0%, #c44836 100%);
  border-radius: var(--border-radius-base);
  color: #ffffff;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  white-space: normal;
  word-wrap: break-word;
  text-align: left;
  transition: var(--transition-base);
}

.news-wrapper:hover .news-content {
  color: rgba(255, 255, 255, 0.9);
}

.no-data {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 40px 20px;
}
</style>
