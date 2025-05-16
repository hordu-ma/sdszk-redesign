<template>
  <div class="news-section">
    <div class="carousel-container">
      <el-carousel height="400px">
        <el-carousel-item v-for="item in carouselItems" :key="item.id">
          <img :src="item.image" :alt="item.title" class="carousel-img" />
        </el-carousel-item>
      </el-carousel>
    </div>
    <!-- 中心动态部分 -->
    <div class="center-news">
      <div class="block-header">
        <h3>
          <i class="fas fa-newspaper header-icon"></i>
          <span class="title-text">中心动态</span>
          <router-link to="/news/center" class="more-link">
            更多<i class="fas fa-angle-right"></i>
          </router-link>
        </h3>
      </div>
      <div class="news-container">
        <div v-for="news in centerNews" :key="news.id" class="news-item">
          <router-link :to="`/news/detail/${news.id}`" class="news-link">
            <div class="news-wrapper">
              <div class="date-block">
                <span class="day">{{ news.date.split("-")[2] }}</span>
                <span class="month-year">{{ news.date.split("-")[1] }}/{{ news.date.split("-")[0].slice(2) }}</span>
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

<script setup>
import { ref } from 'vue';
import carousel1 from "../../assets/images/carousel1.jpg";
import carousel2 from "../../assets/images/carousel2.jpg";
import carousel3 from "../../assets/images/carousel3.jpg";

const carouselItems = ref([
  { id: 1, image: carousel1, title: "新闻1" },
  { id: 2, image: carousel2, title: "新闻2" },
  { id: 3, image: carousel3, title: "新闻3" },
]);

const centerNews = ref([
  {
    id: 1,
    title: "校际协同，星辰引航：'星空下的思政课'开讲",
    date: "2025-04-29",
    url: "https://www.sdszk.cn/home/information/item/2/87",
    summary:
      "青岛理工大学马克思主义学院、理学院联合青岛第五十三中学教育集团，举办'星空下的思政课'大中小学一体化课程思政实践，共同探索大中小学一体化课程思政新方式。把思政课堂与文化实践教学有机结合，推动大中小学一体化课程思政是青岛理工大学近年来着力开展的重点工作，物理作为贯穿大中小学的科学教育，是实现大中小学一体化课程思政的重要课程载体。",
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
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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

.block-header {
  margin-bottom: 20px;
}

.block-header h3 {
  display: flex;
  align-items: center;
  background: linear-gradient(to right, #9a2314, #c44836);
  color: white;
  padding: 12px 20px;
  border-radius: 4px;
  margin: 0;
  font-family: "STZhongsong", "Microsoft YaHei", sans-serif;
  font-size: 20px;
  position: relative;
  transition: all 0.3s ease;
}

.block-header h3:hover {
  transform: scale(1.02);
  background: linear-gradient(to right, #c44836, #9a2314);
}

.header-icon {
  margin-right: 8px;
}

.more-link {
  margin-left: auto;
  font-size: 14px;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  transition: opacity 0.3s ease;
}

.more-link:hover {
  opacity: 0.8;
}

.more-link i {
  margin-left: 4px;
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
  background: #f1f1f1;
  border-radius: 3px;
}

.news-container::-webkit-scrollbar-thumb {
  background: #9a2314;
  border-radius: 3px;
}

.news-container::-webkit-scrollbar-thumb:hover {
  background: #7a1c10;
}

.news-item {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.news-link {
  text-decoration: none;
  color: inherit;
}

.news-wrapper {
  display: flex;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.news-wrapper:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.date-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: 8px;
  background: linear-gradient(to bottom, #9a2314, #c44836);
  border-radius: 6px;
  color: white;
}

.day {
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
}

.month-year {
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.9;
}

.news-content {
  flex: 1;
}

.news-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  transition: color 0.3s ease;
}

.news-wrapper:hover .news-title {
  color: #9a2314;
}

.news-summary {
  margin: 0;
  font-size: 14px;
  color: #909399;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>