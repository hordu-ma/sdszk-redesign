<template>
  <div class="video-section">
    <block-header title="影像思政" icon-class="fa-video" more-link="/resources/video" />
    <div class="video-grid">
      <div v-for="video in videos" :key="video.id" class="video-card">
        <video-player :src="video.url" :poster="video.poster" />
        <p class="video-title">{{ video.title }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { default as BlockHeader } from '../common/BlockHeader.vue'
import { default as VideoPlayer } from '../VideoPlayer.vue'

interface Video {
  id: number
  url: string
  poster: string
  title: string
}

defineProps<{
  videos: Video[]
}>()
</script>

<style scoped>
.video-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: var(--card-shadow, 0 2px 12px rgba(0, 0, 0, 0.1));
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.video-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--card-shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
  transition: transform 0.3s;
}

.video-card:hover {
  transform: translateY(-5px);
}

.video-title {
  margin: 10px;
  font-size: 14px;
  color: var(--text-color, #303133);
  line-height: 1.4;
  text-align: center;
}
</style>
