<template>
  <div class="video-section">
    <div class="block-header">
      <h3>
        <div class="title-container">
          <i class="fas fa-video header-icon"></i>
          <span class="title-text">影像思政</span>
        </div>
        <router-link to="/resources/video" class="more-link">
          更多<i class="fas fa-angle-right"></i>
        </router-link>
      </h3>
    </div>
    <div class="video-grid">
      <div v-for="video in videos" :key="video.id" class="video-card">
        <video-player :src="video.url" :poster="video.poster" />
        <p class="video-title">{{ video.title }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from "vue";
import VideoPlayer from "../../components/VideoPlayer.vue";

defineProps({
  videos: {
    type: Array,
    required: true,
  },
});
</script>

<style scoped>
.video-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.block-header {
  margin-bottom: 20px;
}

.block-header h3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
  font-size: 18px;
  color: #333;
}

.title-container {
  display: flex;
  align-items: center;
}

.header-icon {
  margin-right: 8px;
  color: #409eff;
}

.more-link {
  font-size: 14px;
  color: #909399;
  text-decoration: none;
  display: flex;
  align-items: center;
}

.more-link:hover {
  color: #409eff;
}

.more-link i {
  margin-left: 4px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.video-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.video-card:hover {
  transform: translateY(-5px);
}

.video-title {
  margin: 10px;
  font-size: 14px;
  color: #303133;
  line-height: 1.4;
  text-align: center;
}
</style>
