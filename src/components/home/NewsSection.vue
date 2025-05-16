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
      <BlockHeader
        title="中心动态"
        icon-class="fa-newspaper"
        more-link="/news/center"
      />
      <div class="news-container">
        <div v-for="news in centerNews" :key="news.id" class="news-item">
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineComponent } from "vue";
import { default as BlockHeader } from "../common/BlockHeader.vue";
import carousel1 from "../../assets/images/carousel1.jpg";
import carousel2 from "../../assets/images/carousel2.jpg";
import carousel3 from "../../assets/images/carousel3.jpg";

interface CarouselItem {
  id: number;
  image: string;
  title: string;
}

interface NewsItem {
  id: number;
  title: string;
  date: string;
  url: string;
  summary: string;
}

const carouselItems = ref<CarouselItem[]>([
  { id: 1, image: carousel1, title: "新闻1" },
  { id: 2, image: carousel2, title: "新闻2" },
  { id: 3, image: carousel3, title: "新闻3" },
]);

const centerNews = ref<NewsItem[]>([
  {
    id: 1,
    title: "校际协同，星辰引航：'星空下的思政课'开讲",
    date: "2025-04-29",
    url: "https://www.sdszk.cn/home/information/item/2/87",
    summary:
      "青岛理工大学马克思主义学院、理学院联合青岛第五十三中学教育集团，举办'星空下的思政课'大中小学一体化课程思政实践，共同探索大中小学一体化课程思政新方式。",
  },
  {
    id: 2,
    title: "菏泽家政职业学院组织开展大中小学乡村振兴劳动教育实践活动",
    date: "2025-04-26",
    url: "https://www.sdszk.cn/home/information/item/2/85",
    summary:
      "菏泽家政职业学院依托菏泽市大中小学思政课一体化建设共同体平台，组织大中小学学生走进全国文明村、全国乡村治理示范村——单县龙王庙镇刘土城村，开展了以'劳动铸魂 青春筑梦'为主题的乡村振兴劳动教育实践活动。",
  },
  {
    id: 3,
    title: "济宁市新时代学校思政课建设推进会召开",
    date: "2025-04-20",
    url: "https://www.sdszk.cn/home/information/item/2/84",
    summary:
      "济宁市新时代学校思政课建设推进会召开，市委常委、宣传部部长董冰出席并讲话，副市长宫晓芳主持会议。",
  },
]);

const formatDay = (date: string): string => date.split("-")[2];
const formatMonthYear = (date: string): string => {
  const parts = date.split("-");
  return `${parts[1]}/${parts[0].slice(2)}`;
};
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
  background: var(--background-color);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  overflow: hidden;
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
  transition: transform 0.3s ease, box-shadow 0.3s ease;
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
</style>
