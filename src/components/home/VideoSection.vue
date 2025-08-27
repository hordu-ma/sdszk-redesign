<template>
  <div class="video-section">
    <h3>
      <i class="fas fa-video header-icon" />
      <span class="title-text">影像思政</span>
      <router-link to="/resources/video"
class="more-link">
        更多<i class="fas fa-angle-right" />
      </router-link>
    </h3>
    <div class="video-grid">
      <div v-for="video in videos"
:key="video.id" class="video-card">
        <VideoPlayer :src="video.url"
:poster="video.poster" />
        <p class="video-title">
          {{ video.title }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VideoPlayer from "../VideoPlayer.vue";

interface Video {
  id: number;
  title: string;
  url: string;
  poster: string;
}

// 测试数据
const videos = [
  {
    id: 1,
    title: "思政课教学示范",
    url: "https://media.w3.org/2010/05/sintel/trailer.mp4",
    poster: "https://media.w3.org/2010/05/sintel/poster.png",
  },
  {
    id: 2,
    title: "红色文化教育",
    url: "https://media.w3.org/2010/05/bunny/trailer.mp4",
    poster: "https://media.w3.org/2010/05/bunny/poster.png",
  },
  {
    id: 3,
    title: "爱国主义教育",
    url: "https://media.w3.org/2010/05/video/movie_300.mp4",
    poster: "https://media.w3.org/2010/05/video/poster.png",
  },
];
</script>

<style scoped>
.video-section {
  background: var(--background-color, #fff);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: var(--card-shadow, 0 2px 12px rgba(0, 0, 0, 0.1));
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.video-card {
  background: var(--background-color-secondary, #f5f7fa);
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.video-card:hover {
  transform: translateY(-5px);
}

.video-title {
  padding: 15px;
  margin: 0;
  font-size: 16px;
  color: var(--text-color, #303133);
  text-align: center;
}

h3 {
  font-family:
    "STZhongsong", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB",
    "Heiti SC", sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: #333;
  padding: 10px 15px;
  background: rgba(154, 35, 20, 0.05);
  border-left: 4px solid #9a2314;
  margin-bottom: 20px;
  border-radius: 0 4px 4px 0;
  position: relative;
  transition: all 0.3s ease;
}

.header-icon {
  margin-right: 10px;
  color: var(--primary-color, #9a2314);
}

.more-link {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color-light, #909399);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.more-link:hover {
  color: var(--primary-color, #9a2314);
}

.more-link i {
  margin-left: 5px;
}
</style>
